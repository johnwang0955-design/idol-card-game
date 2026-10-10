# 星光偶像卡牌舞台

節奏搭配 Live 遊戲：選偶像、以分層立繪混搭 32 張服裝卡，再上台打音符。

## 操作

- 鍵盤：`D` `F` `J` `K` 對應四條軌道
- 手機：直接點擊／觸碰對應軌道

## 遊玩

https://johnwang0955-design.github.io/idol-card-game/

## 3D 版（本機副本，未推送）
- `js3d/`：Stage3D（共用一個 WebGL renderer）＝搭配頁 360° 展示台、換裝走秀（光之門 → 上衣/下身/鞋子/配件逐件換）、3D Live 舞台（伴舞、觀眾螢光棒、機台運鏡）。
- `js3d/idol.js`：3 位偶像由同一個授權樣本 VRM 改造（髮色/眼色/臉部/髮型）。
- `js3d/garments.js`：32 件服裝全部是程式生成的獨立 mesh（貼身衣物=蒙皮在共用骨架上的偏移殼；裙子=生成的蒙皮裙；鞋跟/鞋底/飾品=綁在骨頭上的剛體），可自由混搭。
- 不支援 WebGL 或加 `?no3d` 時自動回到 2D 立繪。`?nodress` 跳過走秀。
- 測試頁：`dev3d.html?idols=rinne,haruka,ria&outfit=mid_top_a,mid_bot_a,mid_shoe_a,mid_acc_a`

## 2.5D 版（/workspace/idol25d-game，本機原型，未推送）
- 主偶像 = 已核可的分層立繪，做成 2D 蒙皮「紙偶」看板（`js25d/sprite.js`）：每一層（後髮、身體、服裝、頭、耳環）都是獨立的 SkinnedMesh，共用一副 2D 骨架（腰、胸、頭、左右上臂/前臂/手、後髮擺動）。手臂依逐像素歸屬遮罩（`js25d/own_arm.png`，由 `idol25d-work/rig.py` 產生）切成「手臂/身體」兩片，所以任何混搭在每個舞姿都成立。
- 舞姿（`js25d/motion2d.js`）：idle(原畫)、sway、cheer、point、wave、heart、lean、final；每 2 拍換一個姿勢（約 0.45 拍緩動）＋每拍彈跳／擺動／壓縮＋髮尾延遲擺動＋光暈。
- 鏡頭左右掃最多約 ±65°，立繪會轉向鏡頭（85% 偏航＋少量俯仰），所以不會看到側邊。伴舞 = 另外兩位偶像的立繪，調暗並偏紫，穿和主角不同的品牌。
- 走秀：正面 3/4 視角穿過光之門 → 每件換裝都用 scale-x 翻轉旋轉＋閃光，翻到側面那一刻換上該件。
- 開發頁：`pose_test.html?rows=ria:ros_top_a,ros_bot_a,ros_shoe_a,ros_acc_a&poses=idle,cheer,point`
