# PONT — plăți Stripe licitații (Payment Element)

## Flux implementat
1. Super Admin închide licitația lunară (pont_auction_control.is_open=false); clasamentul final este salvat.
2. Pentru restaurantele cu ofertă neplătită în clasamentul final, pagina Promovare afișează „Finalizează plata licitației”.
3. Butonul deschide un dialog în PONT, cu **Stripe Payment Element** (fără Stripe Checkout).
4. Supabase Edge Function „pont-stripe-auctions” autentifică restaurantul, verifică închiderea licitației și ia suma exclusiv din auction_offers.
5. Stripe PaymentIntent este creat cu cheie de idempotency per ofertă și valoare.
6. Doar webhook-ul Stripe `payment_intent.succeeded` verificat criptografic actualizează `auction_offers.payment_status='paid'`, `payment_method='stripe'`, referința și data plății.
7. Dacă plata încasată nu mai corespunde unei oferte valide / clasamentului, backend-ul inițiază refund automat.
8. Plata poate necesita o autentificare 3-D Secure impusă de bancă (chiar dacă formularul rămâne în PONT).

## Configurare înainte de activarea încasărilor
Confirmă contul Stripe comercial corect pentru PONT. Nu asocia automat contul «Clean» cu PONT.

În Supabase → Project Settings / Edge Functions → Secrets setează:
- `STRIPE_SECRET_KEY` = cheia **secretă** Stripe a contului ales, inițial `sk_test_...`
- `STRIPE_PUBLISHABLE_KEY` = cheia **publică** corespunzătoare, `pk_test_...`
- `STRIPE_WEBHOOK_SECRET` = secretul endpointului `whsec_...`

Niciuna dintre aceste chei NU se pune în GitHub Pages sau `config.js`.
Secreturile live trebuie păstrate doar în Supabase, niciodată în cod.

Stripe Dashboard → Developers → Webhooks → Add endpoint:
`https://lzmtwjfsrmhrqceqpsuc.supabase.co/functions/v1/pont-stripe-auctions?action=webhook`

Eveniment: `payment_intent.succeeded`. Setează secretul webhook rezultat în `STRIPE_WEBHOOK_SECRET`.

## Test de acceptanță obligatoriu înainte de LIVE
- În sandbox, închide o licitație de test cu ofertă neplătită și confirmă că panoul apare pentru contul restaurantului.
- Confirmă cu card Stripe de test și verifică webhook-ul; Super Admin trebuie să vadă plata ca `paid` și referința `pi_...`.
- Verifică 3-D Secure, eșec card, reîncercări, dublu-click și notificări webhook repetate.
- Asigură-te că nu se poate plăti o ofertă deschisă, retrasă, modificată sau deja plătită.
- Verifică rambursările automate în cazul unor schimbări ulterioare ale licitației.
- Confirmă datele juridice, fiscale, destinatarul banilor și facturarea înainte de a trece la chei `sk_live_...`.

**Stare curentă:** Funcția este deployată; interfața este publicată în repo. Încasarea efectivă rămâne inactivă până la configurarea secretelor și testele end-to-end.
