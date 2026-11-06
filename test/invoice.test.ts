import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInvoice, invoiceNumber, splitVat } from "../src/invoice.ts";
import { Ledger } from "../src/ledger.ts";

const event = { orderId: "o-1", customerEmail: "ana@example.com", totalCents: 12100, createdAt: "2026-11-05T10:00:00.000Z" };

test("splitVat separates the 21% VAT included in the total", () => {
  assert.deepEqual(splitVat(12100), { netCents: 10000, vatCents: 2100 });
});

test("splitVat rounds the VAT to the cent and keeps net + vat = total", () => {
  const { netCents, vatCents } = splitVat(2999);
  assert.equal(vatCents, 520);
  assert.equal(netCents + vatCents, 2999);
});

test("invoiceNumber is padded and prefixed with the year", () => {
  assert.equal(invoiceNumber(2026, 7), "INV-2026-0007");
});

test("buildInvoice issues a EUR invoice with the VAT breakdown", () => {
  assert.deepEqual(buildInvoice(event, 1), {
    number: "INV-2026-0001",
    orderId: "o-1",
    customerEmail: "ana@example.com",
    issuedAt: "2026-11-05T10:00:00.000Z",
    currency: "EUR",
    totalCents: 12100,
    netCents: 10000,
    vatRate: 21,
    vatCents: 2100,
  });
});

test("an event published before currencies existed still gets an EUR invoice", () => {
  const invoice = buildInvoice({ ...event, currency: undefined, eurExchangeRate: undefined }, 1);
  assert.equal(invoice.currency, "EUR");
  assert.equal(invoice.vatCents, 2100);
});

test("a GBP order gets a GBP invoice with net and VAT in GBP", () => {
  const invoice = buildInvoice({ ...event, currency: "GBP", eurExchangeRate: 1.17 }, 1);
  assert.equal(invoice.currency, "GBP");
  assert.deepEqual(
    { total: invoice.totalCents, net: invoice.netCents, vat: invoice.vatCents },
    { total: 12100, net: 10000, vat: 2100 },
  );
});

test("a non-EUR invoice also states the VAT in EUR with the order's exchange rate", () => {
  const invoice = buildInvoice({ ...event, currency: "GBP", eurExchangeRate: 1.17 }, 1);
  assert.equal(invoice.vatEurCents, 2457);
  assert.equal(invoice.eurExchangeRate, 1.17);
});

test("an EUR invoice has no separate VAT in EUR", () => {
  const invoice = buildInvoice({ ...event, currency: "EUR", eurExchangeRate: 1 }, 1);
  assert.equal("vatEurCents" in invoice, false);
  assert.equal("eurExchangeRate" in invoice, false);
});

test("the ledger numbers invoices consecutively", () => {
  const ledger = new Ledger();
  ledger.issue(event);
  const { invoice } = ledger.issue({ ...event, orderId: "o-2" });
  assert.equal(invoice.number, "INV-2026-0002");
});

test("the ledger never issues two invoices for the same order", () => {
  const ledger = new Ledger();
  ledger.issue(event);
  const second = ledger.issue(event);

  assert.equal(second.isNew, false);
  assert.equal(ledger.all().length, 1);
});
