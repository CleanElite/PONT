# PONT Restaurant Admin — configurare

Administrarea se face într-o interfață separată, la `pranz-slobozia/admin/`, dar **protejarea interfeței nu înseamnă securizarea API-ului**. Toate rutele /api/admin/* verifică semnătura JWT Cloudflare Access și emailul autorizat din D1. Fiecare administrator vede și modifică doar restaurantul atribuit.

## Pași obligatorii înainte de lansare
1. Configurează Cloudflare D1 și aplică migrările `0001-menus.sql` și `0002-admin.sql`.
2. Creează aplicația Cloudflare Access pentru domeniul Worker-ului, cu politici de acces limitate la administratorii aprobați. Configurează `ACCESS_TEAM_DOMAIN` (ex. `echipa.cloudflareaccess.com`) și `ACCESS_AUD` ca secrete/configurație Worker.
3. Introdu fiecare restaurant în `restaurants`, apoi atribuie emailul administratorului în `restaurant_admins`. Nu include emailurile în GitHub.
4. Publică Worker-ul, configurează `ALLOWED_ORIGINS` și setează `API_BASE_URL` în fișierul de configurare al paginii de administrare.
5. Dacă frontend-ul și Worker-ul au domenii diferite, folosește autentificare Access la nivel de domeniu/API și verifică transmiterea credențialelor. Recomandat: servește interfața de administrare din același domeniu protejat ca API-ul, pentru a evita blocajele cookie/CORS.
6. Testează izolarea între restaurante, expirarea tokenurilor, editările concurente și datele afișate public.

## Model de meniu
Un meniu are data, ciorbă/supă, fel principal, preț meniu complet, prețuri individuale opționale, alergeni, livrare, plată cu cardul și stare (ciornă/publicat/epuizat). Restaurantul poate pregăti meniuri pentru toate zilele săptămânii.

**Stadiu:** cod în GitHub, nepublicat pe infrastructură Cloudflare. Nu introduce comenzi reale până la configurare și testare.
