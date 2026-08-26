#!/usr/bin/env python3
"""
回到「只保留群狼环鼎」的形态，并补齐标记牌/大攻车的武将归属。

背景：两版共存是中途的方案，用户后来确认只要新包。本脚本做两件事：
  1. generals.json 736 -> 395，只留 general_qlhd_* 前缀的新包武将
  2. tokens.json 补上 25 条此前留空的 ownerGeneralId

关于 ownerGeneralId 的取值依据（写在这里以免日后无从追溯）：
  - 大攻车 14 张（技能卡 + 图纸 + 12 个零件）-> 张奋 general_qlhd_wu_055
    张奋称号《御驰大攻》，大攻车是他的专属模块。
  - 5 张签 -> 周群 general_qlhd_shu_056
    卡面本身无署名条（当初据此留空），但【命运签】已确认是周群技能卡，
    上上/上/中/下/下下签是该技能抽出的结果，游戏逻辑上属于周群。
  - 休整、十常侍背面 -> 十常侍 general_qlhd_qun_000
    两者在素材中都位于「十常侍/」目录下。
  - 4 张君主牌 -> 对应武将的新包 id。
  - 福利卡仍留空：卡面署名条只写「福利卡」，效果面向「第一个死亡的角色」，
    与具体武将无关，这是解图后的结论，不是漏填。

用法：python3 scripts/qlhd/drop-guozhan.py [--dry-run]
"""
import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA = ROOT / "packages" / "data" / "src"
QP = "general_qlhd_"
DRY = "--dry-run" in sys.argv

ZHANG_FEN = "general_qlhd_wu_055"      # 张奋 · 御驰大攻
ZHOU_QUN  = "general_qlhd_shu_056"     # 周群 · 瞻天瞩世
EUNUCHS   = "general_qlhd_qun_000"     # 十常侍 · 祸乱纲常

SIEGE_PARTS = ["云纹", "兔口", "冲阵", "奇阵", "战鼓", "拒马",
               "族旗", "混元", "玉符", "王伦车", "精钢", "输石"]

NEW_OWNERS = {
    **{n: ZHANG_FEN for n in ["大攻车技能", "大攻车图纸", *SIEGE_PARTS]},
    **{n: ZHOU_QUN for n in ["上上签", "上签", "中签", "下签", "下下签"]},
    "休整": EUNUCHS,
    "十常侍背面": EUNUCHS,
    "刘备（君主）": "general_qlhd_shu_001",
    "张角（君主）": "general_qlhd_qun_010",
    "孙权（君主）": "general_qlhd_wu_001",
    "曹操（君主）": "general_qlhd_wei_001",
}


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def save(name, obj):
    if DRY:
        return
    (DATA / name).write_text(
        json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


generals = load("generals.json")
tokens = load("tokens.json")

kept = [g for g in generals if g["id"].startswith(QP)]
dropped = len(generals) - len(kept)
kept_ids = {g["id"] for g in kept}
print(f"generals: {len(generals)} -> {len(kept)}  (删除旧包 {dropped} 名)")

# 归属必须落在保留下来的武将上，否则就是造了个悬空引用
for name, gid in NEW_OWNERS.items():
    if gid not in kept_ids:
        sys.exit(f"FATAL: {name} 的归属 {gid} 不在保留集合中")

applied, already, missing = 0, 0, []
by_name = {t["name"]: t for t in tokens}
for name, gid in NEW_OWNERS.items():
    t = by_name.get(name)
    if t is None:
        missing.append(name)
        continue
    if t.get("ownerGeneralId"):
        already += 1
        continue
    t["ownerGeneralId"] = gid
    applied += 1
if missing:
    sys.exit(f"FATAL: tokens.json 里找不到这些牌: {missing}")

# 原有的归属指向的是保留下来的武将吗
dangling = [t["name"] for t in tokens
            if t.get("ownerGeneralId") and t["ownerGeneralId"] not in kept_ids]
if dangling:
    sys.exit(f"FATAL: 这些牌的既有归属指向已删除的武将: {dangling}")

orphan = [t["name"] for t in tokens if not t.get("ownerGeneralId")]
print(f"tokens: 新补 {applied} 条归属，原已有 {already} 条")
print(f"        仍无归属 {len(orphan)} 条: {orphan}")

# parentGeneralId 不能悬空
bad_parent = [g["id"] for g in kept
              if g.get("parentGeneralId") and g["parentGeneralId"] not in kept_ids]
if bad_parent:
    sys.exit(f"FATAL: parentGeneralId 悬空: {bad_parent}")

save("generals.json", kept)
save("tokens.json", tokens)
print("DRY RUN，未写入" if DRY else "已写入 generals.json / tokens.json")
