const relic=(name,text,mode='passive',cost=0)=>({name,text,mode,cost});
export const RELICS = {
 gildedmask:relic(['换面徽章','Mask badge'],['每桌首次将牌变成食材，生成1张该食材的临时原版。','The first transformation into food each table creates one temporary base copy.']),
 prismseal:relic(['菱镜印','Prism stamp'],['每桌首次配对变形食材，恢复最早入桌的1件横置工具。','Your first pair containing transformed food each table readies the oldest exhausted tool.']),
 bonechina:relic(['骨瓷盘','Bone china'],['每桌消耗第2张食材时，生成1张临时万能酱。','Consuming your second food each table creates one temporary Wild sauce.']),
 scrapvoucher:relic(['回收券','Salvage voucher'],['每桌首次消耗配对过的食材，恢复最早入桌的1件横置工具。','The first consumed food that paired this table readies the oldest exhausted tool.']),
 sealclip:relic(['封口夹','Sealing clip'],['储存食材时，该牌增加2分，并将这2分留到下桌。','Storing a food adds 2 points to it, carried with it into the next table.']),
 reservebench:relic(['预留座','Reserved seat'],['每桌取出前2张储存食材时，各生成1张临时同名原版。','Each of the first two stored foods returned per table creates one temporary base copy.']),
 pangift:{...relic(['潘神赠礼','Pan’s Gift'],['一次：翻出炸弹时免于死亡；酒杯碎裂，炸弹洗回剩余牌堆。仅潘神事件可得。','Once: survive a bomb reveal. The cup breaks and the bomb shuffles into the remaining deck. Pan event only.']),rewardOnly:true,lore:['杯底印着“破损照价赔偿”。有人用刀尖划掉，另刻了一个羊头。','BREAKAGES MUST BE PAID FOR is stamped beneath the foot. A knife has crossed it out and scratched in a goat’s head.']},
 autotongs:{...relic(['自动配对钳','Auto-pair tongs'],['第10桌通关奖励；开启后，翻出的食材自动配对，目标优先同名与最早入桌。','Table 10 clear reward; when enabled, revealed foods auto-pair, preferring matching names and the oldest legal targets.'],'toggle'),rewardOnly:true},
 silencer:relic(['静音铃','Silent bell'],['配对不触发任何效果，但已配对食材的分数再翻倍。','Pairing triggers no effects, but paired food scores twice as much.']),
 streakcounter:relic(['连抽计数器','Streak counter'],['每连续翻出4张食材，本桌倍率×2；其他牌打断连抽。','Every four consecutive food reveals multiply this table’s score by 2; other cards break the streak.']),
 shaker:relic(['摇签筒','Shaking cup'],['每桌一次：重洗剩余牌堆，并换走原顶牌（仅剩一张或一叠时除外）；仍可能换来炸弹。','Once per table: shuffle and replace the top card (unless only one card or bound stack remains); the new top may still be a bomb.'],'active'),
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
// Withdrawn designs remain readable only for an existing local preview save.
for(const id of ['gildedmask','prismseal','bonechina','scrapvoucher','sealclip','reservebench'])RELICS[id].retired=true;
RELICS.shaker.lore=['借用牌还挂在筒口。姓名一栏贴了许多层纸，最底下一层已经发黄。','The loan tag still hangs from the rim. New names have been pasted over old ones; the bottom layer has yellowed.'];
RELICS.lunchbox.lore=['盖内粘着纸条：“饭趁热吃。”落款被油浸透，看不清了。','A note inside the lid reads: EAT WHILE IT IS HOT. Grease has soaked through the signature.'];
RELICS.coinpurse.lore=['领回凭条：需本人到场。柜台把“本人”两个字圈了起来。','Collection slip: OWNER MUST BE PRESENT. Someone at the counter has circled OWNER.'];
