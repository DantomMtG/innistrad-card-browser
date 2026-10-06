# Innistrad Card & Combo Browser

A small, dependency-free browser app for exploring cards from Innistrad sets and their two- and three-card combos listed by Commander Spellbook.

## Run locally

The included JSON data file is about 55 MB. From this folder, start a local web server:

```powershell
py -m http.server 8765
```

Then open <http://localhost:8765/>. The app automatically loads `innistrad-cards-and-combos.json`. You can also open the HTML file directly and choose the JSON with **Load card JSON**.

## Features

- Browse 1,655 unique cards from Innistrad, Dark Ascension, Avacyn Restored, Shadows over Innistrad, Eldritch Moon, Innistrad: Midnight Hunt, Innistrad: Crimson Vow, Innistrad: Double Feature, and Innistrad Remastered.
- Search and filter by set, color, rarity, and combo availability.
- Inspect card printings, rules text, and Scryfall card images.
- View two- and three-card combos, prerequisites, and outcomes.
- Filter the main card list or a card's combo list to combos whose every component is included in the selected Innistrad sets.
- View component card images for combos; components included in the set data link to their card details.

## Data

`innistrad-cards-and-combos.json` contains 3,004 Scryfall printings grouped under 1,655 Oracle cards and 7,790 matching Commander Spellbook combo variants. It is a static snapshot, not live data. Combo records are shared by ID, and a combo may include cards outside the selected sets unless the all-selected-set filter is enabled. Card images are loaded from the image URLs in the data; image files are not bundled.

The snapshot was generated on October 6, 2026. Its set query is:

```text
set:isd OR set:dka OR set:avr OR set:soi OR set:emn OR set:mid OR set:vow OR set:dbl OR set:inr
```

Data sources: [Scryfall](https://scryfall.com/docs/api) and [Commander Spellbook](https://commanderspellbook.com/). Please follow their respective terms and attribution guidance when reusing the data or images.

## Tests

Requires Node.js; no npm install is needed.

```powershell
node --test .\innistrad-card-browser.test.js
```
