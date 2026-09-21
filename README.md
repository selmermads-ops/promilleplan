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

Domænet er registreret hos **Simply.com**, og DNS styres også dér (nameservere `ns1-3.simply.com`).
E-mail (`support@promilleplan.dk`) kører via Google (MX + SPF) og **må ikke røres**.

**1. Sæt domænet på GitHub Pages** (Settings → Pages → Custom domain → `promilleplan.dk`, eller
`gh api -X PUT repos/selmermads-ops/promilleplan/pages -f cname=promilleplan.dk`).

**2. Ret DNS hos Simply.com** (Domæner → promilleplan.dk → DNS):

| Type | Navn | Værdi | Handling |
|---|---|---|---|
| A | `@` (roden) | `185.199.108.153` | erstat de 4 Squarespace-A-records |
| A | `@` | `185.199.109.153` | |
| A | `@` | `185.199.110.153` | |
| A | `@` | `185.199.111.153` | |
| AAAA | `@` | `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` | valgfri, tilføj |
| CNAME | `www` | `selmermads-ops.github.io.` | erstat `ext-cust.squarespace.com.` |
| MX / TXT | | | **lad stå uændret** (Google-mail) |

De gamle A-records er `198.49.23.144`, `198.49.23.145`, `198.185.159.144`, `198.185.159.145`.

**3. Vent på DNS** (typisk 5-60 min, op til et par timer), tjek med `dig +short promilleplan.dk`.

**4. Slå HTTPS til** (Settings → Pages → Enforce HTTPS), når GitHub har udstedt certifikatet.

**5. Kør `tools/tjek-domaene.sh`** – den tjekker DNS, at mailen er urørt, og at siden svarer fra GitHub. Slå HTTPS til med `tools/tjek-domaene.sh --slaa-https-til`.

De gamle DNS-værdier er gemt i `DNS-FOER-FLYTNING.md`.

**6. Først nu kan Squarespace opsiges.** Domænet ligger hos Simply.com og forsvinder ikke.
Husk at domænet fornyes hos Simply.com (udløber 2027-07-05).

## Ikoner og originale billeder

- `favicon.ico`, `favicon-32.png` og `apple-touch-icon.png` er lavet ud fra app-ikonet (`originaler/logo-app-ikon-1254.webp`).
  Squarespaces egen favicon var en stor JPEG (1536×1024) med `.ico`-endelse og blev udskiftet med disse.
- `originaler/` er en sikkerhedskopi af billederne fra Squarespace (logo, baggrunde, store-ikoner, QR-pladsholder).
  Se `originaler/README.md` for bemærkninger – bl.a. at QR-koden er en pladsholder, og at Google Play-ikonet har skaktern i billedet.

## Forsiden

Forsidens indhold (hero med logo, "Aftenens overblik" og telefoner på vej-baggrunden, kort, sikkerhedstekst) er bygget i
`tools/snippets/home.html`; billederne ligger i `media/`. Ret skabelonen og kør `node tools/apply-home.mjs`
(scriptet erstatter blokken i `index.html` og `forside/index.html`, den bliver ikke duplikeret). Header'en er skjult på forsiden,
og sikkerhedsteksten i footeren er fjernet dér, fordi den står fremhævet i selve indholdet. Undersiderne er uændrede.

**Uden Squarespace-scripts:** `apply-home.mjs` fjerner al Squarespace-JavaScript fra de to forsider (kun Google Analytics og
strukturerede data bliver stående) og komprimerer overflødig indrykning. Forsiden hentes derfor uden kald til Squarespace, og
siden er ca. 68 kB HTML. Undersiderne (privatliv m.fl.) bruger stadig Squarespaces komponent-JS til de foldbare afsnit.
`node tools/fix-social-meta.mjs` sørger for, at delingsbilledet (`og:image` m.fl.) er en fuld adresse på alle sider.

**Når appen udkommer:** gør de to `<li class="pp-store">` i skabelonen til `<a href="…">`-links til App Store og Google Play
(og skift til Apples/Googles officielle knapper, se `originaler/README.md`). Fjern derefter "Kommer snart"-teksterne
(hero-knapperne og afsnittet "PromillePlan kommer snart").

## Kend forskellene til Squarespace

- Siden er **statisk**: der er ingen redigering online. HTML-filerne i roden (`index.html`, `forside/`, `privatliv/` osv.)
  er kilden – ret dem direkte. Squarespace er opsagt, og `tools/arkiv/mirror.mjs` må ikke køres mere (se `tools/arkiv/README.md`).
- Squarespaces egen statistik (`/api/census/RecordHit`) svarer 404 og gør ingenting. Det er ufarligt.
- Google Analytics (`G-PR4M1K4M94`) er bevaret som på originalen. Fjern `gtag`-scriptet i `<head>`, hvis du ikke vil have det.
- Cart-koden fra Squarespace følger med, men er inaktiv (siden har ingen webshop).

## Værktøjer

```bash
node tools/serve.mjs "$(pwd)" 4173   # lokal test på http://127.0.0.1:4173
node tools/apply-home.mjs            # byg forsiden igen efter ændring af tools/snippets/home.html
```

Test lokalt på `127.0.0.1`, ikke `localhost` – Squarespace-koden har en særregel for `localhost`.
