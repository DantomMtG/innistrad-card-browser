# Innistrad Card & Combo Browser

A small, dependency-free browser app for exploring cards from Innistrad sets and their two- and three-card combos listed by Commander Spellbook.

## Start the app on Windows

1. Install Python 3 if it is not already installed. The Windows `py` launcher should be available in PowerShell.
2. Download the repository with **Code → Download ZIP** and extract it, or clone it:

   ```powershell
   git clone https://github.com/DantomMtG/innistrad-card-browser.git
   ```

3. In the same PowerShell window, change to the cloned or extracted repository folder. For example:

   ```powershell
   Set-Location "$HOME\innistrad-card-browser"
   ```

4. Start the app with one command:

   ```powershell
   py .\run_app.py
   ```

   The launcher serves the app and its data on localhost and opens the app in your default browser. Keep the PowerShell window open while using it; press **Ctrl+C** in that window to stop the server.

The launcher uses port 8765 when available. If that port is already occupied, it automatically chooses another free localhost port and prints the URL to open. To choose a preferred port yourself, run `py .\run_app.py --port 8766`. To start the server without opening a browser automatically, add `--no-browser`.

The root address printed by the launcher opens the app directly. The card JSON is loaded automatically from the same repository folder. If the automatic load fails, verify that `innistrad-cards-and-combos.json` is present beside `run_app.py` and `innistrad-card-browser.html`.

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

The app launcher uses only Python's standard library. Run its server and route tests with:

```powershell
py -m unittest discover -s . -p "test_run_app.py" -v
```

The browser logic tests require Node.js; no npm install is needed:

```powershell
node --test .\innistrad-card-browser.test.js
```
