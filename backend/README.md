# PONT — backend, faza 1

Acest director conține o bază de date D1 (0001-menus.sql) și un Cloudflare Worker read-only (worker.js).

## Înainte de activare
1. Creează o bază D1 în contul Cloudflare și configurează binding-ul DB în wrangler.toml cu ID-ul real.
2. Aplică migrarea 0001-menus.sql folosind Wrangler, după revizuire.
3. Configurează ALLOWED_ORIGINS cu originea exactă a site-ului PONT.
4. Publică Worker-ul și testează GET /api/health și GET /api/menus.
5. Configurează în frontend URL-ul real al API-ului numai după verificarea datelor.
6. Nu introduce date demonstrative în producție.

API-ul întoarce exclusiv meniurile publicate/sold_out pentru ziua curentă din fusul Europe/Bucharest. Nu colectează datele clienților. Nu există încă panou de administrare, autentificare, editare de meniuri sau confirmare de comandă; acestea necesită implementare și testare înainte de lansare.

Nu pune chei API, parole sau date personale în repository.
