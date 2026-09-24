// One quote per event. Paying and resolving are one atomic engine action.
const offer=(cost,zh,en)=>({cost,text:[zh,en]});
export const BRIBES={
 lantern:offer(6,'下桌开局查看6张顶牌。','Peek at six cards next table.'),
 tea:offer(8,'下桌前4次工具食材费用为0。','Four free tool food costs next table.'),
 helper:offer(8,'下桌开局获得2件临时小手电。','Start next table with two temporary Flashlights.'),
 prune:offer(12,'永久删除2张非炸弹牌。','Permanently remove two non-bomb cards.'),
 staple:offer(30,'这次随机装订永久保留，每桌重新装订。','Keep this random binding; it rebinds each table.'),
 press:offer(20,'合并计分倍率乘2，保留主牌附魔。','Double the combined score weight; keep the lead card’s enchantment.'),
 duplicate:offer(24,'永久复制所选牌2张，均保留附魔和成长。','Make two permanent copies, retaining enchantments and growth.'),
 coldlocker:offer(8,'储存2张永久食材，下桌直接上桌。','Store two permanent foods for the next table.'),
 menuchange:offer(16,'换牌后，额外永久复制新牌1张。','After replacing the food, add a permanent copy of it.'),
 closingmeal:offer(14,'只需交出1张食材，获得展示的抵押物。','Trade only one food for the displayed pledged item.'),
 trade:offer(10,'只需交出1张食材，仍从三张报价中选1张。','Trade only one food for one of the three offers.'),
 pawn:offer(16,'改为以物换物：交出1件抵押物，从柜台报价中选1件；不领取典当分数。','Trade one pledged item for one of the displayed offers instead of receiving banked points.'),
 wager:offer(24,'赌约达成时，获得2件不同的随机抵押物。','A successful wager awards two different random pledged items.'),
 pan:offer(8,'酒杯照常获得；下桌开局额外查看3张顶牌。','Receive the cup, plus a peek at three cards next table.'),
 levy:offer(2,'退回本次被扣除的全部分数。','Refund the full confiscated fee.'),
 pressure:offer(16,'取消下一桌的临时目标翻倍。','Cancel the next table’s doubled target.'),
 cap:offer(12,'取消下一桌的装袋封顶。','Remove next table’s banking limit.'),
 foodLoss:offer(12,'赎回刚被没收的食材，保留附魔和成长。','Recover the confiscated food with its enchantment and growth.'),
 toolLoss:offer(10,'赎回刚被没收的工具，保留附魔。','Recover the confiscated tool with its enchantment.'),
};
export function bribeOffer(id,enchantments={},s=null){
 const b=BRIBES[id]||(enchantments[id]?offer(16,'为2张适用牌附魔，分别选择。','Enchant two eligible cards. Choose each card.'):null);
 if(!b||!s)return b;
 if(id==='pawn'&&!s.encounter?.pledgeOffers?.length)return null;
 // Scale the price of undoing a penalty with that penalty, not with player savings.
 const cost=id==='levy'?Math.max(1,Math.ceil((s.eventReceipt?.amount||0)/2)):
  id==='pressure'?Math.max(b.cost,Math.ceil(s.target*.15)):
  id==='cap'?Math.max(b.cost,Math.ceil(s.target*.1)):b.cost;
 return {...b,cost};
}
export const eventBaseCost=e=>e.id==='pan'?e.quote:({coldlocker:3,menuchange:4,duplicate:6,prune:4,staple:4}[e.id]||0);
export const eventSelectionCount=(id,up)=>['trade','closingmeal'].includes(id)?up?1:2:['coldlocker','prune'].includes(id)?up?2:1:id==='press'?2:1;
export function bribeHTML(s,lang,selected=false,busy=false,enchantments={}){
 const e=s.encounter,b=bribeOffer(e.id,enchantments,s);if(!b)return '';
 const en=lang==='en',cost=eventBaseCost(e)+b.cost;
 return `<section class="bribe-offer ${selected?'selected':''}"><button class="outline" data-action="event-bribe" aria-pressed="${selected}" ${busy||(!selected&&s.bank<cost)?'disabled':''}>${en?'BRIBE':'贿赂'} <b>−${b.cost}</b>${selected?' ✓':''}</button><p>${b.text[en?1:0]}</p><small>${en?'Paid only when you confirm. Total cost: ':'确认成交时扣除，共消耗 '}${cost}${en?' points.':' 分。'}</small></section>`;
}
