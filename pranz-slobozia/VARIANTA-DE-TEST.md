# PONT — VARIANTĂ DE TEST

Folder: `/pranz-slobozia/`
Status: COPIE DE TEST (nefolosită în navigarea principală)

## Producție
Versiunea publică principală se află în rădăcina repository-ului și este accesată de la `https://pont.city/`.
Pagina publică principală trimite utilizatorii către `/meniul-zilei/` și `/iesire-in-oras/` (fără prefixul `pranz-slobozia`).

## Regulă de întreținere
Modificările viitoare se aplică **mai întâi doar variantei principale**. Această copie NU se sincronizează automat; actualizarea pentru test se face numai când este cerută expres, iar testele se desfășoară pe URL-urile cu prefixul `/pranz-slobozia/`.

IMPORTANT: nu ștergeți acest folder fără adaptarea fluxului `.github/workflows/deploy-pages.yml` — acesta verifică existența paginilor secundare și folosește `pranz-slobozia/build_icons.py` la publicare.

Paginile secundare principale (intrarea, meniul zilei, ieșire în oraș) au marcajul `noindex,nofollow` și titlul `TEST` pentru a evita confundarea cu paginile de producție.
