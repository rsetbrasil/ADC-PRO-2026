import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getFirebaseApp() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAb8vn7iQ43VwqIHBOHDVA0jnZE-LpFbXU',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'adc-eletro.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'adc-eletro',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'adc-eletro.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '387148226922',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:387148226922:web:6426088ebda884f8820513',
  };

  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp(firebaseConfig);
}

async function maybeSignInWebhookUser() {
  const email = (process.env.FIREBASE_WEBHOOK_EMAIL || '').trim();
  const password = process.env.FIREBASE_WEBHOOK_PASSWORD || '';
  if (!email || !password) return;
  const app = getFirebaseApp();
  const auth = getAuth(app);
  if (auth.currentUser) return;
  await signInWithEmailAndPassword(auth, email, password).catch(() => null);
}

function paymentStatusFromMercadoPago(status: string | undefined): 'Pago' | 'Pendente' | 'Falhou' {
  if (status === 'approved') return 'Pago';
  if (status === 'rejected' || status === 'cancelled') return 'Falhou';
  if (status === 'refunded' || status === 'charged_back') return 'Falhou';
  return 'Pendente';
}

export async function POST(req: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurada.' }, { status: 500 });
  }

  const url = new URL(req.url);
  const raw = await req.text();
  let payload: any = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  const paymentId =
    String(payload?.data?.id || payload?.id || '') ||
    (url.searchParams.get('data.id') || '') ||
    (url.searchParams.get('id') || '');

  if (!paymentId) {
    return NextResponse.json({ error: 'payment_id ausente.' }, { status: 400 });
  }

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const payment = (await mpRes.json().catch(() => null)) as any;
  if (!mpRes.ok) {
    return NextResponse.json({ error: payment?.message || 'Erro ao consultar pagamento no Mercado Pago.' }, { status: 500 });
  }

  const orderId = typeof payment?.external_reference === 'string' ? payment.external_reference : '';
  if (orderId) {
    await maybeSignInWebhookUser();
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const nextPaymentStatus = paymentStatusFromMercadoPago(String(payment?.status || ''));
    const installmentNumberRaw =
      typeof payment?.metadata?.installmentNumber === 'number'
        ? String(payment.metadata.installmentNumber)
        : typeof payment?.metadata?.installmentNumber === 'string'
          ? payment.metadata.installmentNumber
          : '';
    const installmentNumber = Number.parseInt(String(installmentNumberRaw || '').trim(), 10);
    const isInstallmentPayment = Number.isFinite(installmentNumber) && installmentNumber > 0;

    if (isInstallmentPayment && nextPaymentStatus === 'Pago') {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef).catch(() => null);
      const orderData = snap && snap.exists() ? (snap.data() as any) : null;
      const installmentDetails = Array.isArray(orderData?.installmentDetails) ? orderData.installmentDetails : [];

      const paidAmount = Math.max(0, Number(payment?.transaction_amount || 0));
      const paymentDate =
        typeof payment?.date_approved === 'string'
          ? payment.date_approved
          : typeof payment?.date_created === 'string'
            ? payment.date_created
            : new Date().toISOString();

      const paymentIdStr = String(payment?.id || '').trim();

      let didUpdate = false;
      const nextInstallments = installmentDetails.map((inst: any) => {
        if (Number(inst?.installmentNumber) !== installmentNumber) return inst;
        const existingPayments = Array.isArray(inst?.payments) ? inst.payments : [];
        if (paymentIdStr && existingPayments.some((p: any) => String(p?.id || '') === paymentIdStr)) return inst;

        const currentPaid = Number(inst?.paidAmount) || 0;
        const newPaidAmount = currentPaid + paidAmount;
        const isPaid = newPaidAmount + 0.01 >= Number(inst?.amount || 0);
        didUpdate = true;

        return {
          ...inst,
          paidAmount: newPaidAmount,
          status: isPaid ? 'Pago' : 'Pendente',
          paymentDate: isPaid ? (inst?.paymentDate || paymentDate) : inst?.paymentDate,
          payments: [
            ...existingPayments,
            {
              id: paymentIdStr || `mercadopago-${Date.now()}`,
              amount: paidAmount,
              date: paymentDate,
              method: 'MercadoPago',
              receivedBy: 'Sistema',
            },
          ],
        };
      });

      if (didUpdate) {
        const allPaid = nextInstallments.length > 0 && nextInstallments.every((i: any) => i?.status === 'Pago');
        const patch: Record<string, unknown> = { installmentDetails: nextInstallments };
        if (allPaid) patch.paymentStatus = 'Pago';
        await updateDoc(orderRef, patch).catch(() => null);
      }
    } else {
      const patch: Record<string, unknown> = {
        paymentProvider: 'MercadoPago',
        paymentStatus: nextPaymentStatus,
      };

      await updateDoc(doc(db, 'orders', orderId), patch).catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
