import { buildInvoice, type Invoice, type OrderCreated } from "./invoice.ts";

/**
 * Issues invoices with consecutive numbers. An invoice can never be issued twice for the
 * same order: the queue is at-least-once, so the order id is the idempotency key.
 */
export class Ledger {
  private readonly byOrder = new Map<string, Invoice>();

  issue(event: OrderCreated): { invoice: Invoice; isNew: boolean } {
    const existing = this.byOrder.get(event.orderId);
    if (existing) return { invoice: existing, isNew: false };

    const invoice = buildInvoice(event, this.byOrder.size + 1);
    this.byOrder.set(event.orderId, invoice);
    return { invoice, isNew: true };
  }

  all(): Invoice[] {
    return [...this.byOrder.values()];
  }
}
