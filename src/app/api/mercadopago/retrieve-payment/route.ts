import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurada.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const paymentId = (searchParams.get('payment_id') || '').trim();
  if (!paymentId) {
    return NextResponse.json({ error: 'payment_id é obrigatório.' }, { status: 400 });
  }

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  const data = (await mpRes.json().catch(() => null)) as any;
  if (!mpRes.ok) {
    return NextResponse.json(
      { error: data?.message || data?.error || 'Erro ao consultar pagamento no Mercado Pago.' },
      { status: mpRes.status }
    );
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    status_detail: data.status_detail,
    transaction_amount: data.transaction_amount,
    external_reference: data.external_reference,
    preference_id: data.order?.id || data.preference_id || null,
  });
}

