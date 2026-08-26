#!/usr/bin/env python3
"""给 pack-cards.json 里的游戏牌补上 ownerGeneralId。

判定方法：武将专属牌会在该武将的技能文本里以【牌名】出现（如诸葛果的
「祈禳」列出【遁甲天书】【锦囊袋】【七星宝刀】【袖箭】【孔明灯】）。
群狼环鼎自身没有技能文本，故证据取自已移除的国战包 OCR（card-text.json），
再按同名同位 id 映射到新包。六名相关武将在新包中均存在且姓名一致。

两个必须人工判读、不能只靠命中就写入的例子：
  - 七星宝刀：OCR 文本把它断行成「七星宝\n刀」，字符串搜索会漏，需先归一化空白。
  - 调虎离山：文聘与吴景的技能都提到它，且原文是「将一张牌当【调虎离山】使用」
    ——这是把别的牌转化成它，属通用锦囊，不是专属。故不写入归属。

用法：python3 scripts/qlhd/link-pack-cards.py [--dry-run]
"""
import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "packages" / "data" / "src"
DRY = "--dry-run" in sys.argv

OWNERS = {
    # 诸葛果「祈禳」：从这五件宝物里选一件装备
    "遁甲天书": "general_qlhd_shu_061",
    "锦囊袋":   "general_qlhd_shu_061",
    "七星宝刀": "general_qlhd_shu_061",
    "袖箭":     "general_qlhd_shu_061",
    "孔明灯":   "general_qlhd_shu_061",
    # 葛玄「丹法」：选一件游戏外法宝装备
    "灵宝仙葫": "general_qlhd_wu_059",
    "太极拂尘": "general_qlhd_wu_059",
    "冲应神符": "general_qlhd_wu_059",
    # 蒲元「铸刃」：【天雷刃】须弃置【闪电】获得
    "天雷刃":   "general_qlhd_shu_059",
    # 刘协「帝召」：视为使用一张【敕令】
    "敕令":     "general_qlhd_qun_040",
    # 刘晔「破垣」：将【霹雳车】置入装备区
    "霹雳车":   "general_qlhd_wei_062",
}

generals = json.loads((DATA / "generals.json").read_text(encoding="utf-8"))
cards = json.loads((DATA / "pack-cards.json").read_text(encoding="utf-8"))
gid_map = {g["id"]: g for g in generals}

for name, gid in OWNERS.items():
    if gid not in gid_map:
        sys.exit(f"FATAL: {name} 的归属 {gid} 不存在于 generals.json")

applied = 0
for c in cards:
    gid = OWNERS.get(c["name"])
    if gid and c.get("ownerGeneralId") != gid:
        c["ownerGeneralId"] = gid
        applied += 1

owned = [c for c in cards if c.get("ownerGeneralId")]
free = [c["name"] for c in cards if not c.get("ownerGeneralId")]
print(f"pack-cards {len(cards)} 张：写入归属 {applied} 处，共 {len(owned)} 张有主")
print(f"  通用牌 {len(free)} 张: {'、'.join(free)}")
from collections import Counter
for gid, n in Counter(c["ownerGeneralId"] for c in owned).items():
    print(f"  {gid_map[gid]['name']}《{gid_map[gid]['title']}》 <- {n} 张")

if not DRY:
    (DATA / "pack-cards.json").write_text(
        json.dumps(cards, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("已写入 pack-cards.json")
else:
    print("DRY RUN，未写入")
