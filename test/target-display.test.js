import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun} from '../game/engine.js';
import {renderView} from '../game/view.js';
import {diceTargetHTML} from '../game/target-view.js';
import {nextTarget} from '../game/pacing.js';

test('target HUD separates cumulative goal from remaining table requirement in both languages',()=>{
 const s={...newRun(1,{rules:2}),round:2,target:24,bank:18};
 const html=lang=>renderView({s,screen:'game',prefs:{lang},selected:[],inspect:''});
 for(const [lang,label] of [['zh','本局目标'],['en','RUN TARGET']]){
  assert.match(html(lang),new RegExp('class="run-target"><span>'+label+'</span><b>24</b>'));
  assert.match(html(lang),/class="score-box target-score[^"]*"[^>]*>[\s\S]*?<strong>6<\/strong>/);
 }
 s.tableCondition={id:'pressure',round:2,double:true};
 assert.match(html('en'),/RUN TARGET<\/span><b>48<\/b>/);
 assert.match(html('en'),/class="score-box target-score[^"]*"[^>]*>[\s\S]*?<strong>30<\/strong>/);
 s.bank=100;
 assert.match(html('en'),/RUN TARGET<\/span><b>48<\/b>/);
 assert.match(html('en'),/class="score-box target-score[^"]*"[^>]*>[\s\S]*?<strong>0<\/strong>/);
});

test('second-table dice explanation agrees with the accepted target at each difficulty',()=>{
 for(const difficulty of [0,1,2,3]){
  const s=newRun(1,{rules:2,difficulty});s.dice={result:{total:10}};
  for(const lang of ['zh','en']){
   const extra=difficulty>=2?6:4;
   assert.ok(diceTargetHTML(s,lang,false).includes('× 1 + '+extra));
   assert.ok(diceTargetHTML(s,lang,true).includes('8 → '+nextTarget(s)));
  }
 }
});
