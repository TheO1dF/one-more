import {STAPLE_COST} from './staples.js';
import {DEALER_ROUTES} from './dealer-events.js';
import {ENCHANTMENTS} from './enchantments.js';
export {ENCHANTMENTS};

export const ROUTES = {
  ...DEALER_ROUTES,
  staple: { type:'staple', name:['装订摊','Staple stand'], text:['消耗4分，随机装订3张非炸弹永久牌，抽到时一起上桌。','Consume 4 banked points to staple 3 random permanent non-bomb cards; draw them together.'], icon:'stapler', cost:STAPLE_COST },
  ...Object.fromEntries(Object.entries(ENCHANTMENTS).map(([id,e])=>[id,{type:'enchant',name:[e.name[0]+'工坊',e.name[1]+' workshop'],text:['为1张适用牌附魔「'+e.name[0]+'」。','Enchant one eligible card with '+e.name[1]+'.'],icon:e.icon}])),
  lantern: { type: 'event', name: ['灯笼巷', 'Lantern lane'], text: ['下一桌开局，查看3张顶牌。', 'Peek at three cards at the next table’s start.'], icon: 'candle' },
  tea: { type: 'event', name: ['茶水站', 'Tea stand'], text: ['下一桌前2次工具的食材费用为0。', 'Your first two tool food costs next table are 0.'], icon: 'mint' },
  helper: { type: 'event', name: ['临时帮厨', 'Helping hand'], text: ['下一桌开局，桌上放1件临时小手电。', 'Start the next table with a temporary Flashlight in play.'], icon: 'torch' },
  prune: { type: 'remove', name: ['回收摊', 'Salvage stall'], text: ['消耗4分装袋分数，永久删除1张非炸弹牌。', 'Consume 4 banked points to permanently remove one non-bomb card.'], icon: 'sifter', cost: 4 },
};
