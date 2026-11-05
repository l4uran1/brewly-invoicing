/** Payload of `orders.created`, as published by orders-api (see docs/system-map.md). */
export type OrderCreated = {
  orderId: string;
  customerEmail: string;
  totalCents: number;
  createdAt: string;
};

export type Invoice = {
  number: string;
  orderId: string;
  customerEmail: string;
  issuedAt: string;
  currency: "EUR";
  /** Prices include VAT: total = net + vat. */
  totalCents: number;
  netCents: number;
  vatRate: number;
  vatCents: number;
};

/** Spanish standard VAT rate. Every Brewly order ships from Spain. */
export const VAT_RATE = 21;

/** Splits a VAT-inclusive total into net and VAT, rounding the VAT to the cent. */
export function splitVat(totalCents: number, rate: number = VAT_RATE): { netCents: number; vatCents: number } {
  const vatCents = Math.round((totalCents * rate) / (100 + rate));
  return { netCents: totalCents - vatCents, vatCents };
}

export function invoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}

export function buildInvoice(event: OrderCreated, sequence: number): Invoice {
  const year = new Date(event.createdAt).getUTCFullYear();
  return {
    number: invoiceNumber(year, sequence),
    orderId: event.orderId,
    customerEmail: event.customerEmail,
    issuedAt: event.createdAt,
    currency: "EUR",
    totalCents: event.totalCents,
    ...splitVat(event.totalCents),
    vatRate: VAT_RATE,
  };
}
