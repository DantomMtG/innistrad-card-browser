"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const htmlPath = path.join(__dirname, "innistrad-card-browser.html");
const html = fs.readFileSync(htmlPath, "utf8");
const helperScript = html.match(/<script>\s*([\s\S]*?window\.InnistradBrowserHelpers[\s\S]*?)<\/script>/);

assert.ok(helperScript, "the browser helper script should be embedded in the app");
const browserWindow = {};
vm.runInNewContext(helperScript[1], { window: browserWindow });
const helpers = browserWindow.InnistradBrowserHelpers;

test("formats Spellbook's string prerequisites without assuming arrays", () => {
  assert.equal(
    helpers.formatPrerequisites({
      easyPrerequisites: "Seedship Agrarian doesn't have summoning sickness.",
      notablePrerequisites: "Your life total is at least 2."
    }),
    "Seedship Agrarian doesn't have summoning sickness.; Your life total is at least 2."
  );
});

test("formats prerequisite arrays and structured notes safely", () => {
  assert.equal(
    helpers.formatPrerequisites({
      easyPrerequisites: [{ template: { name: "A creature is on the battlefield" } }],
      notablePrerequisites: ["You have priority.", { feature: { name: "Infinite mana" } }]
    }),
    "A creature is on the battlefield; You have priority.; Infinite mana"
  );
  assert.equal(helpers.formatNotes("A single note."), "A single note.");
  assert.equal(helpers.formatNotes([{ text: "First note." }, "Second note."]), "First note.; Second note.");
});

test("keeps only combos whose every component is from the selected card set", () => {
  const selected = new Set(["innistrad-card", "midnight-hunt-card"]);
  assert.equal(helpers.comboUsesOnlySelectedSetCards({
    uses: [{ card: { oracleId: "innistrad-card" } }, { card: { oracleId: "midnight-hunt-card" } }]
  }, selected), true);
  assert.equal(helpers.comboUsesOnlySelectedSetCards({
    uses: [{ card: { oracleId: "innistrad-card" } }, { card: { oracleId: "external-card" } }]
  }, selected), false);
  assert.equal(helpers.comboUsesOnlySelectedSetCards({ uses: [] }, selected), false);
});

test("counts card combos according to the all-selected-set filter", () => {
  const selected = new Set(["innistrad-card", "midnight-hunt-card"]);
  const card = { combo_ids: ["all-set", "external", "missing"] };
  const combos = {
    "all-set": { uses: [{ card: { oracleId: "innistrad-card" } }, { card: { oracleId: "midnight-hunt-card" } }] },
    external: { uses: [{ card: { oracleId: "innistrad-card" } }, { card: { oracleId: "outside-card" } }] }
  };
  assert.equal(helpers.availableComboCount(card, combos, selected, false), 2);
  assert.equal(helpers.availableComboCount(card, combos, selected, true), 1);
});

test("reads EDHREC rank from available printings and handles unranked cards", () => {
  assert.equal(helpers.edhrecRank({
    printings: [{ edhrec_rank: null }, { edhrec_rank: 250 }, { edhrec_rank: 180 }]
  }), 180);
  assert.equal(helpers.edhrecRank({ printings: [{ edhrec_rank: null }] }), null);
});

test("prefers the normalized Oracle-card EDHREC rank", () => {
  assert.equal(helpers.edhrecRank({
    edhrec_rank: 75,
    printings: [{ edhrec_rank: 80 }]
  }), 75);
  assert.equal(helpers.edhrecRank({ edhrec_rank: null, printings: [{ edhrec_rank: null }] }), null);
});

test("sorts by filtered combo count and EDHREC rank with stable name tie breaks", () => {
  const selected = new Set(["set-card", "outside-card"]);
  const combos = {
    set: { uses: [{ card: { oracleId: "set-card" } }, { card: { oracleId: "outside-card" } }] },
    external: { uses: [{ card: { oracleId: "set-card" } }, { card: { oracleId: "other-card" } }] }
  };
  const cards = [
    { name: "Beta", combo_ids: ["set", "external"], printings: [{ edhrec_rank: 200 }] },
    { name: "Alpha", combo_ids: ["set"], printings: [{ edhrec_rank: 200 }] },
    { name: "Delta", combo_ids: ["set"], printings: [{ edhrec_rank: 500 }] },
    { name: "Epsilon", combo_ids: ["set"], printings: [{ edhrec_rank: 10 }] },
    { name: "Gamma", combo_ids: [], printings: [{ edhrec_rank: null }] }
  ];
  const countForCard = card => helpers.availableComboCount(card, combos, selected, true);
  assert.deepEqual(
    Array.from(helpers.sortCards(cards, "combos-desc", countForCard), card => card.name),
    ["Alpha", "Beta", "Delta", "Epsilon", "Gamma"]
  );
  assert.deepEqual(
    Array.from(helpers.sortCards(cards, "edhrec-asc", countForCard), card => card.name),
    ["Epsilon", "Alpha", "Beta", "Delta", "Gamma"]
  );
  assert.deepEqual(
    Array.from(helpers.sortCards(cards, "edhrec-desc", countForCard), card => card.name),
    ["Delta", "Alpha", "Beta", "Epsilon", "Gamma"]
  );
});

test("inherits the top-level combo filter when opening each card, without coupling its checkbox state", () => {
  const firstCardFilter = { checked: false };
  helpers.inheritTopLevelComboFilter(firstCardFilter, true);
  assert.equal(firstCardFilter.checked, true);

  firstCardFilter.checked = false;
  const nextCardFilter = { checked: false };
  helpers.inheritTopLevelComboFilter(nextCardFilter, true);
  assert.equal(nextCardFilter.checked, true);

  const unfilteredCardFilter = { checked: true };
  helpers.inheritTopLevelComboFilter(unfilteredCardFilter, false);
  assert.equal(unfilteredCardFilter.checked, false);
});

test("gets a selected-set component image from its Scryfall printing", () => {
  const card = { name: "Innistrad Card", printings: [{ set: "isd", image_uris: { normal: "https://cards.scryfall.io/normal/innistrad.jpg" } }] };
  const result = helpers.componentImage(
    { card: { oracleId: "innistrad-card", name: "Innistrad Card" } },
    new Map([["innistrad-card", card]]),
    printing => printing.image_uris.normal
  );
  assert.equal(result.card, card);
  assert.equal(result.imageUrl, "https://cards.scryfall.io/normal/innistrad.jpg");
});

test("uses the saved Spellbook Scryfall image when a component is outside the selected sets", () => {
  const result = helpers.componentImage({
    card: {
      oracleId: "external-card",
      name: "External Card",
      imageUriFrontNormal: "https://cards.scryfall.io/normal/external.jpg"
    }
  }, new Map(), () => "");
  assert.equal(result.card, null);
  assert.equal(result.imageUrl, "https://cards.scryfall.io/normal/external.jpg");
});

test("app wires combo helpers and an inline favicon", () => {
  const appHelpers = html.match(/const\s*\{([\s\S]*?)\}\s*=\s*window\.InnistradBrowserHelpers;/);
  assert.ok(appHelpers, "the app should import its browser helpers");
  for (const helper of ["availableComboCount", "edhrecRank", "sortCards"]) {
    assert.match(appHelpers[1], new RegExp(`\\b${helper}\\b`));
  }
  assert.match(html, /id="all-set-combos-only"/);
  assert.match(html, /id="sort-filter"/);
  assert.match(html, /value="combos-desc"/);
  assert.match(html, /value="edhrec-asc"/);
  assert.match(html, /availableComboCount\(card, comboData, cardByOracle, allSetCombosOnly\.checked\)/);
  assert.match(html, /formatPrerequisites\(combo\)/);
  assert.match(html, /formatNotes\(combo\.notes\)/);
  assert.match(html, /comboUsesOnlySelectedSetCards\(combo\)/);
  assert.match(html, /inheritTopLevelComboFilter\(comboFilter, allSetCombosOnly\.checked\)/);
  assert.match(html, /rel="icon" href="data:image\/svg\+xml,/);
  assert.doesNotMatch(html, /\(combo\.easyPrerequisites \|\| \[\]\)\.concat/);
});
