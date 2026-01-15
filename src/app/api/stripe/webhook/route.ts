import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
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

function safeEqualsHex(a: string, b: string) {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function verifyStripeSignature(payload: string, signatureHeader: string, webhookSecret: string) {
  const parts = signatureHeader
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac('sha256', webhookSecret).update(signedPayload, 'utf8').digest('hex');

  return signatures.some((sig) => safeEqualsHex(sig, expected));
}

function paymentStatusFromStripe(paymentStatus: string | undefined): 'Pago' | 'Pendente' | 'Falhou' {
  if (paymentStatus === 'paid') return 'Pago';
  if (paymentStatus === 'unpaid') return 'Pendente';
  return 'Pendente';
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET não configurada.' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
  }

  const event = (JSON.parse(rawBody) as any) || null;
  const eventType = String(event?.type || '');
  const session = event?.data?.object as any;

  const sessionId = typeof session?.id === 'string' ? session.id : '';
  const orderId =
    (typeof session?.metadata?.orderId === 'string' ? session.metadata.orderId : '') ||
    (typeof session?.client_reference_id === 'string' ? session.client_reference_id : '');

  const shouldUpdate =
    eventType === 'checkout.session.completed' ||
    eventType === 'checkout.session.async_payment_succeeded' ||
    eventType === 'checkout.session.async_payment_failed';

  if (shouldUpdate && orderId) {
    await maybeSignInWebhookUser();
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const nextPaymentStatus =
      eventType === 'checkout.session.async_payment_failed'
        ? 'Falhou'
        : paymentStatusFromStripe(String(session?.payment_status || ''));

    const installmentNumberRaw = typeof session?.metadata?.installmentNumber === 'string' ? session.metadata.installmentNumber : '';
    const installmentNumber = Number.parseInt(installmentNumberRaw, 10);
    const isInstallmentPayment = Number.isFinite(installmentNumber) && installmentNumber > 0;

    if (isInstallmentPayment && nextPaymentStatus === 'Pago') {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef).catch(() => null);
      const orderData = snap && snap.exists() ? (snap.data() as any) : null;
      const installmentDetails = Array.isArray(orderData?.installmentDetails) ? orderData.installmentDetails : [];

      const paidAmount = Math.max(0, Number(session?.amount_total || 0) / 100);
      const paymentDate =
        typeof session?.created === 'number' && Number.isFinite(session.created)
          ? new Date(session.created * 1000).toISOString()
          : new Date().toISOString();

      let didUpdate = false;
      const nextInstallments = installmentDetails.map((inst: any) => {
        if (Number(inst?.installmentNumber) !== installmentNumber) return inst;
        const existingPayments = Array.isArray(inst?.payments) ? inst.payments : [];
        if (sessionId && existingPayments.some((p: any) => String(p?.id || '') === sessionId)) return inst;

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
              id: sessionId || `stripe-${Date.now()}`,
              amount: paidAmount,
              date: paymentDate,
              method: 'Stripe',
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
        paymentProvider: 'Stripe',
        paymentStatus: nextPaymentStatus,
      };
      if (sessionId) patch.paymentSessionId = sessionId;

      await updateDoc(doc(db, 'orders', orderId), patch).catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
