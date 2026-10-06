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
  assert.match(html, /id="all-set-combos-only"/);
  assert.match(html, /formatPrerequisites\(combo\)/);
  assert.match(html, /formatNotes\(combo\.notes\)/);
  assert.match(html, /comboUsesOnlySelectedSetCards\(combo\)/);
  assert.match(html, /rel="icon" href="data:image\/svg\+xml,/);
  assert.doesNotMatch(html, /\(combo\.easyPrerequisites \|\| \[\]\)\.concat/);
});
