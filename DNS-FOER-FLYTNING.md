# DNS-records for promilleplan.dk før flytning til GitHub Pages

Taget 2026-09-20. DNS-udbyder: **Simply.com** (`ns1-3.simply.com`). TTL: 600 sek. (10 min).
Bruges som sikkerhedskopi, hvis noget skal rulles tilbage.

## Skal ÆNDRES (peger på Squarespace)

| Type | Navn | Gammel værdi |
|---|---|---|
| A | `@` | `198.49.23.144`, `198.49.23.145`, `198.185.159.144`, `198.185.159.145` |
| CNAME | `www` | `ext-cust.squarespace.com.` |
| CNAME | `lyxwbse5k9m24t8wws49` | `verify.squarespace.com` (Squarespaces domæne-bekræftelse; kan slettes efter opsigelsen) |

### Nye værdier

| Type | Navn | Ny værdi |
|---|---|---|
| A | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (4 records) |
| AAAA | `@` | valgfri: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153` |
| CNAME | `www` | `selmermads-ops.github.io.` |

## Skal IKKE røres (Google-mail)

| Type | Navn | Værdi |
|---|---|---|
| MX | `@` | `1 smtp.google.com.` |
| TXT | `@` | `google-site-verification=GgdvO4EfLrUWUYOlfYyJ_Jdr34MQuF54FYnzRVpjjj0` |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:andreas@promilleplan.dk` |
| TXT | `google._domainkey` | DKIM-nøgle (`v=DKIM1;k=rsa;p=MIIBIjANBg…`) – rør ikke |

Der er ingen AAAA- eller CAA-records i dag.

## Efter flytningen

```bash
tools/tjek-domaene.sh                       # tjek DNS, mail og HTTPS
tools/tjek-domaene.sh --slaa-https-til      # tving HTTPS, når certifikatet er klar
```
