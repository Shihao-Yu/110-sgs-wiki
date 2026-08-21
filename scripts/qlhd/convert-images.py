#!/usr/bin/env python3
"""把群狼环鼎素材批量转成 WebP 写入 assets/。

原图 1098x1542 PNG 均 2.7MB；q85 不降分辨率后均约 220KB（约 12x）。
用法：
    python3 scripts/qlhd/convert-images.py [--src DIR] [--dry-run]
"""
import argparse
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

from PIL import Image

# 素材目录 -> assets 下的目标子目录
ROUTING = {
    "魏": "generals", "蜀": "generals", "吴": "generals",
    "群": "generals", "双势力": "generals", "十常侍": "generals",
    "标记牌": "tokens", "大攻车": "tokens",
    "游戏牌": "cards",
}

QUALITY = 85
METHOD = 6


def convert_one(job):
    src, dst = job
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im.convert("RGB").save(dst, "WEBP", quality=QUALITY, method=METHOD)
    return src.stat().st_size, dst.stat().st_size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(Path.home() / "qlhd-src" / "c国战 - Copy"))
    ap.add_argument("--out", default="assets")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    src_root = Path(args.src)
    out_root = Path(args.out)
    if not src_root.is_dir():
        sys.exit(f"素材目录不存在: {src_root}")

    jobs, per_dir = [], {}
    for folder, target in ROUTING.items():
        d = src_root / folder
        if not d.is_dir():
            sys.exit(f"缺少素材子目录: {d}")
        files = sorted(p for p in d.iterdir() if p.is_file())
        per_dir[folder] = len(files)
        for p in files:
            jobs.append((p, out_root / target / (p.stem + ".webp")))

    print(f"待转换 {len(jobs)} 个文件:")
    for k, v in per_dir.items():
        print(f"  {k:6s} {v:3d} -> assets/{ROUTING[k]}")
    if args.dry_run:
        return

    total_in = total_out = 0
    with ProcessPoolExecutor(max_workers=os.cpu_count()) as ex:
        for i, (a, b) in enumerate(ex.map(convert_one, jobs), 1):
            total_in += a
            total_out += b
            if i % 50 == 0:
                print(f"  ...{i}/{len(jobs)}")

    mb = 1024 * 1024
    print(f"完成 {len(jobs)} 个文件: {total_in/mb:.0f} MB -> {total_out/mb:.0f} MB "
          f"（{total_in/max(total_out,1):.1f}x）")


if __name__ == "__main__":
    main()
