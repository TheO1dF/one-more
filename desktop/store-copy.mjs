import {writeFile,mkdir} from 'node:fs/promises';
const out=new URL('../releases/steam-kit-v0.12.0/',import.meta.url);await mkdir(out,{recursive:true});
const zh=`# One More?

## 简短介绍
再翻一张，还是收摊？在这款冒险翻牌的肉鸽构筑游戏中，配对食材、组合工具、抵押物与附魔，攒够分数通过十桌牌局。炸弹一直藏在牌堆里——翻到它，这局就结束。够分了，你还舍得停手吗？

## 关于这款游戏
你输掉了最后一枚筹码。一位戴礼帽、微笑面具的荷官，邀请你再坐一局。

**每张牌都留在桌上。** 同样的食材可以配对，工具能查看顶牌、清理麻烦、复制食材，或把一桌散牌重新接成一套组合。80种卡牌，一句话的效果，越玩越多的用法。

**随时收摊，或者 One More?** 分数存下后会带到下一桌；早期敢贪，后期就多一份余地。但炸弹不能删除，翻开立即结束本局。知道下一张是什么，只是计划的开始。

**每次换桌，都有得选。** 掷d20增加目标，选择岔路与食材附魔，再带走一组夹着麻烦的新牌。抵押物持续改变构筑，油炸、水煮、生腌让同一张食材有不同用途。

**下一局，换一种打法。** 解锁卡牌与抵押物、四款卡背、旧版卡图、四档难度和三种特殊挑战。更高进阶会把第三颗骰子摆上桌。没有永久加点，留下的是新选择和你的经验。

支持中文与英文、鼠标操作、离线存档、窗口与全屏，以及30／60／120动画帧率设置。

## 免费先行测试
计划通过 Steam Playtest 开放免费测试。当前内容仍会调整；Steam 测试申请入口将在开发者账号、AppID及审核完成后开放。
`;
const en=`# One More?

## Short description
One more card, or cash out? Pair food, combine tools and pledged items, and build a deck that can survive ten tables. Your bank carries over. The bomb stays in the deck. Draw it, and the run is over.

## About this game
Your last chip is gone. A dealer in a top hat and a smiling mask offers you another seat.

**Every card stays on the table.** Match food into pairs. Use tools to peek, clear trouble, copy ingredients, and turn scattered cards into a working combination. 80 cards with short effects and plenty of room to experiment.

**Cash out whenever you dare.** Banked points carry into the next table, so an early gamble can buy breathing room later. But the bomb cannot be removed. Reveal it, and the run ends immediately.

**Build between tables.** Roll a d20 to raise the target. Choose a route, cook permanent enchantments into your food, and take a package with useful cards and unwanted trouble. Twenty pledged items open up more ways to play.

**Come back with a different plan.** Unlock more cards, pledged items, four card backs, original artwork, four stakes levels and three special challenges. Higher stakes bring a third die to the table. Progress adds choices, not permanent stat bonuses.

English and Simplified Chinese. Mouse controls. Offline saves. Windowed and fullscreen play. 30 / 60 / 120 animation FPS options.

## Free playtest
A free Steam Playtest is planned. Features and balance are still in development. Playtest access will open after Steamworks setup and review.
`;
await writeFile(new URL('store-description-zh.md',out),zh);await writeFile(new URL('store-description-en.md',out),en);
for(const [lang,text] of [['zh',zh],['en',en]])await writeFile(new URL('store-description-'+lang+'.bbcode.txt',out),text.replace(/^# .+\n/m,'').replace(/^## (.+)$/gm,'[h2]$1[/h2]').replace(/\*\*(.+?)\*\*/g,'[b]$1[/b]'));
await writeFile(new URL('steam-setup.md',out),`# Steam 发布交接

状态：本地商店素材及 Windows 测试构建。尚未创建或发布 Steam 页面。

用户已办理 Steamworks，税务资料正在审核（2026-09-20 用户反馈）；尚未提供本游戏 AppID。审核完成后继续应用创建与后台要求；取得主游戏 AppID 后创建关联 Playtest AppID。Playtest 是免费测试，不是付费 Early Access；测试报名显示在主游戏商店页。

1. 填入真实的开发者/发行商名称，不预设法律主体、发售日期或正式版价格。
2. 将两份 description 文本分别填入对应语言；短介绍单独复制。
3. 上传 header / small / main / vertical capsule PNG，至少5张真实1920×1080截图，以及 gameplay-trailer.mp4。源码SVG用于后续修改，不作为截图提交。
4. 库素材与商店素材分别上传。主页的风格通过胶囊、游戏截图和 section 图片表达；Steam 不支持上传自定义HTML/CSS替换整个页面。store-preview.html仅为本地内容预览。
5. 建立 Windows Playtest depot，上传 portable 文件夹的全部内容，启动文件填 OneMore.exe。
6. 在 Steam 客户端测试安装、启动、卸载和测试资格，再送审。当前没有 Steam 成就、Steam Cloud、手柄支持或 Steam Deck 验证，不勾选这些功能。
7. 系统需求暂不发布虚构最低硬件指标。当前仅验证 Windows x64 本机；正式填写需在目标最低配置机验证。
8. 内容调查及素材来源按实际情况填写；不把营销页省略制作工具视为对平台申报的替代。

官方参考：
- https://partner.steamgames.com/doc/features/playtest
- https://partner.steamgames.com/doc/store/assets/standard
- https://partner.steamgames.com/doc/store/assets/libraryassets

截图和录像使用固定种子的真实规则演示；不是通关概率或典型得分统计。测试存档与正式玩家存档隔离，不打入发布目录。
`);
const body=`<section class=hero><img src="header-capsule.png" alt="One More?"/><p class=eyebrow>免费先行测试 · STEAM PLAYTEST</p><h1>够分了。<br>还要再来一张？</h1><p>分数可以留下。炸弹不能拿走。</p></section><section><video controls poster="screenshot-1.png" src="gameplay-trailer.mp4"></video><p class=note>本地商店内容预览 · 尚未在 Steam 发布</p></section><section class=gallery>${[1,2,3,4,5].map(i=>`<img src="screenshot-${i}.png" alt="实际游玩截图 ${i}" loading=lazy/>`).join('')}</section><section><img class=section-banner src="section-pairs.png"/><p>每张牌都留在桌上。相同食材配对、工具清理麻烦、复制和消耗串成组合。80种卡牌，效果简短，打法由你来拼。</p><img class=section-banner src="section-stakes.png"/><p>前期多攒的分数能带到后期。每次换桌掷骰加码，再选路线与新牌；每份好处都可能夹着麻烦。</p><img class=section-banner src="section-unlocks.png"/><p>20件抵押物、食材附魔、4档难度、3种挑战，以及可解锁的卡池、卡背和旧版卡图。重来时多的是选择，不是永久属性。</p></section><section class=details><div><h2>测试内容</h2><p>单人 · 鼠标操作<br>简体中文 / English<br>Windows x64 · 离线存档</p></div><div><h2>One More?</h2><p>免费 Steam Playtest 筹备中。<br>Steamworks 税务审核中，完成应用设置与审核后开放报名。</p></div></section>`;
await writeFile(new URL('store-preview.html',out),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>One More? · Steam 内容预览</title><style>*{box-sizing:border-box}body{margin:0;background:#161936;color:#fff8e8;font:18px/1.8 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1120px;margin:auto;padding:32px}section{margin-bottom:44px}.hero{position:relative;padding:45px;background:#339563;border-radius:28px}.hero>img{float:right;width:52%;margin:20px -15px 20px 25px}.hero h1{font-size:clamp(32px,4vw,56px);line-height:1.25}.hero p:last-child{color:#fff8e8}.eyebrow{letter-spacing:2px;color:#edbd38;font-weight:bold;font-size:14px}video{width:100%;background:#000}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.gallery img{width:100%;border-radius:10px}.gallery img:first-child{grid-column:span 2}.section-banner{width:100%;margin-top:22px}.note{color:#81b8ba;font-size:14px}.details{display:flex;justify-content:space-between;border-top:3px solid #574798;padding-top:20px}@media(max-width:650px){main{padding:16px}.hero{padding:24px}.hero>img{float:none;width:100%;margin:0}.details{display:block}}</style><main>${body}</main></html>`);
console.log('Store copy and local preview ready');
