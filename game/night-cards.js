const food=(name,text,extra={})=>({type:'food',name,text,color:'#dec79d',...extra});
const tool=(name,text,extra={})=>({type:'tool',name,text,color:'#afc5be',...extra});
const device=(name,text,extra={})=>({type:'device',name,text,color:'#c8c69e',...extra});
export const NIGHT_CARDS={
 blacktea:food(['红茶','Black tea'],['也可与酥饼配对。','Can also pair with Shortbread.'],{pairsWith:['shortbread']}),
 shortbread:food(['酥饼','Shortbread'],['也可与红茶配对。','Can also pair with Black tea.'],{pairsWith:['blacktea']}),
 pastrymold:tool(['饼干模','Pastry mould'],['使用：将1张散食材变成酥饼。','Use: turn one unpaired food into Shortbread.'],{target:'food'}),
 duetstand:device(['双层点心架','Duet stand'],['桌上每对不同名食材使此牌计4分。','Scores 4 per differently named food pair in play.'],{scoring:true}),
 crouton:food(['面包丁','Croutons'],['被消耗：若曾在本桌配对，生成2张临时饭团，每桌一次。','Consumed after pairing this table: create two temporary Rice balls, once per table.']),
 banquetfork:tool(['分餐叉','Carving fork'],['使用：消耗1对食材，此牌获得其当前总分的两倍。','Use: consume a food pair; gain twice their combined current score.'],{target:'pair',scoring:true}),
 servingcloche:tool(['银餐罩','Silver cloche'],['使用：消耗1对食材，获得3次工具食材费用为0。','Use: consume a food pair to gain three free tool food costs.'],{target:'pair'}),
 sauceboat:device(['酱汁盅','Gravy boat'],['每消耗1张本桌配对过的食材，此牌获得3分。','Whenever a food that paired this table is consumed, gain 3 points.'],{scoring:true}),
 spareparts:food(['开心果','Pistachio'],['被消耗：恢复最早入桌的横置工具，每桌一次。','Consumed: ready the exhausted tool that entered earliest, once per table.']),
 scrapbasket:device(['剩菜篮','Leftovers basket'],['每桌首次取回食材时，额外生成1张该食材的临时原版。','The first food you reclaim each table also creates one temporary base copy.']),
 windingkey:tool(['发条钥匙','Winding key'],['使用：弃置自身，恢复所有其他工具，每桌一次。','Use: discard this to ready all other tools, once per table.']),
 repairtag:tool(['修理单','Repair ticket'],['使用：消耗4装袋分数，取回1件弃置工具并恢复。','Use: consume 4 banked points to reclaim one discarded tool ready.'],{target:'discardTool',bankCost:4}),
 lunchorder:food(['预订餐','Advance order'],['配对：下桌开始时生成1张临时饭团。','Pair: create one temporary Rice ball at the start of the next table.']),
 thermos:tool(['保温壶','Thermos'],['使用：储存1张食材，本桌不计分，留到下桌。','Use: store one food; it scores nothing this table and returns next table.'],{target:'storeFood'}),
 reservationbell:device(['订餐铃','Order bell'],['收摊：下桌生成1张本桌最后配对食材的临时原版。','Cash out: next table, create one temporary base copy of your last paired food.']),
 drygoods:food(['陈皮','Dried peel'],['达标收摊时若在桌上，永久增加1基础分，最多8分。','If in play at a successful cash-out, permanently gain 1 base point, up to 8.']),
 harlequinpudding:food(['双色布丁','Marbled pudding'],['翻出：变成最近配对的食材，无则不变。','Reveal: turn into your most recently paired food, if any.']),
 cookiepress:tool(['压花模','Pattern press'],['使用：将1张散食材变成最近配对的食材。','Use: turn one unpaired food into your most recently paired food.'],{target:'food'}),
 paletteplate:device(['调色盘','Palette plate'],['每有1张牌变成食材，此牌获得3分。','Whenever a card transforms into a different food, gain 3 points.'],{scoring:true}),
 sourcabbage:food(['酸菜','Sour cabbage'],['配对：将最早入桌的1张麻烦变成饭团。','Pair: turn the oldest trouble in play into a Rice ball.']),
 servicepass:tool(['熟客券','Regular’s voucher'],['使用：1件工具本桌的装袋分数费用减2，最低1分。','Use: reduce one tool’s banked cost by 2 this table, to a minimum of 1.'],{target:'costTool'}),
 firstcourse:food(['开胃菜','Appetizer'],['配对：桌上未使用过的工具各获得1次食材费用为0。','Pair: each tool in play not yet used this table gets one free food cost.']),
 checklist:tool(['交班表','Shift sheet'],['使用：恢复本桌只使用过1次的所有其他工具。','Use: ready all other tools used exactly once this table.']),
 silvertray:device(['银托盘','Silver tray'],['从1分起，每使用一种不同工具，分数翻倍，最多32分。','Starts at 1; doubles for each distinct tool used while in play, up to 32.'],{scoring:true}),
};
export const NIGHT_SYSTEMS=[
 {id:'duet',name:['茶点搭配','Tea for two'],cards:['blacktea','shortbread','pastrymold','duetstand'],support:['wild','tea','toast'],text:['凑不同名的一对，决定哪些食材值得变成酥饼。','Build mixed pairs; decide which foods to turn into Shortbread.'],risk:['需要两种食材；变形会失去原能力。','Needs two names; transforming loses the old ability.']},
 {id:'banquet',name:['整对上菜','Serve the pair'],cards:['crouton','banquetfork','servingcloche','sauceboat'],support:['rice','cleaver','cake'],text:['把已经配好的对子作为资源，换取集中得分或工具次数。','Spend completed pairs for a concentrated payoff or tool uses.'],risk:['消耗后失去对子、点心架与蛋糕的计分。','Loses the pair and its collection bonuses.']},
 {id:'salvage',name:['拆旧修新','Salvage workshop'],cards:['spareparts','scrapbasket','windingkey','repairtag'],support:['scoop','toast','grill'],text:['让弃牌重新工作，选择何时交出一次性的全桌恢复。','Reclaim discarded resources; choose when to spend the mass refresh.'],risk:['关键效果每桌一次；修理消耗装袋分数。','Key effects are once per table; repairs spend your bank.']},
 {id:'reserve',name:['隔桌备餐','Tomorrow’s service'],cards:['lunchorder','thermos','reservationbell','drygoods'],support:['ledger','scope','rice'],text:['牺牲眼前食材，为下一桌准备开局资源。','Trade food now for resources at the next table.'],risk:['先要活着收摊；已备资源无法救本桌。','Must survive cash-out; tomorrow’s resources cannot save this table.']},
 {id:'transform',name:['变换厨房','Changing the menu'],cards:['harlequinpudding','cookiepress','paletteplate','sourcabbage'],support:['stove','jar','wild'],text:['用最后配对的名字塑造桌面，变形本身也能得分。','Use the last paired name to shape the table; transformations also score.'],risk:['不复制、不重置配对次数，也不触发新名字的翻出能力。','No copies, pair resets, or new reveal triggers.']},
 {id:'service',name:['轮班工具','One of each'],cards:['servicepass','firstcourse','checklist','silvertray'],support:['torch','scope','mint'],text:['多种工具轮流工作；首用和第二次使用各有收益。','Rotate different tools for first-use and second-use payoffs.'],risk:['重复一种工具不会让银托盘继续翻倍。','Repeating one tool will not keep doubling the tray.']},
];
export const NIGHT_PACKAGES=NIGHT_SYSTEMS.flatMap(group=>[
 {id:'night-'+group.id+'-a',name:group.name,cards:[group.cards[0],group.cards[0],group.cards[3],'paper']},
 {id:'night-'+group.id+'-b',name:group.name,cards:[group.cards[1],group.cards[2],'rust']},
]);
