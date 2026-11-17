# Admin order workspace

The user approved the recommended full-width order details view. Replace the drawer with a responsive workspace inside the existing Orders tab, with Back to orders preserving list filters. Put an approximate IP-based city card immediately beneath Deliver to. Capture city, region, country, source and capture time on new checkout requests; never substitute the shipping district or the server's location. Older orders and localhost show an honest unavailable state. Location failure must not block checkout. Only staff with orders.view receive the metadata.

Keep the current admin theme and existing permissions. Add a fulfillment progress display, clear order/payment summaries, copy address/order number, call/email, safe tracking links, payment-status filtering, reset filters and invoice actions. Retain status changes, cancellation/restocking, payment updates, courier details, internal notes, exports and pagination.

Approaches considered: full-width details (recommended and approved, enough room for delivery and fulfillment); row expansion (compact but cramped). Keep confirmation dialogs for destructive status changes. Avoid new dependencies and fabricated historical progress dates.

Implementation choices: use trusted Vercel geo headers on Vercel, otherwise resolve the checkout request's validated public IP through the HTTPS ipwho.is endpoint with a short timeout. Store coarse location only. Local/private/reserved IPs are never sent for lookup. Read-only metadata cannot be edited by checkout payloads or order PATCH requests.

Verify lookup failures, private/IPv6 inputs, staff visibility, saved schema metadata, desktop/mobile workspace behavior and existing order actions. Use the current checkout API and Mongoose model; legacy unused TanStack endpoints are outside this change.
