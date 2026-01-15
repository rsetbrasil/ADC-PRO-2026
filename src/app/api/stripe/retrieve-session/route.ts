import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY não configurada.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = (searchParams.get('session_id') || '').trim();
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id é obrigatório.' }, { status: 400 });
  }

  const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    cache: 'no-store',
  });

  const data = (await stripeRes.json().catch(() => null)) as any;
  if (!stripeRes.ok) {
    return NextResponse.json(
      { error: data?.error?.message || 'Erro ao consultar sessão no Stripe.' },
      { status: stripeRes.status }
    );
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    payment_status: data.payment_status,
    amount_total: data.amount_total,
    currency: data.currency,
    client_reference_id: data.client_reference_id,
    metadata: data.metadata || null,
  });
}

