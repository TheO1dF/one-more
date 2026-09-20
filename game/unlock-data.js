export const UNLOCKS={
 first_pair:{cards:['dumpling','cake','picnic'],relics:['matchbox'],backs:['roulette']},
 consume:{cards:['egg','pear','scoop','skewer','grill','choppingboard','compostfork'],relics:['silverfork']},
 create:{cards:['tofu','cheese','sushi','servingbell','glasscase','ladle'],relics:['redseal','emptyplate']},
 three_pairs:{cards:['chili','menu'],relics:['recipebook','shellpair']},
 ten_tools:{cards:['coffee','noodle','magnet','whetstone','timer'],relics:['polishingstone']},
 midnight:{cards:['shrimp','lemon','fan','washbucket','spicejar'],relics:['pocketwatch','linen','trashpass'],backs:['midnight'],challenges:['pairs','barehands']},
 clear:{cards:['cookie','marshmallow','icecream','pantry'],relics:['neonsign','scale'],backs:['ivory'],challenges:['doublebomb']},
 tools:{art:['classic']},
};
export const CARD_BACKS={casino:['赌场印刷','Casino print'],roulette:['轮盘','Roulette'],midnight:['子夜','Midnight'],ivory:['象牙','Ivory']};
export const DIFFICULTIES=[
 {name:['入座','Open table'],text:['第1–4桌单骰，第5–10桌双骰。','One die at tables 1–4; two at tables 5–10.']},
 {name:['加码','Higher stakes'],text:['第8桌起使用三颗骰子。','Three dice from table eight.']},
 {name:['深夜场','Late shift'],text:['三骰规则；各阶段目标额外增加2／4／8分。','Three-die rules; add 2 / 4 / 8 to each stage’s target raise.']},
 {name:['最后一桌','Last call'],text:['深夜场规则；每增加15张牌追加一枚炸弹。','Late-shift rules; an extra bomb per 15 added cards.']},
];
export const CHALLENGES={
 standard:{name:['常规牌局','Standard'],text:['累计分通关十桌。','Bank enough points to clear ten tables.']},
 pairs:{name:['成双成对','In pairs'],text:['未配对食材不计分。','Unpaired food scores zero.']},
 barehands:{name:['白手起家','Bare hands'],text:['初始工具换成食材；构筑时仍可获得工具。','Start with food instead of tools; tools remain in the draft pool.']},
 doublebomb:{name:['双重赌约','Double jeopardy'],text:['从两枚炸弹开始，首张仍然安全。','Start with two bombs; the first reveal is still safe.']},
};
export function unlockSet(meta,type){return new Set(Object.entries(UNLOCKS).filter(([id])=>meta.achievements?.[id]).flatMap(([,reward])=>reward[type]||[]));}
export function availableIds(meta,type,all){const gated=new Set(Object.values(UNLOCKS).flatMap(r=>r[type]||[])),unlocked=unlockSet(meta,type);return all.filter(id=>!gated.has(id)||unlocked.has(id));}
export function unlockRequirement(id,type){return Object.keys(UNLOCKS).find(key=>UNLOCKS[key][type]?.includes(id));}
export function maxDifficulty(meta){return Math.min(3,Math.max(0,...Object.keys(meta.ascensionWins||{}).filter(k=>meta.ascensionWins[k]&&/^[0-3]$/.test(k)).map(k=>Number(k)+1)));}
export function ruleDiceCount(s,round=s.round+1){return round>=8&&s.difficulty>=1?3:round>=5?2:1;}
export function stageRaise(s,round=s.round+1){return s.difficulty>=2?(round>=8?8:round>=5?4:2):0;}
