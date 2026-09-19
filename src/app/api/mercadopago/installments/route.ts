import { NextRequest, NextResponse } from "next/server";

type MpInstallmentPlan = {
  installments: number;
  installment_rate: number;
  installment_amount: number;
  total_amount: number;
  recommended_message?: string;
};

type MpInstallmentsResponse = {
  payment_method_id: string;
  payment_type_id: string;
  issuer?: { id: string; name: string };
  payer_costs?: MpInstallmentPlan[];
};

export type InstallmentOption = {
  issuer: string;
  paymentMethodId: string;
  installments: number;
  interestFree: boolean;
  installmentAmount: number;
  totalAmount: number;
  message?: string;
};

// Cards that reliably have Argentine installment/interest-free campaigns on
// Mercado Pago; used as the query set when the buyer hasn't typed a card
// number yet (no `bin` available to ask MP for the exact issuer).
const DEFAULT_PAYMENT_METHOD_IDS = ["visa", "master", "amex"];

const REVALIDATE_SECONDS = 60 * 30;

async function fetchInstallments(params: URLSearchParams) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payment_methods/installments?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      next: { revalidate: REVALIDATE_SECONDS },
    }
  );

  if (!response.ok) {
    return [] as MpInstallmentsResponse[];
  }

  const data = (await response.json()) as MpInstallmentsResponse[];
  return Array.isArray(data) ? data : [];
}

function normalize(entries: MpInstallmentsResponse[]): InstallmentOption[] {
  const options: InstallmentOption[] = [];

  for (const entry of entries) {
    for (const plan of entry.payer_costs ?? []) {
      // 1 cuota (pago único) siempre tiene installment_rate 0 en la API de
      // MP — es matemáticamente cierto pero no es un plan de financiación
      // real, así que casi cualquier tarjeta/emisor "califica". Mostrarlo
      // como "cuotas sin interés" infla el máximo mostrado a "Hasta 1x" y
      // llena la lista de bancos con decenas de emisores que no ofrecen
      // ningún plan de cuotas de verdad. Se descarta acá, en el único lugar
      // que arma esta data, para que ningún consumidor tenga que repetir
      // este filtro.
      if (plan.installments <= 1) continue;

      options.push({
        issuer: entry.issuer?.name ?? "Mercado Pago",
        paymentMethodId: entry.payment_method_id,
        installments: plan.installments,
        interestFree: plan.installment_rate === 0,
        installmentAmount: plan.installment_amount,
        totalAmount: plan.total_amount,
        message: plan.recommended_message,
      });
    }
  }

  return options;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get("amount");
  const bin = searchParams.get("bin");
  const paymentMethodId = searchParams.get("paymentMethodId");

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json({ configured: false, options: [] });
  }

  const amountValue = Number(amount);
  if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
    return NextResponse.json(
      { error: "Parámetro 'amount' inválido" },
      { status: 400 }
    );
  }

  try {
    let raw: MpInstallmentsResponse[] = [];

    if (bin) {
      const params = new URLSearchParams({ amount: String(amountValue), bin });
      raw = await fetchInstallments(params);
    } else if (paymentMethodId) {
      const params = new URLSearchParams({
        amount: String(amountValue),
        payment_method_id: paymentMethodId,
      });
      raw = await fetchInstallments(params);
    } else {
      const results = await Promise.all(
        DEFAULT_PAYMENT_METHOD_IDS.map((id) =>
          fetchInstallments(
            new URLSearchParams({
              amount: String(amountValue),
              payment_method_id: id,
            })
          )
        )
      );
      raw = results.flat();
    }

    const options = normalize(raw).sort((a, b) => a.installments - b.installments);
    const interestFreeIssuers = Array.from(
      new Set(options.filter((option) => option.interestFree).map((option) => option.issuer))
    );

    return NextResponse.json({
      configured: true,
      available: options.length > 0,
      options,
      interestFreeIssuers,
    });
  } catch (error) {
    console.error("Error consultando cuotas de Mercado Pago:", error);
    return NextResponse.json({ configured: true, available: false, options: [] });
  }
}
