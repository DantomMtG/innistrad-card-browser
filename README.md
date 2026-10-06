# Innistrad Card & Combo Browser

A small, dependency-free browser app for exploring cards from Innistrad sets and their two- and three-card combos listed by Commander Spellbook.

## Run locally on Windows

Python 3 must be installed and available as `py`. The HTML page and its JSON data file must be in the **same folder**. If you use **Code → Download ZIP** from GitHub, extract the archive first.

1. Open PowerShell and change to the folder containing `innistrad-card-browser.html` and `innistrad-cards-and-combos.json`. For example, if you extracted the repository into Downloads:

   ```powershell
   Set-Location "$HOME\Downloads\innistrad-card-browser"
   ```

   If you cloned or extracted it somewhere else, use that folder's path instead. Check that both files are there:

   ```powershell
   Get-ChildItem .\innistrad-card-browser.html, .\innistrad-cards-and-combos.json
   ```

2. Start the web server in that same PowerShell window:

   ```powershell
   py -m http.server 8765 --bind 127.0.0.1
   ```

   Leave this window open while using the app. A message such as `Serving HTTP on 127.0.0.1 port 8765` means the server is running.

3. Open **<http://127.0.0.1:8765/innistrad-card-browser.html>** in your browser. The app automatically loads `innistrad-cards-and-combos.json` from the same folder. Going to `http://127.0.0.1:8765/` shows Python's folder listing; it is not the app page.

4. To stop the server, return to the PowerShell window and press **Ctrl+C**. Closing the window also stops it.

If port 8765 is already in use, choose another port (for example `8766`) in the server command and URL. If the page opens but says it cannot load the data, verify that the JSON file is beside the HTML page and that the server was started from that directory. Alternatively, open the HTML file directly and choose the JSON with **Load card JSON**.

## Features

- Browse 1,655 unique cards from Innistrad, Dark Ascension, Avacyn Restored, Shadows over Innistrad, Eldritch Moon, Innistrad: Midnight Hunt, Innistrad: Crimson Vow, Innistrad: Double Feature, and Innistrad Remastered.
- Search and filter by set, color, rarity, and combo availability.
- Sort the filtered cards by name, available combo count, or EDHREC rank. Combo counts respect the all-selected-set combo filter; cards without an EDHREC rank sort last.
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
