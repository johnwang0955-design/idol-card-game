# 星光偶像卡牌舞台

節奏搭配 Live 遊戲：選偶像、以分層立繪混搭 32 張服裝卡，再上台打音符。

## 操作

- 鍵盤：`D` `F` `J` `K` 對應四條軌道
- 手機：直接點擊／觸碰對應軌道

## 遊玩

2D 正式版：https://johnwang0955-design.github.io/idol-card-game/

3D 測試版：https://johnwang0955-design.github.io/idol-card-game/3d/

## 3D 版
- `js3d/`：Stage3D（共用一個 WebGL renderer）＝搭配頁 360° 展示台、換裝走秀（光之門 → 上衣/下身/鞋子/配件逐件換）、3D Live 舞台（伴舞、觀眾螢光棒、機台運鏡）。
- `js3d/idol.js`：3 位偶像由同一個授權樣本 VRM 改造（髮色/眼色/臉部/髮型）。
- `js3d/garments.js`：32 件服裝全部是程式生成的獨立 mesh（貼身衣物=蒙皮在共用骨架上的偏移殼；裙子=生成的蒙皮裙；鞋跟/鞋底/飾品=綁在骨頭上的剛體），可自由混搭。
- 不支援 WebGL 或加 `?no3d` 時自動回到 2D 立繪。`?nodress` 跳過走秀。
- 測試頁：`dev3d.html?idols=rinne,haruka,ria&outfit=mid_top_a,mid_bot_a,mid_shoe_a,mid_acc_a`
