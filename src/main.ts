import { FileQueueConsumer } from "./queue.ts";
import { Ledger } from "./ledger.ts";
import type { Invoice, OrderCreated } from "./invoice.ts";

const queueDir = process.env.BREWLY_QUEUE_DIR ?? "/tmp/brewly-queue";
const consumer = new FileQueueConsumer(queueDir, "orders.created", "invoicing");
const ledger = new Ledger();

const money = (cents: number) => (cents / 100).toFixed(2);

function print(invoice: Invoice): void {
  console.log(
    [
      `\n🧾 ${invoice.number}  (order ${invoice.orderId.slice(0, 8)}, ${invoice.customerEmail})`,
      `   Net:    ${money(invoice.netCents)} ${invoice.currency}`,
      `   VAT ${invoice.vatRate}%: ${money(invoice.vatCents)} ${invoice.currency}`,
      `   Total:  ${money(invoice.totalCents)} ${invoice.currency}\n`,
    ].join("\n"),
  );
}

console.log(`invoicing consuming orders.created from ${queueDir}`);
setInterval(
  () =>
    consumer
      .poll(async (payload) => {
        const { invoice, isNew } = ledger.issue(payload as OrderCreated);
        if (isNew) print(invoice);
      })
      .catch((err) => console.error("invoicing:", err)),
  500,
);
