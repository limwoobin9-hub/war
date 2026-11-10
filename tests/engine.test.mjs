import test from "node:test";
import assert from "node:assert/strict";
import * as G from "../public/engine.mjs";
const make = (start = 1939, branch = "armor", seed = 1234) =>
  G.createGame({
    start,
    record: { seed, branch, traits: ["cautious", "connected"] },
  });
test("all branches receive matching unit, fixed stats and deterministic random assignments", () => {
  for (const branch of Object.keys(G.BRANCHES)) {
    const s = make(1939, branch);
    assert(G.isValidSave(s));
    assert(G.BRANCHES[branch].units.includes(s.parent));
    assert.equal(s.officer.tactics, 68);
    assert.equal(s.ap, 3);
    assert.deepEqual(make(1939, branch), s);
  }
  const seen = new Set(
    Array.from({ length: 50 }, (_, i) => G.draft(i * 9273).branch),
  );
  assert.equal(seen.size, 3);
});
test("pending decisions block time, September 1939 guarantees the Poland operation", () => {
  const s = make();
  assert.equal(G.advance(s).ok, false);
  G.resolveEvent(s, 0);
  assert(G.advance(s).ok);
  assert.equal(s.month, 9);
  assert.equal(s.front, "폴란드 전선");
  assert(s.battle);
  assert.equal(G.advance(s).ok, false);
  assert(G.fight(s, "defend").ok);
  assert.equal(s.battles, 1);
  assert(!s.battle);
});
test("action limits, equipment queues and monthly deliveries persist across serialization", () => {
  let s = make();
  G.resolveEvent(s, 0);
  assert(G.request(s, "gear").ok);
  assert.equal(G.request(s, "gear").ok, false);
  assert.equal(G.request(s, "upgrade").ok, false);
  assert(G.action(s, "train").ok);
  assert(G.action(s, "rest").ok);
  assert.equal(s.ap, 0);
  assert.equal(G.action(s, "rest").ok, false);
  s = JSON.parse(JSON.stringify(s));
  assert(G.isValidSave(s));
  const before = s.logs.length;
  assert(G.advance(s).ok);
  assert.equal(s.ap, 3);
  assert.equal(s.requests.length, 0);
  assert(
    s.logs.slice(0, s.logs.length - before).some((x) => x.type === "supply"),
  );
  assert(s.gear <= G.branch(s).maxGear);
});
test("1936 Spain detachment is offered; branch-wide battalion is not transferred to Spain", () => {
  const s = make(1936);
  G.resolveEvent(s, 0);
  while (s.year === 1936 && s.month < 7) {
    assert(G.advance(s).ok);
    if (s.event && s.event.id !== "spain") G.resolveEvent(s, 0);
  }
  assert.equal(s.event.id, "spain");
  const before = s.men;
  G.resolveEvent(s, 0);
  assert.equal(before - s.men, 18);
  assert.equal(s.casualties, 18);
  assert(s.campaigns.includes("스페인 파견"));
  assert.equal(s.front, "독일 본토");
});
test("requests enforce era, spending, organization and equipment caps", () => {
  const s = make();
  G.resolveEvent(s, 0);
  s.budget = 0;
  assert.equal(G.action(s, "train").ok, false);
  assert.equal(G.request(s, "supply").ok, false);
  s.event = { choices: [{ effects: { budget: -10 }, title: "a", hint: "b" }] };
  assert.equal(G.resolveEvent(s, 0).ok, false);
  s.event = null;
  s.budget = 100;
  assert(G.changeRole(s, 1, "assault").ok);
  assert.equal(G.changeRole(s, 1, "wrong").ok, false);
  assert(G.changeSupport(s, "engineer").ok);
  s.gear = G.branch(s).maxGear;
  assert.equal(G.action(s, "repair").ok, false);
  s.men = s.maxMen;
  assert.equal(G.action(s, "recruit").ok, false);
});
test("combat consumes supplies, tracks losses, changes odds and ends understrength battalions", () => {
  const s = make();
  G.resolveEvent(s, 0);
  G.advance(s);
  assert(G.battleOdds(s, "assault") > G.battleOdds(s, "defend"));
  const before = s.men,
    supply = s.supply;
  G.fight(s, "assault");
  assert(s.men < before);
  assert(s.supply < supply);
  assert.equal(s.casualties, before - s.men);
  assert.equal(s.lastResult.loss, before - s.men);
  const low = make();
  G.resolveEvent(low, 0);
  G.advance(low);
  low.men = 10;
  G.fight(low, "withdraw");
  assert(low.ended);
  assert.equal(G.advance(low).ok, false);
});
test("a complete conservative career reaches May 1945 with major theatres and finite stats", () => {
  for (const start of [1936, 1939])
    for (const branch of Object.keys(G.BRANCHES))
      for (let seed = 1; seed <= 8; seed++) {
        const s = make(start, branch, seed * 9957);
        let turns = 0;
        while (!s.ended && turns++ < 250) {
          if (s.event) {
            let idx = s.event.choices.findIndex(
              (c) => (c.effects?.budget || 0) + s.budget >= 0,
            );
            G.resolveEvent(s, idx);
          }
          if (s.battle) G.fight(s, "withdraw");
          if (s.men < s.maxMen * 0.8) G.action(s, "recruit");
          if (s.supply < 50) G.request(s, "supply");
          if (s.morale < 65) G.action(s, "rest");
          if (s.ap && s.budget > 12) G.action(s, "train");
          if (!s.ended) assert(G.advance(s).ok);
          assert(G.isValidSave(s));
        }
        assert(s.ended);
        assert.equal(s.year, 1945);
        assert.equal(s.month, 5);
        assert(s.campaigns.includes("폴란드 전선"));
        assert(s.campaigns.includes("프랑스 전선"));
        assert(s.battles >= 20);
        assert(turns < 250);
      }
});
test("invalid saved data and unsafe imported event markup are rejected", () => {
  assert(!G.isValidSave(null));
  assert(!G.isValidSave({ version: 1 }));
  const s = make();
  s.men = NaN;
  assert(!G.isValidSave(s));
  const injected = make();
  injected.event.body = "<img src=x onerror=alert(1)>";
  assert(!G.isValidSave(injected));
  const badOrg = make();
  badOrg.organization[0] = null;
  assert(!G.isValidSave(badOrg));
});
