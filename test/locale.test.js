import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultLanguage, initialPreferences } from '../game/locale.js';

test('Chinese-region time zones default to Chinese, including legacy aliases', () => {
  for (const zone of ['Asia/Shanghai', 'Asia/Urumqi', 'Asia/Taipei', 'Asia/Hong_Kong', 'Asia/Macau', 'PRC'])
    assert.equal(defaultLanguage(() => zone), 'zh');
});
test('Other regions use English even when their UTC offset matches China', () => {
  for (const zone of ['Asia/Singapore', 'Australia/Perth', 'America/Los_Angeles', 'Europe/London', 'UTC', undefined])
    assert.equal(defaultLanguage(() => zone), 'en');
  assert.equal(defaultLanguage(() => { throw new Error('Unavailable'); }), 'en');
});
test('Explicit saved language wins over timezone, preserving other preferences', () => {
  assert.equal(initialPreferences('{"lang":"en","sound":false}', () => 'Asia/Shanghai').lang, 'en');
  const prefs = initialPreferences('{"lang":"zh","volume":0.2}', () => 'America/New_York');
  assert.equal(prefs.lang, 'zh'); assert.equal(prefs.volume, 0.2);
});
test('Missing or malformed preferences still choose a usable default', () => {
  for (const saved of [null, 'null', '[]', '{', '{"lang":"fr"}'])
    assert.equal(initialPreferences(saved, () => 'Asia/Shanghai').lang, 'zh');
});
