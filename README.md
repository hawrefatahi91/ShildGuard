# ShieldGuard 2.0

ShieldGuard er et statisk nettsted om sikkerhetsbevissthet, laget for GitHub Pages. Versjon 2.0 inneholder en responsiv forside, informasjon om prosjektet og grunnleggeren, kontaktside og en sikkerhetstest som trekker 30 spørsmål fra en bank på 90.

## Viktige filer

- `index.html` – forside og informasjon om grunnleggeren
- `mission.html` – formål og forskningsgrunnlag
- `question-bank.js` – 90 kvalitetssikrede spørsmål, 15 i hver kategori
- `quiz.html` og `quiz.js` – interaktiv sikkerhetstest og tilfeldig uttrekksmotor
- `contact.html` – kontaktside som bruker den besøkendes e-postprogram
- `styles.css` – felles responsivt design
- `app.js` – meny, bunntekst og kontaktskjema
- `ShieldGuard-no.png` – toppbilde uten engelsk tekst

## Forhåndsvis lokalt

Åpne `index.html` direkte i en nettleser, eller kjør `python -m http.server 8000` fra prosjektmappen og gå til `http://localhost:8000`.

## Publisering

Last opp de oppdaterte filene til roten av `main`-grenen. GitHub Pages publiserer deretter nettstedet automatisk.

## Slik fungerer testen

Hver test inneholder 30 spørsmål: 10 lette, 10 middels og 10 vanskelige. Det trekkes fem spørsmål fra hver av de seks kategoriene. Nettleseren husker hvilke spørsmål som nylig er vist, slik at de første tre testene kan gå gjennom alle de 90 spørsmålene før spørsmål begynner å gjentas.
