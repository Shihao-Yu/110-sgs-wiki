#!/usr/bin/env python3
"""把若干张卡的指定区域裁出来竖排拼成一张图，供人工/视觉识别。

用法：
    python3 scripts/qlhd/crop-corners.py --region emblem --out /tmp/strip.jpg FILE...
    python3 scripts/qlhd/crop-corners.py --region footer --out /tmp/strip.jpg FILE...

emblem: 左上角势力徽记 + 体力阴阳鱼（判定双势力用）
footer: 底部署名条（判定标记牌归属用，如「全琮技能卡」）
"""
import argparse
from pathlib import Path

from PIL import Image

REGIONS = {
    "emblem": (0.0, 0.0, 0.46, 0.115),
    "footer": (0.0, 0.92, 1.0, 1.0),
}
WIDTH = 820
GAP = 8


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--region", choices=sorted(REGIONS), default="emblem")
    ap.add_argument("--out", required=True)
    ap.add_argument("files", nargs="+")
    args = ap.parse_args()

    l, t, r, b = REGIONS[args.region]
    crops = []
    for f in args.files:
        with Image.open(f) as im:
            im = im.convert("RGB")
            w, h = im.size
            c = im.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
        cw, ch = c.size
        crops.append(c.resize((WIDTH, max(1, int(ch * WIDTH / cw))), Image.LANCZOS))
        print(f"{Path(f).name}")

    total_h = sum(c.size[1] for c in crops) + GAP * (len(crops) - 1)
    out = Image.new("RGB", (WIDTH, total_h), (255, 255, 255))
    y = 0
    for c in crops:
        out.paste(c, (0, y))
        y += c.size[1] + GAP
    out.save(args.out, "JPEG", quality=92)
    print(f"-> {args.out} {out.size}")


if __name__ == "__main__":
    main()
