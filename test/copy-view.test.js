import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS} from '../game/cards.js';
import {ENCHANTMENTS,enchantmentText} from '../game/enchantments.js';
import {newRun,act,card,restore} from '../game/engine.js';
import {eventCard} from '../game/dealer-art.js';
import {encounterHTML,receiptHTML} from '../game/dealer-view.js';
import {skipReceiptHTML} from '../game/momentum-view.js';

const samples={raw:'rice',fried:'rice',boiled:'tea',smoked:'torch',glazed:'cola'};
function open(id){const s=newRun(8,{rules:2});Object.assign(s,{phase:'route',routeOffers:[id,'tea'],bank:100});return act(s,{type:'chooseRoute',id});}
test('event choices distinguish all five enchanted cards from their plain counterparts in both languages',()=>{
 for(const [enchantment,kind]of Object.entries(samples))for(const lang of ['zh','en']){
  const c={original:kind,kind,enchantment},i=lang==='en'?1:0,html=eventCard(c,lang);
  assert.ok(html.includes(ENCHANTMENTS[enchantment].name[i]));
  assert.ok(html.includes(enchantmentText(c,enchantment,CARDS)[i]));
  assert.ok(html.includes(`data-enchantment="${enchantment}"`));
  assert.doesNotMatch(eventCard({kind,original:kind},lang),/card-enchantment/);
 }
 assert.doesNotMatch(eventCard('rice'),/card-enchantment/);
});
test('Carbon copy selection and its paid receipt retain the selected physical card enchantment',()=>{
 let s=open('duplicate');card(s,1).enchantment='fried';
 const html=encounterHTML(s,'en',{uid:1});
 assert.match(html,/data-uid="1" aria-pressed="true"[^]*data-enchantment="fried"/);
 s=act(s,{type:'resolveEncounter',uid:1});
 assert.equal(s.cards.at(-1).enchantment,'fried');assert.ok(restore(JSON.stringify(s)));
 assert.match(receiptHTML(s,'en'),/Rice ball · Fried/);
 assert.match(eventCard(s.eventReceipt.copied,'zh'),/油炸/);
});
test('free copy receipt names the copied enchantment; plain copies have no false label',()=>{
 let s=newRun(3,{rules:2});Object.assign(s,{bank:1000,phase:'stakes',dice:{rolls:[],result:null,count:1}});
 s=act(act(s,{type:'roll'}),{type:'acceptDice',boon:'scout'});s.skipOffer.id='duplicate';s=act(s,{type:'spinSkip'});
 card(s,1).enchantment='raw';const result=act(s,{type:'skipTable',id:'duplicate',uid:1});
 assert.match(skipReceiptHTML(result,'en'),/Rice ball · Raw/);
 assert.doesNotMatch(skipReceiptHTML(act(s,{type:'skipTable',id:'duplicate',uid:2}),'en'),/· Raw/);
});
test('interior event actors use the approved portraits across workshops, kitchen, tea, pawn and Pan',()=>{
 for(const [id,file]of Object.entries({duplicate:'workshop-character-v2',prune:'workshop-character-v2',raw:'kitchen-character-v2',tea:'tea-room-character-v2',pawn:'pawn-counter-character-v2',pan:'pan-character-v4'})){
  const s=open('duplicate');s.encounter={id,applied:false,quote:50};
  const html=encounterHTML(s,'en');assert.ok(html.includes(file+'.png'),id);assert.doesNotMatch(html,/flat-character/);
 }
});
