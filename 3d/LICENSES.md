# Third-party assets & licenses

## 3D model
- File: `assets/VRM1_Constraint_Twist_Sample.vrm` (VRM 1.0, ~36k triangles, 10.8 MB)
- Source URL: https://raw.githubusercontent.com/pixiv/three-vrm/dev/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm
  (same model is also in https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample)
- License: **VRM Public License 1.0** — https://vrm.dev/licenses/1.0/ — (c) 2022 pixiv Inc.
- Embedded VRM meta (from the file): avatarPermission=everyone, commercialUsage=corporation,
  allowRedistribution=true, modification=allowModificationRedistribution, creditNotation=unnecessary,
  allowAntisocialOrHateUsage=false.
- Game copy (`idol3d-game/assets3d/base.vrm`): MODIFIED derivative (normal maps / thumbnail / hidden clothing textures replaced, body texture downscaled). Modification + redistribution + corporate commercial use are allowed by the embedded meta above; credit not required (we credit anyway: (c) 2022 pixiv Inc.).
- At runtime the 3 idols (凜音/晴夏/莉亞) are restyled from this base in code: hair/eye recolour, face paint (mole/freckles), hair reshaping (waves / shortened back + procedural ponytail), hair clips. Every garment (32 items) is generated in code — no third-party clothing assets.
  It is not CC0. CC0 options from pixiv: β Ver AvatarSample_1–4, HairSample_Male/Female
  (https://vroid.pixiv.help/hc/en-us/articles/4402614652569), downloadable from VRoid Hub (needs a login).

## Motion
- No third-party motion data. Walk / spin / dance are procedural (code in `main.js`).
- `assets/test.vrma` (from the three-vrm repo, MIT) was downloaded for testing but is not used.

## Libraries (vendored in `vendor/`)
- three.js r170 — MIT — https://github.com/mrdoob/three.js
- @pixiv/three-vrm 3.5.5 — MIT — https://github.com/pixiv/three-vrm

## Everything else
Stage, runway, mirror gate, audience, penlights, sparkles, skirts and tiaras: made in code, original.
"Starlight" logo placeholder: original text.
