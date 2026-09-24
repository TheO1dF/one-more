import {bribeHTML,bribeOffer} from './bribes.js';
import {panArt,giftGlassArt} from './pan-art.js';
export function panEncounterHTML(s,lang='zh',busy=false,pick={}){
 const en=lang==='en',tr=(a,b)=>en?b:a,e=s.encounter,price=e.quote+(pick.bribe?bribeOffer('pan',{},s).cost:0),short=Math.max(0,price-s.bank);
 const line=!e.haggled?tr('“五十。杯子归你。再摸到炸弹，它替你挨这一下。”','“Fifty. The cup is yours. Next bomb you draw, it takes the hit.”'):e.quote===25?tr('“二十五。钱放这儿，别让他碰。”','“Twenty-five. Put it here. Keep it away from him.”'):tr('“一百。刚才五十的时候，你没买。”','“A hundred. You had your chance at fifty.”');
 return `<main class="pan-encounter" data-haggled="${!!e.haggled}">
  <section class="pan-scene-art" aria-label="${tr('潘神端着酒杯','Pan holding his glass')}">${panArt()}<span class="pan-scene-name">PAN <i>♠</i></span></section>
  <section class="pan-deal"><header><small>${tr('私人包厢','PRIVATE BOOTH')}</small><h1>${tr('潘神的酒杯','A glass from Pan')}</h1></header>
   <p class="pan-narration">${tr('羊角客人挪开搭在空椅子上的蹄子，冲您举了举杯。荷官留在门外，白手套按着门框。','The horned guest takes his hoof off the empty chair and raises his glass. The dealer stays outside, one white glove on the doorframe.')}</p>
   <blockquote aria-live="polite"><small>${tr('潘神','PAN')}</small><p>${line}</p></blockquote>
   <div class="pan-gift-terms">${giftGlassArt()}<div><strong>${tr('潘神赠礼','Pan’s Gift')}</strong><p>${tr('抵挡一次炸弹后碎裂。炸弹洗回剩余牌堆，仍然可能再次抽到。','Breaks to stop one bomb. The bomb shuffles back into the remaining pile and can be drawn again.')}</p></div></div>
   <div class="pan-wallet"><span>${tr('装袋分数','BANKED')} <b>${s.bank}</b></span><span>${tr('成交价','PRICE')} <b>${price}</b></span></div>
   ${bribeHTML(s,lang,!!pick.bribe,busy)}<div class="pan-deal-actions"><button class="primary" data-action="event-confirm" ${short||busy?'disabled':''}>${tr(`买下酒杯 · ${price}分`,`BUY THE CUP · ${price}`)}</button>${!e.haggled?`<button class="outline" data-action="event-haggle" ${busy?'disabled':''}>${tr('还个价','HAGGLE')}</button>`:''}<button class="pan-pass" data-action="event-leave" ${busy?'disabled':''}>${tr('起身离开','LEAVE')}</button></div>
   <small class="pan-deal-footnote">${short?tr(`还差 ${short} 装袋分数。`,`${short} more banked points needed. `):''}${!e.haggled?tr('还价只能一次：50%降为25分，50%涨至100分。','Haggle once: 50% chance of 25, 50% chance of 100.') : tr('报价已定。您仍可离开，不扣分数。','Final price. Leaving costs nothing.')}</small>
  </section>
 </main>`;
}
