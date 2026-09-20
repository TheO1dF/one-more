const relic=(name,text,mode='passive',cost=0)=>({name,text,mode,cost});
export const RELICS = {
 shaker:relic(['摇签筒','Shaking cup'],['每桌一次：重洗剩余牌堆，包含炸弹，不恢复首张保护。','Once per table: shuffle the remaining pile, bombs included; no renewed first-card protection.'],'active'),
 lunchbox:relic(['便当盒','Lunchbox'],['收摊时可放弃1张未配对食材的分数，将它留到下桌。','At cash-out, forgo one unpaired food’s score to keep it for the next table.']),
 recycler:relic(['回收钳','Recovery tongs'],['每桌一次：取回1张作为工具费用消耗的食材。','Once per table: reclaim one food consumed as a tool cost.'],'active'),
 splitter:relic(['拆餐夹','Pair splitter'],['每桌一次：拆开一对食材；失去配对加分，本桌不能再次配对。','Once per table: break a pair; it loses its pair bonus and cannot pair again this table.'],'active'),
 pocketwatch:relic(['怀表','Pocket watch'],['每桌首次查看，多看1张；仍受浓雾限制。','Your first peek each table sees one extra card; Fog still applies.']),
 matchbox:relic(['火柴盒','Matchbox'],['每桌首次配对，两张食材各加1分。','Your first pair each table gives both foods +1 point.']),
 silverfork:relic(['银叉','Silver fork'],['每桌首次实际消耗食材，获得1分装袋分数。','The first food actually consumed each table grants 1 banked point.']),
 linen:relic(['餐巾','Linen napkin'],['每桌首次清理麻烦，查看下一张。','The first trouble cleared each table peeks at the next card.']),
 coinpurse:relic(['筹码袋','Chip purse'],['每桌首次使用工具，获得2分装袋分数。','Your first tool use each table grants 2 banked points.']),
 redseal:relic(['红蜡封','Red wax seal'],['每桌首次生成临时食材，额外生成1张同名原版。','The first temporary food created each table gets one extra base copy.']),
 recipebook:relic(['食谱','Recipe book'],['每桌第二种食材首次配对时，恢复最早入桌的1件已用工具。','Each table, pairing a second food type readies your earliest exhausted tool in play.']),
 luckybone:relic(['幸运骨','Lucky bone'],['每桌第3次使用工具，查看2张。','Your third tool use each table peeks at two cards.']),
 emptyplate:relic(['空餐盘','Empty plate'],['每桌开始时，获得1张临时饭团。','Start each table with one temporary Rice ball.']),
 bottlestopper:relic(['瓶塞','Bottle stopper'],['每桌第1次工具的食材费用为0。','Your first tool food cost each table is 0.']),
 neonsign:relic(['霓虹招牌','Neon sign'],['从牌组外选牌时，选项由3张变成4张。','Choices from outside your deck offer four cards instead of three.']),
 scale:relic(['天平','Balance scale'],['恰好达标收摊时，额外获得4分装袋分数。','Cash out at exactly the target to gain 4 extra banked points.']),
 oldkey:relic(['黄铜钥匙','Brass key'],['每桌一次：消耗3分装袋分数，查看下一张。','Once per table: consume 3 banked points to peek at the next card.'],'active',3),
 polishingstone:relic(['抛光石','Polishing stone'],['每桌一次：消耗2分装袋分数，恢复1件工具。','Once per table: consume 2 banked points to ready one tool.'],'active',2),
 trashpass:relic(['清运通行证','Cleanup pass'],['每桌一次：消耗2分装袋分数，清理1张桌面麻烦。','Once per table: consume 2 banked points to clear one trouble in play.'],'active',2),
 shellpair:relic(['双贝壳','Twin shells'],['与万能酱配对的普通食材加1分。','A non-wild food gains +1 point when paired with Wild sauce.']),
};
for(const [id,r] of Object.entries(RELICS))r.icon='relic-'+id;
