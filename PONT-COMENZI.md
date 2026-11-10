# Protocolul comenzilor PONT

- PONT bun este versiunea de referință de pe ramura `pont-bun`, commit `b9f30610dd25143d472a95b39c4999a02a39b3aa`. Păstrează reperul fix.
- Numerotează în ordine comenzile de modificare `c1`, `c2`, `c3` etc. Prima comandă de modificare după stabilirea protocolului este `c1`.
- Înainte de fiecare comandă, salvează versiunea publicată pe o ramură separată `backup/cN`. Dacă modificarea atinge baza de date, salvează separat și datele afectate, fără a publica date private în GitHub.
- Notează identificatorul comenzii și versiunea publicată rezultată. Continuă numerotarea după o revenire.
- «Anulează comanda c5» înseamnă restaurarea stării dinaintea c5, adică a rezultatului c4, și verificarea versiunii publicate. «Revino la PONT bun» înseamnă restaurarea versiunii de referință. Înaintea unei reveniri, salvează și starea curentă.
