import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS} from '../game/cards.js';
import {TOOL_EFFECTS} from '../game/tool-effects.js';
import {cardHTML} from '../game/card-view.js';
import {practiceRun} from './fixtures.js';
import {arrangeCards} from '../game/layout.js';

test('every usable tool has a bounded, explicit visual cue',()=>{
 for(const [kind,c] of Object.entries(CARDS))if(c.type==='tool'){
  const effect=TOOL_EFFECTS[kind];assert.ok(effect,kind);assert.ok(effect.duration>=300&&effect.duration<=900);assert.match(effect.color,/^#[\da-f]{6}$/i);
 }
 assert.notEqual(TOOL_EFFECTS.torch.pattern,TOOL_EFFECTS.scope.pattern);
 assert.notEqual(TOOL_EFFECTS.cloth.pattern,TOOL_EFFECTS.washbucket.pattern);
});
test('card presentation exposes enchantment without changing rule state',()=>{
 const s=practiceRun();s.cards[0].enchantment='raw';const before=JSON.stringify(s);
 for(const lang of ['zh','en']){const html=cardHTML(s.cards[0],{s,lang,selected:s.cards[0].uid});assert.match(html,/data-material="raw"/);assert.match(html,/class="card-material" aria-hidden="true"/);assert.match(html,/aria-pressed="true"/);assert.match(html,/material-raw/);}
 assert.equal(JSON.stringify(s),before);
});
test('short desktop tables paginate before rows overflow, sparse tables keep large cards',()=>{
 const cards=Array.from({length:150},(_,i)=>({uid:i+1,tapped:i%4===0}));
 const dense=arrangeCards(cards,780,158);assert.ok(dense.pages.length>1);assert.ok(dense.pages.every(rows=>rows.length*dense.rowH<=158));assert.deepEqual(dense.pages.flat(2),cards.map(c=>c.uid));
 const sparse=arrangeCards(cards.slice(0,4),1000,290);assert.equal(sparse.pages[0].length,1);assert.ok(sparse.cardW>130);
});
