export const ENCHANTMENTS={
 raw:{name:['生腌','Raw'],stamp:['腌','RAW'],text:['强化未配对计分。','Improve unpaired scoring.'],icon:'fish',color:'#afcdb4'},
 fried:{name:['油炸','Fried'],stamp:['炸','FRY'],text:['提高此牌原有能力的数量。','Increase this card’s own effect amount.'],icon:'stove',color:'#eab679'},
 boiled:{name:['水煮','Boiled'],stamp:['煮','BOIL'],text:['减少工具费用，或保留作为费用的食材。','Reduce tool costs, or preserve food used as a cost.'],icon:'tea',color:'#a9cfd5'},
 smoked:{name:['烟熏','Smoked'],stamp:['熏','SMOKE'],text:['工具多用一次；连抽装置更快触发。','An extra tool use, or faster reveal-device triggers.'],icon:'grill',color:'#bc9ac9'},
 glazed:{name:['蜜渍','Glazed'],stamp:['蜜','GLAZE'],text:['强化组合计分，或加快此牌成长。','Improve collection scoring, or this card’s growth.'],icon:'juice',color:'#edbd38'},
};
const profile=(key,zh,en)=>({key,text:[zh,en]});
export const FRIED={
 rice:profile('pairTargets','配对清理数量 +1。','Pair: clear one additional trouble.'),
 mint:profile('pairTargets','配对恢复工具数量 +1。','Pair: ready one additional tool.'),
 toast:profile('pairTargets','配对取回食材数量 +1。','Pair: reclaim one additional paid food.'),
 hazelnut:profile('pairTargets','配对时可为2张散食材各找出1张同名牌。','Pair: fetch a match for each of two unpaired foods.'),
 fish:profile('pairAmount','配对查看数量 +1。','Pair: peek one additional card.'),
 tea:profile('pairAmount','配对获得的零食材费用次数 +1。','Pair: gain one additional free food-cost use.'),
 dumpling:profile('pairAmount','配对时两张牌获得的额外分各 +1。','Pair: both foods gain one more bonus point.'),
 noodle:profile('pairAmount','配对时每件已横置工具的额外计分 +1。','Pair: exhausted tools gain one more scoring point each.'),
 cheese:profile('pairAmount','配对时复制的食材数量 +1。','Pair: create one additional copy of the chosen food.'),
 tofu:profile('pairAmount','配对积攒的额外生成数量 +1。','Pair: queue one additional food copy.'),
 sushi:profile('pairAmount','配对生成的鱼干数量 +1。','Pair: create one additional Dried fish.'),
 popcorn:profile('pairAmount','配对生成的爆米花数量 +1。','Pair: create one additional Popcorn.'),
 egg:profile('consumeAmount','被消耗时生成2张饭团。','Consumed: create two Rice balls.'),
 pear:profile('consumeAmount','被消耗时查看3张。','Consumed: peek three.'),
 coffee:profile('revealAmount','翻出时恢复最早横置的2件工具。','Reveal: ready the two earliest exhausted tools.'),
 torch:profile('toolAmount','使用：查看2张。','Use: peek two.'),
 scope:profile('toolAmount','使用：消耗1张食材，查看4张。','Use: consume one food to peek four.'),
 mold:profile('toolAmount','使用：原费用不变，临时复制2张所选食材原版。','Use: pay the usual cost; create two base copies of the chosen food.'),
 juicer:profile('toolAmount','使用：消耗1张散食材，生成2张果汁和1张残渣。','Use: consume one unpaired food to create two Juices and one Residue.'),
 cleaver:profile('toolAmount','使用：消耗1对食材，生成4张饭团。','Use: consume one food pair to create four Rice balls.'),
 mincer:profile('toolAmount','使用：消耗1张散食材，生成3张碎肉。','Use: consume one unpaired food to create three Minces.'),
 doughpress:profile('toolAmount','使用：生成2张临时起面团原版。','Use: create two temporary base Sourdoughs.'),
 sproutbox:profile('toolAmount','使用：生成3张临时豆芽。','Use: create three temporary Sprouts.'),
 washpress:profile('toolAmount','使用：清理1张麻烦，生成2张豆芽。','Use: clear one trouble and create two Sprouts.'),
 menu:profile('toolAmount','使用：同名食材各获得2分。','Use: foods of the chosen name each gain two points.'),
};
const GLAZED={
 cola:['此牌的同名组合计分 +1（全蜜渍时合计2／7／12…）。','Colas total 2 / 7 / 12 / 17… when all are Glazed.'],
 cake:['每对桌面食材使此牌计3分。','Scores three per food pair in play.'],
 salad:['每种桌面食材使此牌计2分。','Scores two per distinct food in play.'],
 skewer:['每张已消耗食材使此牌计2分。','Scores two per consumed food in the discard.'],
 cookie:['同名数量为奇数时，此牌计5分。','Scores five if the number of Cookies is odd.'],
 marshmallow:['桌上仅1张同名牌时，此牌计10分。','Scores ten if this is the only Marshmallow in play.'],
 icecream:['初始9分，之后每次翻牌仍减少1分。','Starts at nine; still loses one per later reveal.'],
 fridge:['桌面每张鱼干使此牌计2分。','Scores two per Dried fish in play.'],
 pantry:['每张未配对永久食材使此牌计2分。','Scores two per unpaired permanent food.'],
 picnic:['每种食材对子使此牌计3分。','Scores three per distinct paired food kind.'],
 recyclingbag:['垃圾桶每张麻烦使此牌计2分。','Scores two per trouble in the discard.'],
 glasscase:['桌面每张临时食材使此牌计2分。','Scores two per temporary food in play.'],
};
const growthKinds=['stockpot','sourdough','motherstarter','tastingplate','pickle','vintage'];
export function enchantmentText(c,id,defs){
 const kind=c.original||c.kind,def=defs[kind];if(!def)return null;
 if(id==='raw'&&def.type==='food'&&!def.noPair)return ['未配对时基础分翻倍。','Double its unpaired base score.'];
 if(id==='fried')return FRIED[kind]?.text||null;
 if(id==='boiled'){
  if(def.type==='food')return [`每桌首次用于${defs.scope.name[0]}或${defs.bell.name[0]}的食材费用时，保留此牌。`,`Once per table, preserve this food when used as the food cost of ${defs.scope.name[1]} or ${defs.bell.name[1]}.`];
  if(['scope','bell'].includes(kind))return ['此工具的食材费用为0。','This tool’s food cost is zero.'];
  if(def.bankCost)return [`此工具的装袋分数费用 ${def.bankCost} → ${Math.ceil(def.bankCost/2)}。`,`This tool’s banked-point cost: ${def.bankCost} → ${Math.ceil(def.bankCost/2)}.`];
 }
 if(id==='smoked'){
  if(def.type==='tool'&&kind!=='packingcord')return ['每桌额外使用1次，费用照常。','One extra use each table; costs still apply.'];
  if(['metronome','sweeper'].includes(kind))return ['原效果每翻出2张食材触发一次。','Its effect triggers every two foods revealed.'];
 }
 if(id==='glazed')return GLAZED[kind]||(growthKinds.includes(kind)?['此牌获得的成长进度翻倍。','This card gains twice the growth progress.']:null);
 return null;
}
export const canEnchant=(c,id,defs)=>!c.temporary&&!c.enchantment&&!!enchantmentText(c,id,defs);
export const enchantAmount=(c,key)=>c.enchantment==='fried'&&FRIED[c.kind]?.key===key?1:0;
export const bankCost=(c,defs)=>{const base=Math.ceil((defs[c.kind]?.bankCost||0)/(c.enchantment==='boiled'?2:1));return base?Math.max(1,base-(c.costDiscount||0)):0;};
