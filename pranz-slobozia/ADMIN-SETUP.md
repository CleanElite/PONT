# PONT — administrare multi-restaurant

## Panouri
- Super Admin: /pranz-slobozia/super-admin/
- Restaurant: /pranz-slobozia/admin-v2/
- Site public: /pranz-slobozia/

## Stare
Interfețele sunt publicate în cod și folosesc autentificare Supabase. Nu sunt funcționale până la configurarea unei baze Supabase, rularea `admin/schema.sql`, configurarea URL/cheii anon publicabile și crearea conturilor. Nu există parole hardcodate. Vechiul panou /admin/ Cloudflare și /admin-demo/ nu sunt înlocuite automat.

## Activare
1. Creează un proiect Supabase, apoi rulează `pranz-slobozia/admin/schema.sql` în SQL Editor. Verifică politicile RLS.
2. Copiază URL-ul proiectului și cheia **anon/publishable** în `super-admin/config.js` și `admin-v2/config.js`. Nu folosi cheia service_role.
3. Creează utilizatorii prin Supabase Authentication. Primul Super Admin trebuie atribuit manual prin SQL, folosind UUID-ul exact din Auth:
```sql
insert into public.profiles(user_id,role) values ('UUID_USER','super_admin');
```
4. Creează restaurante în Super Admin. Asociază UUID-urile utilizatorilor cu restaurantele prin fila Conturi restaurante. Creează profiluri pentru parteneri:
```sql
insert into public.profiles(user_id,role) values ('UUID_PARTENER','restaurant');
```
5. Testează două conturi distincte și verifică accesul interzis la datele altui restaurant.

## Important
Publicarea meniurilor în site-ul public existent necesită integrarea paginilor publice cu tabelul `menus` și modelul de date existent. În prezent, meniurile din aceste dashboarduri nu modifică automat paginile publice. Funcțiile de comenzi, notificări, audit și licitații necesită implementare separată. Nu considera sistemul pregătit pentru clienți înaintea testelor end-to-end.
