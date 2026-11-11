# PONT — Security audit and prelaunch checklist

Last reviewed: 2026-11-11. **Internal notes only — not served as public UI.**

## Verified and implemented
- Supabase RLS enabled on all public tables; cross-restaurant access to menus, dishes, templates and order settings checked using role-scoped SQL simulations.
- Unique membership per restaurant admin user; each account maps to one restaurant.
- Administrative RPC execution restricted from anonymous callers where applicable.
- Restaurant admin online activity moved from public Realtime Presence to RLS-protected database heartbeats; users may only update their own presence.
- WhatsApp order reference now issued atomically inside server-side validation; direct number reservation endpoint revoked.
- Storage image bucket allows only JPEG/PNG/WebP, 2 MB maximum, with restaurant-scoped write policies.
- Failed restaurant login alert: server-side audit and dashboard display (implementation pending test for authenticated attempts).

## Before production launch — mandatory
- Run tests in two actual restaurant sessions simultaneously (A/B), verify direct REST/RPC/Storage calls cannot see/change each other's data; test every INSERT/UPDATE/DELETE endpoint.
- Validate end-to-end WhatsApp checkout with real devices, server-generated order numbers, duplicate requests, concurrency, errors and open/closed ordering windows.
- Implement/verify IP and account-aware login throttling, bot protection, API abuse limits, monitoring and incident response.
- Review Supabase Auth leaked-password checks (plan dependent) and require MFA for super admin. Audit recovery/reset flows.
- Investigate six remaining anonymous SECURITY DEFINER RPC warnings, review all authenticated SECURITY DEFINER functions and permissions, check search_path/RLS safety.
- Evaluate Supabase experimental passkey/WebAuthn for Face ID / Android biometrics; enable in Auth, configure stable RP ID pont.city, verify custom restaurant accounts and signup/recovery before enabling in production.
- Review GitHub Pages/Cloudflare DNS/TLS, CSP, security headers, caching, dependencies/pinned package versions, access to repository and deployment credentials.
- Verify log retention, GDPR legal basis, privacy notice, data access/export/deletion, and incident reporting.
- External penetration test and backup/restore rehearsal; do not claim zero vulnerabilities.
- Verify operator PFA authorization and legal disclosures for PONT.
- Test iOS and Android app installation/distribution and authenticated sessions separately.

## Operational note
This file records pending tasks; it is not evidence all controls are deployed or production-tested.
