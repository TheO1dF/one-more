import {sceneArt} from './world-art.js';
const scenes={
 press:[['压牌台','荷官把两张牌叠齐，推到压具下面。\n“留哪张的花纹？先放上面。”'],['The card press','The dealer squares the cards under the press.\n“Whose finish are we keeping? Put that one on top.”']],
 coldlocker:[['寄存柜','侍者挪开一只旧饭盒，给您腾出位置。盒盖上的姓氏与您相同。\n“下桌送过去。凭条收好。”'],['Cold storage','The server moves an old lunch tin aside. Your surname is scratched into its lid.\n“We will bring yours to the next table. Keep the claim ticket.”']],
 menuchange:[['换菜单','厨子把三张牌压在砧板上，等您挑。\n“吃腻了就换。原来的那份，我收走。”'],['A new menu','The cook pins three cards to the chopping board.\n“Pick something else if you are tired of it. I keep the old one.”']],
 closingmeal:[['打烊饭','厨子拨开两只空碟，露出下面抵账的东西。\n“两份饭，换这个。”\n您看向墙上的钟。时针已被拆走。'],['The closing meal','The cook moves two empty plates aside to reveal the pledge beneath them.\n“Two meals for this.”\nYou look up at the clock. Its hour hand is missing.']],
 lantern:[['灯笼巷','灯夫掀起灯罩，露出里面一小截蜡烛。“只够照三张。”\n荷官把您往灯下让了让，自己站在光外。'],['Lantern lane','The lamplighter lifts the shade. A stub of candle remains. “Enough for three cards.”\nThe dealer makes room for you under the light. He stays outside it.']],
 tea:[['茶房 · 阿穗','阿穗把两张餐券压在杯底。荷官伸手，她先按住了杯子。\n“这回算您账上。”\n“当然。”他笑着说。她这才松手。'],['The tea room · Sui','Sui slips two meal tickets under the cup. When the dealer reaches for it, she holds it down.\n“On your account this time.”\n“Of course.” Only then does she let go.']],
 helper:[['茶房 · 阿穗','阿穗递来手电，拇指挡住了背面的刻字。荷官转过身去，她才移开手。\n那是您的姓。下面刻着“第九桌”。'],['The tea room · Sui','Sui hands you a flashlight, her thumb covering an inscription. She waits for the dealer to turn away.\nYour surname is scratched beneath it. Under that: “TABLE NINE.”']],
 prune:[['回收摊','老人把牌对折，沿折痕撕开。纸里露出一绺头发。\n您伸手去捡，荷官按住了您的手腕。\n“这张已经退了，先生。”'],['The salvage counter','The old man folds the card and tears along the crease. A lock of hair falls out.\nYou reach for it. The dealer catches your wrist.\n“That one has been returned, sir.”']],
 staple:[['装订摊','柜台上摆着一叠钉错的牌。最下面那张露出半张脸，嘴被钉住了。\n伙计把它翻过去，拿起订书机。\n“您的三张。核对一下。”'],['The staple counter','A botched stack sits on the counter. The bottom card shows half a face, a staple across its mouth.\nThe clerk turns it over and picks up the stapler.\n“Your three. Check them.”']],
 duplicate:[['复写台','伙计把新牌和旧牌并排推来，连杯底留下的水印都一模一样。\n“收一份钱？”您问。\n“现在是。”荷官替他回答。'],['The copy desk','The clerk slides both cards over. Even the ring left by your glass is identical.\n“You charge for one?”\n“For now,” says the dealer.']],
 pawn:[['典当柜台','柜台上有一枚婚戒，内圈刻着日期。您多看了一眼。\n荷官把它挪到后面，指了指您的抵押物。\n“先谈这件。”'],['The pawn counter','A wedding ring lies on the counter, a date engraved inside. You look a moment too long.\nThe dealer moves it out of reach and points to your pledge.\n“This one first.”']],
 trade:[['换牌','荷官收走两张食材，把三张新牌摊开。袖口滑出一枚旧筹码，他立刻用小指勾了回去。\n那是您进门时交出去的最后一枚。'],['The exchange','The dealer takes your two foods and lays out three new cards. An old chip slips from his cuff; his little finger hooks it back.\nIt is the last chip you handed over when you arrived.']],
 wager:[['加码柜台','荷官蘸了两次印泥，才把“二倍”盖在账单上。\n“抵押物归您，输赢照旧。请看清再签。”'],['Raised stakes','The dealer inks the stamp twice before pressing DOUBLE onto the bill.\n“The pledge is yours if you win. The rest of our terms stand. Read before signing.”']],
 raw:[['厨房 · 冷台','厨子往盘里倒盐，袖口卷起，手腕上也挂着一块号码牌。\n“我以前坐第四桌。”他把袖子放下来，“您要腌哪张？”'],['The cold kitchen','The cook tips salt onto a plate. A numbered tag hangs from his wrist.\n“I used to sit at table four.” He rolls his sleeve down. “Which card?”']],
 fried:[['厨房 · 炸锅','厨子把油锅盖紧，等里面不再响，才接过您的牌。\n“听见也别开。”他说，“上一位就是这么没的。”'],['The fryer','The cook holds the lid down until the noise stops, then takes your card.\n“Whatever you hear, keep it shut. That is how I lost the last man.”']],
 boiled:[['厨房 · 蒸汽','锅盖掀开，厨子用湿布裹住手。墙上的值班表写满了名字，离职一栏全是空的。\n荷官替您挡住蒸汽：“当心烫。”'],['The kitchen steam','The cook wraps a damp cloth around his hand and lifts the lid. Names fill the duty roster. The departure column is blank.\nThe dealer shields you from the steam. “Careful.”']],
 smoked:[['厨房 · 烟房','烟房门后挂着许多礼帽，帽檐上别着桌号。\n荷官把门带上：“那边不接待客人。”'],['The smoke room','Rows of top hats hang behind the door, table numbers pinned to their brims.\nThe dealer closes it. “Staff only.”']],
 glazed:[['厨房 · 糖罐','您伸手时，厨子先把糖罐往后挪了半寸。\n“牌放这里。手收回去。”\n他的左手少了两根指头。'],['The sugar jar','As you reach over, the cook moves the jar half an inch away.\n“Card here. Hand back.”\nTwo fingers are missing from his left hand.']],
 pan:[['潘神的包厢','潘神用杯脚敲了两下空椅子。荷官停在门槛外。\n“他按规矩办事。”潘神说，“我卖的，正好是规矩外的东西。”'],['Pan’s booth','Pan taps the empty chair twice with the foot of his glass. The dealer stops at the threshold.\n“He sticks to his rules,” Pan says. “I sell exceptions.”']],
 mystery:[['意外来客','侍者送来一只托盘，下面压着一张已经签过名的收据。\n荷官先看了一眼收据，才让您揭盖。'],['The visitor','A server brings a covered tray. A signed receipt is tucked beneath it.\nThe dealer reads the receipt before letting you lift the cover.']],
 levy:[['抽水','侍者把几枚筹码划进盘子，没有问您。荷官翻过入场收据，指了指背面的那一行小字。'],['House fee','The server sweeps several chips onto his tray without asking. The dealer turns over your entry receipt and points to the small print.']],
 pressure:[['临时加码','侍者换掉目标牌，旧数字还没来得及擦。您喊住他，他只朝荷官看了一眼。'],['Raised stakes','The server replaces the target before wiping off the old number. You call him back. He looks only at the dealer.']],
 cap:[['封顶','荷官把一个浅盘放到您手边。“下一桌只收这些。多出来的，劳驾留在桌上。”'],['House limit','The dealer sets a shallow tray beside you. “This much at the next table. Leave the surplus where it is, please.”']],
 foodLoss:[['没收','侍者夹走一张食材，托盘里的夹子夹得太紧，牌上留下了五个指印。'],['Confiscation','The server takes a food card. The tongs grip it too tightly. Five fingerprints remain on the paper.']],
 toolLoss:[['收走工具','“这件该还了。”荷官收起工具。您指着自己的购买收据，他把收据也收了。'],['Tool collected','“This one is due back.” The dealer pockets your tool. You point to the receipt. He takes that too.']],
};
export function routeFragment(id,lang='zh'){return (scenes[id]||scenes.mystery)[lang==='en'?1:0];}
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function routeStoryHTML(s,lang='zh'){
 const last=s.routeHistory?.at(-1);if(!last||last.round!==s.round)return '';
 const id=last.outcome||last.id;
 const repeat=s.routeHistory.filter(r=>(r.outcome||r.id)===id).length>1;
 const [title,line]=routeFragment(id,lang);
 return `<section class="route-vignette event-settlement" aria-label="${lang==='en'?'Event recap':'事件结算'}">${sceneArt(id,lang,{illustrated:true})}<details class="route-story" ${repeat?'':'open'}><summary>${escape(title)}</summary><p>${escape(line).replaceAll('\n','<br>')}</p></details></section>`;
}
