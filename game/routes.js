export const ENCHANTMENTS = {
  raw: { name: ['生腌', 'Raw'], stamp: ['腌', 'RAW'], text: ['未配对时分数翻倍。', 'Double this food’s unpaired score.'], icon: 'fish', color: '#afcdb4' },
  fried: { name: ['油炸', 'Fried'], stamp: ['炸', 'FRY'], text: ['配对时，获得1次工具免付食材。', 'Pair: gain one tool waiver.'], icon: 'stove', color: '#eab679' },
  boiled: { name: ['水煮', 'Boiled'], stamp: ['煮', 'BOIL'], text: ['每轮首次支付工具费用时，不被弃置。', 'Once per round, paying a tool cost does not discard this food.'], icon: 'tea', color: '#a9cfd5' },
};

export const ROUTES = {
  raw: { type: 'enchant', name: ['生腌小摊', 'Raw bar'], text: ['给1张可配对食材附魔「生腌」。', 'Give one pairable food the Raw enchantment.'], icon: 'fish' },
  fried: { type: 'enchant', name: ['油炸小摊', 'Fry stand'], text: ['给1张可配对食材附魔「油炸」。', 'Give one pairable food the Fried enchantment.'], icon: 'stove' },
  boiled: { type: 'enchant', name: ['水煮小摊', 'Boiling pot'], text: ['给1张可配对食材附魔「水煮」。', 'Give one pairable food the Boiled enchantment.'], icon: 'tea' },
  lantern: { type: 'event', name: ['灯笼巷', 'Lantern lane'], text: ['下一桌开局，查看3张顶牌。', 'Peek at three cards at the next table’s start.'], icon: 'candle' },
  tea: { type: 'event', name: ['茶水站', 'Tea stand'], text: ['下一桌获得2次工具免付食材。', 'Start the next table with two tool waivers.'], icon: 'mint' },
  helper: { type: 'event', name: ['临时帮厨', 'Helping hand'], text: ['下一桌开局，桌上放1件临时小手电。', 'Start the next table with a temporary Flashlight in play.'], icon: 'torch' },
  prune: { type: 'remove', name: ['回收摊', 'Salvage stall'], text: ['支付4分已装袋分数，永久删除1张非炸弹牌。', 'Pay 4 banked points to permanently remove one non-bomb card.'], icon: 'sifter', cost: 4 },
};
