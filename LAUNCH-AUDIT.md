# PONT — audit înainte de lansarea comercială (2026-11-06)

## Blocaje critice
- [ ] Cloudflare D1 creat, migrațiile aplicate și API-ul publicat.
- [ ] Cloudflare Access configurat pentru panoul administratorilor; interfața admin nu se publică pe GitHub Pages.
- [ ] Validare end-to-end: un restaurant nu poate vedea sau edita meniurile altuia.
- [ ] Înlocuiește `samples` din `pranz-slobozia/meniul-zilei/index.html` cu datele API; nu afișa date demonstrative ca oferte reale.
- [ ] Testează starea fără meniuri, erorile de rețea și meniurile epuizate.
- [ ] Confirmă numerele WhatsApp și afișează clar că solicitarea nu este o comandă confirmată.
- [ ] Testează complet pe mobil și desktop; verifică accesibilitatea tastaturii.
- [ ] Confirmă că publicarea GitHub Pages a reușit și verifică adresa reală.
- [ ] Verifică exact documentele juridice aprobate și datele operatorului în versiunea publicată.

## Administrarea restaurantelor
- [ ] Conturi reale autorizate; procedură de suspendare/revocare.
- [ ] Panou principal al operatorului PONT, separat de rolul restaurantului.
- [ ] Meniuri pe săptămână, inclusiv publicare programată, disponibilitate și alergeni.
- [ ] Prevenire erori de editare și suprascrieri concurente; jurnal de modificări.
- [ ] Copii de siguranță și procedură de recuperare.

## Licitații publicitare
- [ ] Reguli scrise: perioadă, minim 50 lei, pas, departajare, anulare, câștigător, facturare.
- [ ] API de licitare cu verificări server-side și prevenire oferte duplicate.
- [ ] Politică de plată și neplată; confirmare înainte de atribuirea spațiului.
- [ ] Afișează public marcajul «Promovat» / «Publicitate».
- [ ] Testează ierarhia locurilor publicitare pe mobil și desktop.

## Decizii tehnice
- Păstrează aplicația publică PONT, dar protejează administrarea pe același domeniu sub o rută cu acces controlat.
- Nu publica directorul `admin` pe hosting static public.
- Nu activa licitații sau comenzi reale înainte de testele de securitate.
