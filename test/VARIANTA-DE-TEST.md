# PONT — COPIE DE VERIFICARE (PRELANSARE)

## Regula curentă, până la lansarea către restaurante și public
- `https://pont.city/` este versiunea principală pe care o modificăm.
- `https://pont.city/test/` este copia sincronizată cu versiunea publică.
- Fiecare modificare nouă aprobată pe versiunea principală trebuie aplicată și în `/test/` în aceeași intervenție.
- Nu păstrăm funcții sau evenimente demonstrative diferite în `/test/` cât timp funcționează această regulă.
- Paginile au titluri normale, fără prefix „TEST”. Pagina de start, Meniul zilei și Ieșire în oraș din `/test/` folosesc doar marcaj tehnic `noindex,nofollow`.

## După lansarea publică
Se poate inversa fluxul: dezvoltare în `/test/`, testare, apoi transfer controlat în versiunea principală numai după aprobare explicită.

## Atenționări
- Copia de test **nu** are bază de date izolată: Supabase este comun. Testele care scriu date pot afecta utilizatorii reali.
- Modificările în `/test/` pe ramura `main` declanșează fluxul obișnuit de publicare GitHub Pages, dar nu rescriu automat fișierele publice din rădăcină.
- Nu activați servicii, consum sau planuri suplimentare plătite.
