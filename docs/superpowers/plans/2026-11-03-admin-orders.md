# Admin Orders Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task in the current workspace.

**Goal:** Show approximate checkout city beneath Deliver to in a modern full-width order workspace.

**Architecture:** Capture coarse request geolocation at checkout and persist it as staff-only order metadata. Replace the drawer with a responsive detail component while retaining the list's state and existing order mutations.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mongoose, Tailwind, existing admin primitives and Lucide icons.

**Spec:** `docs/superpowers/specs/2026-11-03-admin-orders-design.md`

## Global constraints
- Existing permissions and restock confirmation remain effective.
- No new dependencies. No raw IP persistence. No invented historical location.
- Checkout succeeds even if the HTTPS lookup fails; local/private IPs skip lookup.

## Review focus
- A location lookup must never resolve the server IP when the client IP is missing.
- IPv4-mapped IPv6 and private networks cannot be sent to the provider.
- Buyer/guest/vendor responses must not expose staff-only metadata.
- Filter changes and order saves must not reset unsaved edits unexpectedly.
- Narrow screens and cancelled/returned orders must remain readable and honest.

### Task 1: Checkout location
Files: `src/server/orders/location.ts`, `src/types/index.ts`, `src/server/db/models/order.model.ts`, `app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`, `tests/order-location.test.mjs`.

Interface: `captureOrderLocation(headers: Headers, options?)` returns coarse location or an unavailable/private-network status. `orderLocation` is excluded from normal database projections and JSON serialization; authorized staff explicitly select and serialize it.

- [x] Write lookup tests covering public IPv4/IPv6, private/reserved inputs, trusted platform metadata, provider rejection/malformed responses/timeouts and unavailable inputs; run and confirm failure.
- [x] Implement capture, model/type persistence and explicit staff serialization in list/detail/PATCH. Checkout ignores client-supplied metadata.
- [x] Run `node --test tests/*.test.mjs` and verify all tests pass.

### Task 2: Order workspace
Files: `src/components/admin/OrderManagementModule.tsx`, `src/components/admin/orders/OrderDetails.tsx`, `src/components/admin/orders/types.ts`, `src/components/admin/shared.tsx`, `scripts/verify-orders.browser.cjs`.

- [x] Extract shared order types; replace the drawer with full-width details and preserve list state.
- [x] Add city card beneath delivery, fulfillment progress, summary, contact/copy/tracking actions and existing editable courier/payment/internal notes.
- [x] Add payment-status filter, filter reset, status summary navigation and city export.
- [x] Type-check, run a production build in `.next-verify`, and browser-check desktop/mobile with representative data, legacy/unavailable location, permissions and save/back behavior.

### Completion
- [x] Review the diff for privacy, safe links and mutation behavior; record actual verification outcomes and any limitations.

## Verification record

- Lookup tests were observed failing before implementation; all 16 automated tests now pass, including existing catalog tests and new order API privacy tests.
- TypeScript passes with `--noEmit --incremental false`.
- The final production build using `NEXT_DIST_DIR=.next-verify` passes (74 static pages generated). Existing Fast Refresh and Next ESLint configuration warnings remain.
- Targeted ESLint passes with no errors; shared admin primitives retain their existing Fast Refresh warnings.
- Browser checks pass against real order components using isolated sample responses: full-width details, city beneath Deliver to, clipboard, safe tracking, CSV, payment filter/reset, status/payment/note saves, cancellation/restock choice, invoices, read-only roles, unsaved edits, legacy/private-network location and 390px/320px layouts. No browser errors. Temporary fixture routes are removed automatically.
- The local development server was restarted and its live order schema was confirmed to contain `orderLocation`.
- Location is approximate, only captured on new orders, and unavailable for localhost/private networks or failed providers. No real orders were created or modified during verification.
