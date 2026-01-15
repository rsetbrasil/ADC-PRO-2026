import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getBaseUrlFromRequest(req: Request) {
  const proto = (req.headers.get('x-forwarded-proto') || '').split(',')[0]?.trim() || '';
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0]?.trim() || '';

  if (host) {
    const scheme = proto || 'https';
    return `${scheme}://${host}`.replace(/\/$/, '');
  }

  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').trim().replace(/\/$/, '');
  return fromEnv || '';
}

type CreatePreferenceBody = {
  orderId: string;
  items: Array<{ title: string; quantity: number; unit_price: number }>;
  customer?: { name?: string; email?: string };
  backUrls: { success: string; pending: string; failure: string };
  installmentNumber?: number;
};

export async function POST(req: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurada.' }, { status: 500 });
  }

  const body = (await req.json().catch(() => null)) as CreatePreferenceBody | null;
  if (!body?.orderId || !Array.isArray(body.items) || body.items.length === 0 || !body.backUrls) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const items = body.items.map((i) => ({
    title: String(i.title || 'Item'),
    quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
    unit_price: Math.max(0, Number(i.unit_price) || 0),
    currency_id: 'BRL',
  }));

  const payload: any = {
    items,
    external_reference: body.orderId,
    back_urls: body.backUrls,
    auto_return: 'approved',
    metadata: {
      orderId: body.orderId,
      ...(typeof body.installmentNumber === 'number' && Number.isFinite(body.installmentNumber)
        ? { installmentNumber: body.installmentNumber }
        : {}),
    },
  };

  const baseUrl = getBaseUrlFromRequest(req);
  if (baseUrl) {
    payload.notification_url = `${baseUrl}/api/mercadopago/webhook`;
  }

  const email = (body.customer?.email || '').trim();
  if (email) {
    payload.payer = { email };
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const data = (await mpRes.json().catch(() => null)) as any;
  if (!mpRes.ok) {
    return NextResponse.json(
      { error: data?.message || data?.error || 'Erro ao criar preferência no Mercado Pago.' },
      { status: mpRes.status }
    );
  }

  return NextResponse.json({ id: data.id, init_point: data.init_point });
}
