# PromillePlan – statisk kopi af promilleplan.dk

Tro kopi af Squarespace-siden [promilleplan.dk](https://promilleplan.dk), klar til GitHub Pages.
Ren HTML/CSS/JS – ingen build-trin.

## Sider

| Sti | Indhold |
|---|---|
| `/` og `/forside` | Forside ("PromillePlan kommer snart") |
| `/privatliv/` | Privatlivspolitik |
| `/vilkaar/` | Vilkår og ansvar |
| `/support/` | Support |
| `/slet-data/` | Slet data |

Alle Squarespace-filer (CSS, JS, skrifttyper, billeder) ligger lokalt i `assets/`, så siden ikke afhænger
af Squarespaces servere. Alle stier er relative, så siden virker både på `<bruger>.github.io/<repo>/` og på eget domæne.

## Udgiv på GitHub Pages

1. Opret et nyt repository på github.com og push dette repo til det (se nedenfor).
2. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, mappe `/ (root)`.
3. Siden er live på `https://<bruger>.github.io/<repo>/` efter et minut.

### Eget domæne (promilleplan.dk)

Først når siden er testet på github.io-adressen:

1. **Settings → Pages → Custom domain**: skriv `promilleplan.dk`. GitHub opretter filen `CNAME`.
2. Ret DNS hos domæneudbyderen (fx A-records til GitHub Pages' IP-adresser). Se GitHubs guide *"Managing a custom domain for your GitHub Pages site"*.
3. Slå **Enforce HTTPS** til, når GitHub har udstedt certifikatet.

Domænet skal først flyttes, når du er klar til at slukke Squarespace – indtil da peger det stadig på den gamle side.

## Kend forskellene til Squarespace

- Siden er **statisk**: der er ingen redigering online. Ret i HTML-filerne (eller kør `tools/mirror.mjs` igen, hvis
  du stadig redigerer i Squarespace – det overskriver alle filer og `assets/`).
- Squarespaces egen statistik (`/api/census/RecordHit`) svarer 404 og gør ingenting. Det er ufarligt.
- Google Analytics (`G-PR4M1K4M94`) er bevaret som på originalen. Fjern `gtag`-scriptet i `<head>`, hvis du ikke vil have det.
- Cart-koden fra Squarespace følger med, men er inaktiv (siden har ingen webshop).

## Værktøjer

```bash
node tools/serve.mjs "$(pwd)" 4173   # lokal test på http://127.0.0.1:4173
node tools/mirror.mjs "$(pwd)"       # hent siden fra Squarespace igen (kun hvis originalen ændres)
```

Test lokalt på `127.0.0.1`, ikke `localhost` – Squarespace-koden har en særregel for `localhost`.
