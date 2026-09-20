#!/usr/bin/env bash
# Tjekker, om promilleplan.dk er flyttet korrekt til GitHub Pages.
# Brug: tools/tjek-domaene.sh [--slaa-https-til]
set -u
D=promilleplan.dk
REPO=selmermads-ops/promilleplan
GH=${GH:-$(command -v gh || echo /opt/homebrew/bin/gh)}
R=8.8.8.8
GH_IPS="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"
ok=1
say() { printf '%-42s %s\n' "$1" "$2"; }

echo "== DNS (via $R)"
A=$(dig @$R +short A $D | sort | tr '\n' ' ')
want=$(printf '%s\n' $GH_IPS | sort | tr '\n' ' ')
if [ "$A" = "$want" ]; then say "A $D" "OK  ($A)"
elif echo "$A" | grep -qE '198\.(49|185)\.'; then say "A $D" "STADIG SQUARESPACE: $A"; ok=0
else say "A $D" "UVENTET: $A"; ok=0; fi
W=$(dig @$R +short CNAME www.$D)
case "$W" in
  selmermads-ops.github.io.) say "CNAME www" "OK  ($W)";;
  *squarespace*) say "CNAME www" "STADIG SQUARESPACE: $W"; ok=0;;
  *) say "CNAME www" "UVENTET: '$W'"; ok=0;;
esac

echo "== Mail (skal være uændret)"
MX=$(dig @$R +short MX $D)
[ "$MX" = "1 smtp.google.com." ] && say "MX" "OK  ($MX)" || { say "MX" "ÆNDRET! Forventet '1 smtp.google.com.', fik '$MX'"; ok=0; }
dig @$R +short TXT $D | grep -q 'spf1 include:_spf.google.com' && say "SPF" "OK" || { say "SPF" "MANGLER"; ok=0; }
dig @$R +short TXT _dmarc.$D | grep -q 'v=DMARC1' && say "DMARC" "OK" || { say "DMARC" "MANGLER"; ok=0; }
dig @$R +short TXT google._domainkey.$D | grep -q 'v=DKIM1' && say "DKIM" "OK" || { say "DKIM" "MANGLER"; ok=0; }

echo "== Siden"
for p in "" forside/ privatliv/ vilkaar/ support/ slet-data/; do
  for s in https http; do
    code=$(curl -sS -o /dev/null -m 15 -w '%{http_code}' -A "Mozilla/5.0" "$s://$D/$p" 2>/dev/null || echo ERR)
    say "$s://$D/$p" "$code"
  done
done
srv=$(curl -sSI -m 15 https://$D/ 2>/dev/null | tr -d '\r' | grep -i '^server:' | head -1)
say "Server-header" "${srv:-(ingen)}   (skal være GitHub.com, ikke Squarespace)"

if [ -x "$GH" ]; then
  echo "== GitHub Pages"
  "$GH" api repos/$REPO/pages --jq '"custom domain: \(.cname)  |  https_enforced: \(.https_enforced)  |  status: \(.status)"' 2>/dev/null
  if [ "${1:-}" = "--slaa-https-til" ]; then
    if [ $ok -eq 1 ]; then
      "$GH" api -X PUT repos/$REPO/pages -F https_enforced=true >/dev/null 2>&1 \
        && echo "HTTPS er nu slået til." \
        || echo "Kunne ikke slå HTTPS til endnu – certifikatet er måske ikke klar. Prøv igen om lidt."
    else
      echo "Slår IKKE HTTPS til: DNS/mail er ikke i orden endnu (se ovenfor)."
    fi
  fi
fi
[ $ok -eq 1 ] && echo "ALT OK" || { echo "IKKE KLAR – se linjer ovenfor"; exit 1; }
