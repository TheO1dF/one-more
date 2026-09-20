import {STAPLE_COST} from './staples.js';
import {DEALER_ROUTES} from './dealer-events.js';
export const ENCHANTMENTS = {
  raw: { name: ['生腌', 'Raw'], stamp: ['腌', 'RAW'], text: ['未配对时分数翻倍。', 'Double this food’s unpaired score.'], icon: 'fish', color: '#afcdb4' },
  fried: { name: ['油炸', 'Fried'], stamp: ['炸', 'FRY'], text: ['配对：下1次工具的食材费用为0。', 'Pair: your next tool food cost is 0.'], icon: 'stove', color: '#eab679' },
  boiled: { name: ['水煮', 'Boiled'], stamp: ['煮', 'BOIL'], text: ['每轮首次作为工具费用时，无需消耗此牌。', 'Once per round, this food is not consumed as a tool cost.'], icon: 'tea', color: '#a9cfd5' },
};

export const ROUTES = {
  ...DEALER_ROUTES,
  staple: { type:'staple', name:['装订摊','Staple stand'], text:['消耗4分，随机装订3张非炸弹永久牌，抽到时一起上桌。','Consume 4 banked points to staple 3 random permanent non-bomb cards; draw them together.'], icon:'stapler', cost:STAPLE_COST },
  raw: { type: 'enchant', name: ['生腌小摊', 'Raw bar'], text: ['给1张可配对食材附魔「生腌」。', 'Give one pairable food the Raw enchantment.'], icon: 'fish' },
  fried: { type: 'enchant', name: ['油炸小摊', 'Fry stand'], text: ['给1张可配对食材附魔「油炸」。', 'Give one pairable food the Fried enchantment.'], icon: 'stove' },
  boiled: { type: 'enchant', name: ['水煮小摊', 'Boiling pot'], text: ['给1张可配对食材附魔「水煮」。', 'Give one pairable food the Boiled enchantment.'], icon: 'tea' },
  lantern: { type: 'event', name: ['灯笼巷', 'Lantern lane'], text: ['下一桌开局，查看3张顶牌。', 'Peek at three cards at the next table’s start.'], icon: 'candle' },
  tea: { type: 'event', name: ['茶水站', 'Tea stand'], text: ['下一桌前2次工具的食材费用为0。', 'Your first two tool food costs next table are 0.'], icon: 'mint' },
  helper: { type: 'event', name: ['临时帮厨', 'Helping hand'], text: ['下一桌开局，桌上放1件临时小手电。', 'Start the next table with a temporary Flashlight in play.'], icon: 'torch' },
  prune: { type: 'remove', name: ['回收摊', 'Salvage stall'], text: ['消耗4分装袋分数，永久删除1张非炸弹牌。', 'Consume 4 banked points to permanently remove one non-bomb card.'], icon: 'sifter', cost: 4 },
};
