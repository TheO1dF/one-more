export const DEALER_ROUTES={
 duplicate:{type:'dealer',name:['复写台','Carbon copy'],text:['消耗6分，永久复制1张非炸弹牌，保留附魔与成长。','Consume 6 banked points to permanently copy one non-bomb card, including enchantment and growth.'],icon:'carboncopy'},
 trade:{type:'dealer',name:['换牌','Exchange'],text:['交出2张永久食材，从3张报价中选1张永久加入牌组。','Trade two permanent foods for one of three permanent cards.'],icon:'sorter'},
 pawn:{type:'dealer',name:['典当','Pawn counter'],text:['交出1件抵押物，换取装袋分数；先看报价再决定。','Sell one pledged item for banked points. See the price before selling.'],icon:'relic-coinpurse'},
 wager:{type:'dealer',name:['双倍赌约','Double or nothing'],text:['仅下桌累计目标翻倍；达标收摊后获得1件随机抵押物。','Double only the next table’s cumulative target; cash out successfully for one random pledged item.'],icon:'relic-scale'},
 mystery:{type:'dealer',name:['意外来客','Unknown visitor'],text:['60%遇到服务；40%扣分、永久失去食材或工具，或仅下桌目标翻倍／装袋封顶。','60% service; 40% lost points, a lost permanent food/tool, or next-table double target/bank limit.'],icon:'wish'},
};
export const SETBACKS={
 levy:{name:['抽水','House fee'],text:['失去15%装袋分数，至少4分，不低于0。','Lose 15% of banked points, at least 4, stopping at zero.'],icon:'relic-coinpurse'},
 pressure:{name:['临时加码','Raised stakes'],text:['仅下一桌的累计目标翻倍。','Double the cumulative target for the next table only.'],icon:'relic-scale'},
 foodLoss:{name:['没收食材','Confiscated food'],text:['随机永久失去1张食材。','Permanently lose one random food.'],icon:'rice'},
 toolLoss:{name:['没收工具','Confiscated tool'],text:['随机永久失去1张工具牌。','Permanently lose one random tool card.'],icon:'torch'},
 cap:{name:['封顶结算','House limit'],text:['下一桌装袋只补到目标，超额不入袋；已有存分保留。','Next table, bank only up to its target. Keep any savings already above it.'],icon:'relic-bottlestopper'},
};
export const dealerQuote=s=>Math.max(8,Math.ceil(s.target*.2));
export function tableCondition(s){const c=s.tableCondition;return c&&(c.round===s.round||c.round===s.round+1&&['route','encounter','draft'].includes(s.phase))?c:null;}
export const effectiveTarget=s=>s.target*(tableCondition(s)?.double?2:1);
export const bankGain=(s,n)=>s.phase==='play'&&s.tableCondition?.round===s.round&&s.tableCondition.cap?Math.min(n,Math.max(0,s.tableCondition.ceiling-s.bank)):n;
export const permanentFoods=(s,cards)=>s.cards.filter(c=>!c.temporary&&cards[c.original]?.type==='food');
export const permanentTools=(s,cards)=>s.cards.filter(c=>!c.temporary&&cards[c.original]?.type==='tool');
export const prizePool=(s,relics)=>Object.keys(relics).filter(id=>!relics[id].rewardOnly&&!s.relics.includes(id)&&(!s.allowedRelics||s.allowedRelics.includes(id)));
export function validDealerState(s,cards,relics,routes){
 const c=s.tableCondition;
 if(c&&(!Number.isInteger(c.round)||c.round<1||c.round>s.round+1||!['pressure','cap','wager'].includes(c.id)||c.double!==['pressure','wager'].includes(c.id)||c.cap!==(c.id==='cap')||c.wager!==(c.id==='wager')||c.ceiling!=null&&(!Number.isFinite(c.ceiling)||c.ceiling<0)))return false;
 if(c?.cap&&c.round===s.round&&s.phase==='play'&&!Number.isFinite(c.ceiling))return false;
 const e=s.encounter;
 if(s.phase==='encounter'&&!e)return false;
 if(e){
  if(s.phase!=='encounter'||(!routes[e.id]&&!SETBACKS[e.id])||!['mystery',e.id].includes(e.source)||typeof e.applied!=='boolean'||!Number.isFinite(e.quote)||e.quote<0)return false;
  if(e.id==='trade'&&(!Array.isArray(e.offers)||e.offers.length!==3||new Set(e.offers).size!==3||e.offers.some(k=>!cards[k]||cards[k].tokenOnly||!['food','tool','device'].includes(cards[k].type))))return false;
  if(!!SETBACKS[e.id]!==e.applied)return false;
 }
 const receipt=s.eventReceipt;if(receipt&&(!routes[receipt.id]&&!SETBACKS[receipt.id]||!Array.isArray(receipt.removed)||receipt.removed.some(c=>!cards[c.original]||c.original==='bomb')||receipt.relic&&!relics[receipt.relic]||receipt.gained&&!cards[receipt.gained]))return false;
 return !s.wagerPrize||!!relics[s.wagerPrize.id];
}
