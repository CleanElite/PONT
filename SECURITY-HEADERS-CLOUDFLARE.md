# PONT — antete HTTP de securitate (de implementat la proxy, nu în HTML)

Audit real Chromium, 17.11.2026: paginile publice de pe `https://pont.city` au returnat HTTP 200 pe telefon, tabletă, desktop, dar **fără** `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` și `Permissions-Policy`.

**IMPORTANT:** PONT este în prezent publicat prin GitHub Pages. Acest fișier este o procedură, nu o configurare activă. Un fișier `_headers` funcționează pe Cloudflare Pages, **nu** configurează antetele livrate de GitHub Pages. Nu comunica rezolvarea decât după verificarea răspunsurilor HTTP reale.

## Aplicare prin Cloudflare (după conectare/proxy)

1. În Cloudflare DNS, verifică mai întâi certificat HTTPS valid, redirect HTTP→HTTPS, apoi activarea proxy-ului (orange cloud). Transform Rules necesită proxy.
2. Din **Rules → Transform Rules → Managed Transforms**, activează *Add security headers* și verifică rezultatul în browser (inclusiv `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`).
3. Din **Response Header Transform Rules**, poți seta suplimentar pentru `pont.city`:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (doar dacă nu există pagini PONT care trebuie încadrate în iframe)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()` (doar dacă aceste API-uri nu vor fi folosite)
4. Activează **HSTS** după verificarea HTTPS pentru toate subdomeniile relevante. Începe cu `max-age=300`, verifică câteva navigări, apoi crește etapizat. Nu activa `includeSubDomains` sau `preload` până când toate subdomeniile sunt pregătite și configurația finală a fost verificată.
5. Pentru **Content-Security-Policy**, începe cu **Report-Only** și inspectează resursele PONT. Platforma are încă scripturi și stiluri inline, încărcări din Supabase/jsDelivr și navigare externă WhatsApp/Stripe. O CSP strictă lansată fără inventar poate bloca loginul/comenzile/plățile. Abia după eliminarea încălcărilor și testarea tuturor fluxurilor treci la CSP enforced.
6. Reexecută `PONT live browser QA` și verifică antetele în `qa-results/report.json`, la câmpul `security_headers`. Testează și paginile de admin/login, nu doar prima pagină.

## Surse primare
- https://developers.cloudflare.com/rules/transform/response-header-modification/
- https://developers.cloudflare.com/rules/transform/managed-transforms/reference/
- https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/
- https://developers.cloudflare.com/fundamentals/reference/policies-compliances/content-security-policies/

## Reguli de acceptare

- Header-ele sunt efectiv prezente în răspunsurile HTTPS ale `pont.city`.
- Nu se blochează încărcarea meniurilor, evenimentelor, autentificarea, Stripe ori transferul WhatsApp.
- Nu există avertizări CSP reale ignorate pentru fluxurile esențiale.
- Site-ul are în continuare redirecturile verificate și certificat TLS valid.
