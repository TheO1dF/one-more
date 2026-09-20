import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, act, restore, routeTargets, card } from '../game/engine.js';
import { renderView } from '../game/view.js';

function draft(round = 2) {
  let s = newRun(97);
  s.round = round;
  s.bank = 1000;
  s = act(act(s, { type: 'draw' }), { type: 'stop' });
  if (s.phase === 'midnight') s = act(s, { type: 'acceptMidnight' });
  s = act(act(s, { type: 'roll' }), { type: 'acceptDice', boon: 'meal' });
  const id = s.routeOffers[0];
  return act(s, { type: 'chooseRoute', id, uid: routeTargets(s, id)[0]?.uid });
}
function view(s, lang) {
  return renderView({ s, screen: 'game', prefs: { lang }, saved: s });
}
function nextButton(s, lang = 'en') {
  return view(s, lang).match(/<button data-action="next"[^>]*>[\s\S]*?<\/button>/)[0];
}

test('first relic flow exposes one decision at a time and keeps the next-table action in both languages', () => {
  for (const lang of ['en', 'zh']) {
    let s = draft();
    assert.match(nextButton(s, lang), /disabled/);
    assert.match(view(s, lang), /data-action="add"/);
    assert.doesNotMatch(view(s, lang), /data-action="chooseRelic"/);
    s = act(s, { type: 'add', id: s.offers[0] });
    assert.doesNotMatch(view(s, lang), /data-action="add"/);
    assert.equal((view(s, lang).match(/data-action="chooseRelic"/g) || []).length, 3);
    assert.match(nextButton(s, lang), /disabled/);
    s = act(s, { type: 'chooseRelic', id: 'lunchbox' });
    assert.doesNotMatch(view(s, lang), /data-action="chooseRelic"/);
    assert.doesNotMatch(nextButton(s, lang), /disabled/);
    assert.match(nextButton(s, lang), lang === 'en' ? /TABLE 3/ : /第 3 桌/);
  }
});

test('every first relic and offered package can resume at each choice boundary and enter table three exactly once', () => {
  const initial = draft();
  for (const id of initial.relicOffer) for (const packageId of initial.offers) {
    for (const relicFirst of [false, true]) {
      let s = restore(JSON.stringify(initial));
      const choices = [{ type: 'add', id: packageId }, { type: 'chooseRelic', id }];
      if (relicFirst) choices.reverse(); // v0.8.1 allowed either order.
      for (const action of choices) {
        s = restore(JSON.stringify(act(s, action)));
        assert.match(view(s, 'en'), /id="next"/);
        assert.throws(() => act(s, action));
      }
      assert.doesNotMatch(nextButton(s), /disabled/);
      s = act(s, { type: 'next' });
      assert.equal(s.phase, 'play');
      assert.equal(s.round, 3);
      assert.equal(s.relics.filter(r => r === id).length, 1);
      assert.notEqual(card(s, s.draw[0]).kind, 'bomb');
      assert.throws(() => act(s, { type: 'next' }));
    }
  }
});

test('all nine reward transitions remain reachable, including the midnight transition', () => {
  for (let round = 1; round < 10; round++) {
    let s = draft(round);
    assert.throws(() => act(s, { type: 'next' }), /choosePackage/);
    s = act(s, { type: 'add', id: s.offers[0] });
    if (s.relicOffer.length) {
      assert.throws(() => act(s, { type: 'next' }), /chooseRelic/);
      s = act(s, { type: 'chooseRelic', id: s.relicOffer[0] });
    }
    assert.doesNotMatch(nextButton(restore(JSON.stringify(s))), /disabled/);
    s = act(s, { type: 'next' });
    assert.equal(s.round, round + 1);
    assert.equal(s.phase, 'play');
  }
});
