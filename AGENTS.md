# invoicing

This repo is part of the Brewly ecosystem. The shared rules, the system map and the
specs live in ../AGENTS.md, ../docs/ and ../openspec/. Start the agent from the ecosystem
root, not from inside this repo.

Consumes `orders.created` and issues the customer's invoice. **Sensitive area:** read
../docs/product/sensitive-areas.md and ../docs/product/constraints.md before any change.

## Commands

- Install: `npm install` (only needed for lint; tests run with plain Node 22)
- Tests: `npm test` (single test: `node --test test/invoice.test.ts`)
- Lint: `npm run lint` (type check with `tsc --noEmit`)
- Build: none: Node runs the TypeScript sources directly
- Run: `npm start` (prints invoices; `BREWLY_QUEUE_DIR` sets the queue folder)

## Conventions

- No runtime dependencies. Only erasable TypeScript; relative imports end in `.ts`.
- Money is always an integer number of cents. Rounding happens once, on the VAT amount.
- Invoice numbers are consecutive and never reused. An order never gets two invoices.

## Do not touch without asking

- `invoiceNumber` and the numbering in `src/ledger.ts`: invoice numbers are a legal record.
- `VAT_RATE`: tax changes go through the accountant first.
