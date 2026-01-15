import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CreateCheckoutSessionBody = {
  orderId: string;
  items: Array<{ name: string; quantity: number; unitAmount: number }>;
  customer?: { name?: string; email?: string };
  successUrl: string;
  cancelUrl: string;
  installmentNumber?: number;
};

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY não configurada.' }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as CreateCheckoutSessionBody | null;
  if (!body?.orderId || !Array.isArray(body.items) || body.items.length === 0 || !body.successUrl || !body.cancelUrl) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', body.successUrl);
  params.set('cancel_url', body.cancelUrl);
  params.set('client_reference_id', body.orderId);
  params.set('metadata[orderId]', body.orderId);
  if (typeof body.installmentNumber === 'number' && Number.isFinite(body.installmentNumber)) {
    params.set('metadata[installmentNumber]', String(body.installmentNumber));
  }

  const email = (body.customer?.email || '').trim();
  if (email) {
    params.set('customer_email', email);
  }

  body.items.forEach((item, idx) => {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const unitAmount = Math.max(0, Math.round((Number(item.unitAmount) || 0) * 100));

    params.set(`line_items[${idx}][quantity]`, String(quantity));
    params.set(`line_items[${idx}][price_data][currency]`, 'brl');
    params.set(`line_items[${idx}][price_data][unit_amount]`, String(unitAmount));
    params.set(`line_items[${idx}][price_data][product_data][name]`, String(item.name || 'Item'));
  });

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  const data = (await stripeRes.json().catch(() => null)) as any;
  if (!stripeRes.ok) {
    return NextResponse.json(
      { error: data?.error?.message || 'Erro ao criar sessão no Stripe.' },
      { status: stripeRes.status }
    );
  }

  return NextResponse.json({ id: data.id, url: data.url });
}
