# 群狼环鼎武将包替换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 `c国战 - Copy.zip` 里的 482 张新素材整体替换站点现有的国战武将库，包名「群狼环鼎」，并把标记牌 / 游戏牌 / 大攻车 / 十常侍四类特殊牌收录进来且关联到武将。

**Architecture:** 素材解压到 WSL 本地盘 → Python + Pillow 批量转 WebP 写入 `assets/` → TypeScript 脚本解析文件名生成 `generals.json` / `tokens.json` / `cards.json` → `seed-redis --replace` 清空旧键后灌入 Redis。页面读 Redis，全站搜索读构建期 JSON，两侧都要更新。

**Tech Stack:** pnpm monorepo、Next.js 15 App Router、TypeScript、vitest、Upstash Redis、Pillow 12.1.1、tsx

**Spec:** `docs/superpowers/specs/2026-08-21-qunlang-huanding-design.md`

## Global Constraints

- 包名字符串固定为 `群狼环鼎`（写入每条 `General.pack`）
- 势力代号只允许 `WEI` / `SHU` / `WU` / `QUN`；`JIN` 保留类型定义但本包无数据
- WebP 编码参数固定 `quality=85, method=6`，**不改变原始分辨率**（1098×1542）
- 图片文件名保留中文原名，只把扩展名换成 `.webp`
- `git add` **必须显式列路径**，绝不用 `git add -A` —— 工作区有 25 个未跟踪的调试截图（`caocao-page.png`、`niujin.png` 等）不能卷进提交
- 所有工作在分支 `feat/qunlang-huanding` 上进行，不直接提交 `main`
- 素材解压目录 `~/qlhd-src/`（WSL 原生 ext4）。**不要解压到 `/mnt/c/`** —— 1.2 GB 在 9p 挂载上读写会慢一个数量级

---

### Task 1: 建分支、解压素材、写文件名解析器

**Files:**
- Create: `scripts/qlhd/parse-filename.ts`
- Create: `scripts/qlhd/parse-filename.test.ts`

**Interfaces:**
- Consumes: 无（首个任务）
- Produces:
  - `export type ParsedCard = { faction: 'WEI'|'SHU'|'WU'|'QUN'|'AM'; subfaction?: 'WEI'|'SHU'|'WU'|'QUN'; cardNo: string; title: string; name: string }`
  - `export function parseCardFilename(basename: string): ParsedCard | null`
  - `export const FILENAME_FIXES: Record<string, string>`

- [ ] **Step 1: 建分支并解压素材**

```bash
cd /mnt/c/Users/SY/Workspace/110-sgs-wiki
git checkout -b feat/qunlang-huanding
mkdir -p ~/qlhd-src
unzip -q "/mnt/c/Users/SY/Downloads/c国战 - Copy.zip" -d ~/qlhd-src
ls ~/qlhd-src/"c国战 - Copy"
```

预期：列出 9 个目录 —— `十常侍 双势力 吴 大攻车 标记牌 游戏牌 群 蜀 魏`

- [ ] **Step 2: 核对解压结果与 spec 的清单一致**

```bash
cd ~/qlhd-src/"c国战 - Copy"
for d in 群 魏 吴 蜀 双势力 标记牌 游戏牌 大攻车 十常侍; do
  printf "%-8s %3d\n" "$d" "$(find "$d" -type f | wc -l)"
done
find . -type f | wc -l
```

预期精确输出：`群 97 / 魏 93 / 吴 90 / 蜀 89 / 双势力 16 / 标记牌 48 / 游戏牌 21 / 大攻车 15 / 十常侍 13`，合计 `482`。对不上就停下来排查，不要继续。

- [ ] **Step 3: 写失败的解析器测试**

Create `scripts/qlhd/parse-filename.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { parseCardFilename } from './parse-filename.js';

describe('parseCardFilename', () => {
  it('解析标准单势力卡', () => {
    expect(parseCardFilename('国战UI.WEI125.惟几成务.司马师.png')).toEqual({
      faction: 'WEI', cardNo: '125', title: '惟几成务', name: '司马师',
    });
  });

  it('解析双势力卡，& 前后分别是主副势力', () => {
    expect(parseCardFilename('国战UI.WEI&WU072.绘船制图.唐咨.png')).toEqual({
      faction: 'WEI', subfaction: 'WU', cardNo: '072', title: '绘船制图', name: '唐咨',
    });
  });

  it('姓名里的 & 不被误判为副势力分隔符', () => {
    expect(parseCardFilename('国战UI.SHU071.逐驾迎尘.糜芳&傅士仁.png')).toEqual({
      faction: 'SHU', cardNo: '071', title: '逐驾迎尘', name: '糜芳&傅士仁',
    });
  });

  it('吃掉可选的 G. 前缀', () => {
    expect(parseCardFilename('国战UI.G.SHU091.狷狭激愤.杨仪.png')).toEqual({
      faction: 'SHU', cardNo: '091', title: '狷狭激愤', name: '杨仪',
    });
  });

  it('接受带字母后缀的卡号', () => {
    expect(parseCardFilename('国战UI.SHU085A.凌然奋战.傅肜.png')).toEqual({
      faction: 'SHU', cardNo: '085A', title: '凌然奋战', name: '傅肜',
    });
  });

  it('接受四位卡号', () => {
    expect(parseCardFilename('国战UI.QUN1000.湖海散人.罗贯中.png')).toEqual({
      faction: 'QUN', cardNo: '1000', title: '湖海散人', name: '罗贯中',
    });
  });

  it('接受 XXX 无卡号', () => {
    expect(parseCardFilename('国战UI.WEIXXX.趁浪逐波.魏讽.png')).toEqual({
      faction: 'WEI', cardNo: 'XXX', title: '趁浪逐波', name: '魏讽',
    });
  });

  it('修正 WEl 小写 L 拼写错误', () => {
    expect(parseCardFilename('国战UI.WEl174.清介有守.国渊.png')).toEqual({
      faction: 'WEI', cardNo: '174', title: '清介有守', name: '国渊',
    });
  });

  it('十常侍子卡称号为空', () => {
    expect(parseCardFilename('国战UI.QUNXXX..夏恽.png')).toEqual({
      faction: 'QUN', cardNo: 'XXX', title: '', name: '夏恽',
    });
  });

  it('AM 野心家卡', () => {
    expect(parseCardFilename('国战UI.AM001.堕节肇业.司马昭.png')).toEqual({
      faction: 'AM', cardNo: '001', title: '堕节肇业', name: '司马昭',
    });
  });

  it('非武将卡文件名返回 null', () => {
    expect(parseCardFilename('休整.png')).toBeNull();
    expect(parseCardFilename('ab539b47-7fa1-4918-af21-6114c3aa9067.png')).toBeNull();
  });
});
```

- [ ] **Step 4: 运行测试确认失败**

Run: `cd /mnt/c/Users/SY/Workspace/110-sgs-wiki && pnpm vitest run scripts/qlhd/parse-filename.test.ts`
Expected: FAIL —— `Failed to resolve import "./parse-filename.js"`

注意：根 `vitest.config.ts` 的 `include` 目前是 `packages/*/src/**/*.test.{ts,tsx}`，不覆盖 `scripts/`。本步骤直接把测试文件路径传给 `vitest run` 可绕过 include。**Step 6 会把 `scripts/` 加进 include。**

- [ ] **Step 5: 实现解析器**

Create `scripts/qlhd/parse-filename.ts`：

```ts
export type CardFaction = 'WEI' | 'SHU' | 'WU' | 'QUN' | 'AM';
export type SubFaction = 'WEI' | 'SHU' | 'WU' | 'QUN';

export type ParsedCard = {
  faction: CardFaction;
  subfaction?: SubFaction;
  cardNo: string;
  title: string;
  name: string;
};

/** 素材里已知的文件名拼写错误 → 正确写法。 */
export const FILENAME_FIXES: Record<string, string> = {
  // 小写 L 冒充大写 I
  '国战UI.WEl174.清介有守.国渊.png': '国战UI.WEI174.清介有守.国渊.png',
};

const PATTERN =
  /^国战UI\.(?:G\.)?([A-Za-z]+?)(?:&([A-Za-z]+))?(\d{3,4}[A-Z]?|XXX)\.(.*?)\.([^.]+)\.png$/;

const VALID_FACTIONS = new Set<string>(['WEI', 'SHU', 'WU', 'QUN', 'AM']);

export function parseCardFilename(basename: string): ParsedCard | null {
  const fixed = FILENAME_FIXES[basename] ?? basename;
  const m = PATTERN.exec(fixed);
  if (!m) return null;

  const [, rawFaction, rawSub, cardNo, title, name] = m;
  const faction = rawFaction.toUpperCase();
  if (!VALID_FACTIONS.has(faction)) return null;

  const parsed: ParsedCard = {
    faction: faction as CardFaction,
    cardNo,
    title,
    name,
  };
  if (rawSub) {
    const sub = rawSub.toUpperCase();
    if (!VALID_FACTIONS.has(sub) || sub === 'AM') return null;
    parsed.subfaction = sub as SubFaction;
  }
  return parsed;
}
```

`FILENAME_FIXES` 之所以能修掉 `WEl`：正则的 `[A-Za-z]+?` 本来就会匹配到 `WEl`，`toUpperCase()` 得到 `WEL`，不在 `VALID_FACTIONS` 里会被拒。修正表在正则之前先把文件名换掉，避免在正则里塞特例。

- [ ] **Step 6: 把 scripts/ 纳入 vitest include**

Modify `vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/*/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
    ],
    passWithNoTests: true,
  },
});
```

- [ ] **Step 7: 运行测试确认通过**

Run: `pnpm vitest run scripts/qlhd/parse-filename.test.ts`
Expected: PASS，11 个测试全绿

- [ ] **Step 8: 用解析器扫描真实素材，确认覆盖率**

```bash
cd /mnt/c/Users/SY/Workspace/110-sgs-wiki
pnpm tsx -e "
import { readdirSync } from 'node:fs';
import { parseCardFilename } from './scripts/qlhd/parse-filename.ts';
const ROOT = process.env.HOME + '/qlhd-src/c国战 - Copy';
let ok = 0; const bad: string[] = [];
for (const d of ['魏','蜀','吴','群','双势力','十常侍']) {
  for (const f of readdirSync(\`\${ROOT}/\${d}\`)) {
    if (parseCardFilename(f)) ok++; else bad.push(\`[\${d}] \${f}\`);
  }
}
console.log('解析成功', ok, '失败', bad.length);
bad.forEach(b => console.log('  ✗', b));
"
```

预期：`解析成功 393 失败 5`，失败的正好是这 5 个（Task 4 处理）：
```
[十常侍] 休整.png
[十常侍] 休整背面.png
[十常侍] 十常侍背面.png
[群] ab539b47-7fa1-4918-af21-6114c3aa9067.png
```
外加 `游戏牌` / `标记牌` / `大攻车` 三个目录不参与本次扫描。

- [ ] **Step 9: 提交**

```bash
git add scripts/qlhd/parse-filename.ts scripts/qlhd/parse-filename.test.ts vitest.config.ts
git commit -m "feat(qlhd): card filename parser with edge-case coverage"
```

---

### Task 2: WebP 转换脚本

**Files:**
- Create: `scripts/qlhd/convert-images.py`

**Interfaces:**
- Consumes: `~/qlhd-src/c国战 - Copy/` 解压素材（Task 1 Step 1）
- Produces: `assets/generals/*.webp`、`assets/tokens/*.webp`、`assets/cards/*.webp`；脚本 stdout 打印每个目录的转换计数

- [ ] **Step 1: 写转换脚本**

Create `scripts/qlhd/convert-images.py`：

```python
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
```

**注意 `ROUTING` 里 `十常侍 -> generals`：** 该目录下 10 张子卡是武将卡，但同目录的 `休整.png` / `休整背面.png` / `十常侍背面.png` 是标记牌。三张的归位由 Task 6 的 `tokens.json` 按名字引用 `assets/generals/` 下的路径解决，不需要在转换阶段分流。

- [ ] **Step 2: 先跑 dry-run 校验路由**

Run: `python3 scripts/qlhd/convert-images.py --dry-run`
Expected: 打印 `待转换 482 个文件`，九个目录计数与 Task 1 Step 2 一致

- [ ] **Step 3: 先转换（不删任何东西）**

```bash
cd /mnt/c/Users/SY/Workspace/110-sgs-wiki
python3 scripts/qlhd/convert-images.py
```

**先转换、后删除。** 新图是 `.webp`，旧图是 `.png` / `.jpg`，扩展名不同，可以在同一目录
无冲突共存。这样万一转换中途失败，旧图原封不动，不存在「新的没成、旧的没了」的窗口。
（磁盘实测：C: 剩 321 GB，转换峰值只多占约 100 MB，空间不是问题。）

Expected: 末行形如 `完成 482 个文件: 1200 MB -> 约 100 MB（约 12.0x）`。24 核并行下约 1–3 分钟。

- [ ] **Step 3b: 验完新图数量，再删旧图**

只有下面三个计数全部吻合才执行删除：

```bash
cd /mnt/c/Users/SY/Workspace/110-sgs-wiki
G=$(find assets/generals -maxdepth 1 -name '*.webp' | wc -l)
T=$(find assets/tokens   -maxdepth 1 -name '*.webp' | wc -l)
C=$(find assets/cards    -maxdepth 1 -name '*.webp' | wc -l)
echo "generals=$G (需 398)  tokens=$T (需 61)  cards=$C (需 21)"
[ "$G" = 398 ] && [ "$T" = 61 ] && [ "$C" = 21 ] || { echo "数量不符，禁止删除，停下来排查"; exit 1; }

# 计数吻合，删除旧图。保留 emperors/（4 张君主牌 + 1 张背面，spec D8 要求留下）
find assets/generals -maxdepth 1 -type f ! -name '*.webp' -delete
rm -rf assets/generals/eunuchs
find assets/cards    -maxdepth 1 -type f ! -name '*.webp' -delete
find assets/tokens   -maxdepth 1 -type f ! -name '*.webp' ! -name 'desktop.ini' -delete
echo "旧图已删"
```

`assets/generals/eunuchs/` 删掉，是因为十常侍子卡这次以 `assets/generals/` 顶层 `.webp`
的形式重新生成了。`desktop.ini` 是 Windows 产物，留着无害。

- [ ] **Step 4: 删除后复核**

```bash
echo "emperors 保住了吗: $(ls assets/generals/emperors | wc -l)  (预期 5)"
echo "eunuchs 删掉了吗:  $(ls assets/generals/eunuchs 2>/dev/null | wc -l)  (预期 0，目录应已不存在)"
echo "残留非 webp:      $(find assets -type f ! -name '*.webp' ! -path '*/emperors/*' ! -name 'desktop.ini' | wc -l)  (预期 0)"
echo "webp 总数:        $(find assets -name '*.webp' | wc -l)  (预期 480)"
du -sh assets/
```

- **398** = 魏93 + 蜀89 + 吴90 + 群97 + 双势力16 + 十常侍13
- **61** = 标记牌48 + 大攻车15 − **2 个跨目录重名**（见下）
- **21** = 游戏牌
- 合计 398 + 61 + 21 = **480**（素材 482 个文件，其中 2 个是重复内容）

> **为什么 tokens 是 61 而不是 63：** `标记牌/` 和 `大攻车/` 各有一份
> `大攻车图纸.jpg` 与 `大攻车图纸背面.jpg`，两目录都路由到 `assets/tokens/`，
> 输出名不带来源目录前缀，因此各自合并成一个文件。已用 `md5sum` 核实两组
> 文件**字节完全相同**（同一张图在素材里被放进了两个文件夹），合并是无损的，
> 不需要加前缀去区分。全量 stem 冲突扫描确认这是九个目录里**唯一**的一处冲突，
> generals 398/398、cards 21/21 均无重名。

> ⚠️ 398 是 `assets/generals/` 下的**图片文件数**，不要和后面 `generals.json` 的
> **395 条数据**混淆：十常侍目录里的 `休整.png`、`休整背面.png`、`十常侍背面.png`
> 这 3 张是标记牌而非武将卡，图片放在 `generals/` 下（由 Task 6 的 `tokens.json`
> 引用），但不会生成武将条目。398 − 3 = 395。

- [ ] **Step 5: 提交**

```bash
git add scripts/qlhd/convert-images.py assets/
git commit -m "feat(qlhd): convert 482 pack images to WebP, replace old assets"
```

这一次提交会写入约 100 MB。`git add assets/` 是安全的 —— `assets/` 下不存在未跟踪的调试文件。

---

### Task 3: 数据类型层

**Files:**
- Create: `packages/data/src/types/token.ts`
- Modify: `packages/data/src/types/general.ts`
- Modify: `packages/data/src/types/card.ts`
- Modify: `packages/data/src/types/index.ts`

**Interfaces:**
- Consumes: 无
- Produces:
  - `export type TokenId = string & { readonly __brand: 'TokenId' }`
  - `export interface Token { id, name, image, backImage?, ownerGeneralId?, category, module? }`
  - `General` 新增 `isAmbitionist?: boolean`、`parentGeneralId?: GeneralId`
  - `Card` 新增 `image?: string`

> **执行期裁定（覆盖 spec §4.1）：不要加 `tokenIds?: TokenId[]`。** 全计划没有任何
> 写入方，而 Task 9 的详情页实际是按 `Token.ownerGeneralId` 反查关联标记牌。加上它
> 只会留一个永远为空的字段，还会让 `general.ts` 与 `token.ts` 互相 import 形成类型
> 循环。武将↔标记牌的关系单向存放在 Token 一侧即可。

- [ ] **Step 1: 新建 Token 类型**

Create `packages/data/src/types/token.ts`：

```ts
import type { GeneralId } from './general.js';

export type TokenId = string & { readonly __brand: 'TokenId' };

/** 标记牌分类：技能标记 / 模块配件（大攻车）/ 其他（君主牌、休整牌等）。 */
export type TokenCategory = 'skill' | 'module' | 'misc';

export interface Token {
  id: TokenId;
  /** 卡面名称，如「羊祜」「上上签」「云纹」。 */
  name: string;
  image: string;
  /** 对应的「XX背面」图，按文件名自动配对。 */
  backImage?: string;
  /** 能确定归属时才有；认不出的留空。 */
  ownerGeneralId?: GeneralId;
  category: TokenCategory;
  /** category === 'module' 时的模块名，目前只有「大攻车」。 */
  module?: string;
}
```

- [ ] **Step 2: 给 General 加三个可选字段**

Modify `packages/data/src/types/general.ts`，在 `pack: string;` 之后、`perfectMatchPartners?` 之前插入：

```ts
  /** 野心家卡（AM001 司马昭 / AM003 孙綝 / AM004 公孙渊）。 */
  isAmbitionist?: boolean;
  /** 十常侍 10 名子卡指向父卡 general_qun_000。 */
  parentGeneralId?: GeneralId;
```

**不需要往 `general.ts` 加任何 import** —— `GeneralId` 就在本文件里定义。`token.ts`
单向 import `general.ts` 的 `GeneralId`，反方向没有依赖。

- [ ] **Step 3: 给 Card 加 image 字段**

Modify `packages/data/src/types/card.ts`，在 `Card` 接口的 `range?: number;` 之前插入：

```ts
  /**
   * 有卡面图的扩展牌（群狼环鼎新增的 21 张游戏牌）。标准牌无此字段。
   *
   * 这个字段同时是「标准牌 vs 扩展牌」的**唯一判据** —— `/cards` 页面和
   * `cards.test.ts` 都靠 `image == null` 筛出标准牌堆。不要另加 `pack` 字段：
   * 没有任何代码会读它，而现有 146 张标准牌也都没有该字段。
   */
  image?: string;
```

- [ ] **Step 4: 导出新类型**

Modify `packages/data/src/types/index.ts`：

```ts
export * from './card.js';
export * from './faq.js';
export * from './faction.js';
export * from './general.js';
export * from './skill.js';
export * from './token.js';
```

- [ ] **Step 5: 确认类型编译通过**

Run: `pnpm --filter '@sgs/data' build`
Expected: 无报错，`packages/data/dist/types/token.d.ts` 生成

- [ ] **Step 6: 提交**

```bash
git add packages/data/src/types/
git commit -m "feat(data): add Token type, extend General and Card"
```

**只提交 `src/types/`，不要碰 `dist/`。** `packages/data/dist/` 被 `.gitignore:8` 的
`dist/` 规则忽略，且当前零文件被跟踪 —— `git add packages/data/dist/` 会直接报
`The following paths are ignored by one of your .gitignore files` 并终止，加 `-f` 强推
更是错的。

另外 Step 5 的 `pnpm --filter '@sgs/data' build` 会改动 `packages/data/tsconfig.tsbuildinfo`，
这个文件**确实被跟踪**。**不要把它加进本次提交** —— 本分支拉出来之前，工作区就已经有
`packages/ai/tsconfig.tsbuildinfo`（已删除）和 `packages/engine/tsconfig.tsbuildinfo`（已修改）
处于脏状态，属于既有状况，不在本次改动范围内。

---

### Task 4: 解图认亲，产出手工映射表

**Files:**
- Create: `scripts/qlhd/manual-mappings.ts`
- Create: `scripts/qlhd/crop-corners.py`

**Interfaces:**
- Consumes: `~/qlhd-src/c国战 - Copy/`
- Produces:
  - `export const DUAL_FACTION: Record<string, 'WEI'|'SHU'|'WU'|'QUN'>` —— 键为 `${faction}${cardNo}`
  - `export const UUID_FILE_MAP: Record<string, { faction: 'QUN'; cardNo: string; title: string; name: string }>`
  - `export const TOKEN_OWNERS: Record<string, string>` —— 标记牌名 → generalId
  - `export const EUNUCH_ORDER: string[]` —— 十常侍 10 名子卡的姓名顺序

- [ ] **Step 1: 写裁角工具**

Create `scripts/qlhd/crop-corners.py`：

```python
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
```

- [ ] **Step 2: 裁 24 张标记牌正面的底部署名条并识别**

```bash
cd ~/qlhd-src/"c国战 - Copy"/标记牌
python3 /mnt/c/Users/SY/Workspace/110-sgs-wiki/scripts/qlhd/crop-corners.py \
  --region footer --out /tmp/token-footers.jpg \
  $(ls *.png *.jpg | grep -v 背面 | head -12)
```

分两批（每批 12 张）跑，然后**逐张读图**，把底部署名（形如「**全琮技能卡**」）里的武将名记下来。`全综.png` 的署名是「全琮」—— 文件名是错别字，以卡面为准。

已知按文件名即可关联的 11 组无需识别，但也一并裁出来做复核：羊祜、羊徽瑜、许褚、马钧、黄权、邓芝、荀谌、曹髦、冯熙、郭照红色、郭照黑色。

- [ ] **Step 3: 写映射表**

Create `scripts/qlhd/manual-mappings.ts`。`DUAL_FACTION` 的 7 条已在 spec 5.2 认定完毕，直接抄；`TOKEN_OWNERS` 用 Step 2 的识别结果填写。

```ts
import type { SubFaction } from './parse-filename.js';

/**
 * 新素材的双势力文件名丢失了 `&副势力` 段，需要补。
 * 键：`${faction}${cardNo}`。
 *
 * 前 5 条搬运自替换前的 generals.json；后 7 条由裁取左上角双色徽记
 * 与体力阴阳鱼配色解图认定（蜀橙 / 魏蓝 / 吴绿 / 群白），见 spec 5.2。
 */
export const DUAL_FACTION: Record<string, SubFaction> = {
  QUN072: 'SHU',   // 刘琦   —— 旧数据
  QUN066: 'WEI',   // 许攸   —— 旧数据
  QUN051: 'WU',    // 士燮   —— 旧数据
  SHU071: 'WU',    // 糜芳&傅士仁 —— 旧数据
  WEI079: 'SHU',   // 孟达   —— 旧数据
  QUN195: 'SHU',   // 孟优   —— 解图
  SHU041: 'WEI',   // 夏侯霸 —— 解图
  SHU072: 'QUN',   // 彭羕   —— 解图
  WEI168: 'SHU',   // 黄权   —— 解图
  WU050: 'SHU',    // 潘濬   —— 解图
  WU070: 'QUN',    // 苏飞   —— 解图
  WU071: 'QUN',    // 许贡   —— 解图
};

/** 唯一一个 UUID 命名的散图，解图确认是杜预 G.QUN110。 */
export const UUID_FILE_MAP: Record<
  string,
  { faction: 'QUN'; cardNo: string; title: string; name: string }
> = {
  'ab539b47-7fa1-4918-af21-6114c3aa9067.png': {
    faction: 'QUN', cardNo: '110', title: '龙吟破乱', name: '杜预',
  },
};

/**
 * 标记牌归属：标记牌名（不含扩展名、不含「背面」）→ generalId。
 * 认不出归属的标记牌不要写进这里，让 ownerGeneralId 留空。
 *
 * 注意 `全综` 是素材的错别字，卡面署名为「全琮」。
 */
export const TOKEN_OWNERS: Record<string, string> = {
  // ——— 按文件名即可关联的 11 组 ———
  // 下面这些 generalId 已由控制方用 Task 1 的 parseCardFilename 对真实素材
  // 跑过一遍核对，是实测值不是推断值，直接用。
  羊祜: 'general_wei_089',      // 剑影当锋
  羊徽瑜: 'general_wei_124',    // 月耀华裳
  许褚: 'general_wei_005',      // 摧城拔山
  马钧: 'general_wei_063',      // 能工巧匠
  黄权: 'general_wei_168',      // 智答魏诏
  邓芝: 'general_shu_073',      // 樽俎折冲
  荀谌: 'general_qun_078',      // 鸿雪寒山
  曹髦: 'general_wei_101',      // 向死存魏
  冯熙: 'general_wu_089',       // 龙挟抑志
  郭照红色: 'general_wei_102',  // 慕贤明德（红黑两套标记指向同一武将）
  郭照黑色: 'general_wei_102',
  // ——— 文件名对不上、靠解图认亲的 ———
  // 「全综」是素材的错别字，卡面右下角署名为「全琮技能卡」。
  全综: 'general_wu_035',       // 全琮 · 拥立鲁王
  // ——— Step 2 解图若还认出别的归属，追加到这里 ———
};

/**
 * 十常侍 10 名子卡的姓名。用于判定某张卡是否要挂 parentGeneralId。
 *
 * 注意其中张让(QUN038) 与赵忠(QUN118) 有真实卡号，走 generalIdFor 得到
 * general_qun_038 / general_qun_118；只有其余 8 名是 QUNXXX，按出现顺序
 * 拿 general_qun_000_m01 … m08。父卡 general_qun_000（群/QUN000
 * 祸乱纲常·十常侍）在素材中存在，引用不会悬空。
 */
export const EUNUCH_ORDER: string[] = [
  '张让', '赵忠', '夏恽', '孙璋', '栗嵩',
  '段珪', '毕岚', '郭胜', '韩悝', '高望',
];
```

**`TOKEN_OWNERS` 里那 11 组的 generalId 是按卡号推断的占位值，必须用 Step 4 校验并改对。**

- [ ] **Step 4: 校验每个 generalId 在素材里真实存在**

```bash
cd /mnt/c/Users/SY/Workspace/110-sgs-wiki
pnpm tsx -e "
import { readdirSync } from 'node:fs';
import { parseCardFilename } from './scripts/qlhd/parse-filename.ts';
import { TOKEN_OWNERS } from './scripts/qlhd/manual-mappings.ts';
const ROOT = process.env.HOME + '/qlhd-src/c国战 - Copy';
const byId = new Map<string, string>();
for (const d of ['魏','蜀','吴','群','双势力','十常侍']) {
  for (const f of readdirSync(\`\${ROOT}/\${d}\`)) {
    const p = parseCardFilename(f);
    if (!p || p.cardNo === 'XXX') continue;
    const dg = p.cardNo.match(/^[0-9]+/)?.[0] ?? '';
    const num = dg.length >= 3 ? dg : dg.padStart(3, '0');
    const id = \`general_\${p.faction.toLowerCase()}_\${num}\${p.cardNo.slice(dg.length).toLowerCase()}\`;
    byId.set(id, \`\${p.name} «\${p.title}»\`);
  }
}
let bad = 0;
for (const [token, gid] of Object.entries(TOKEN_OWNERS)) {
  const who = byId.get(gid);
  if (who) console.log(\`✓ \${token.padEnd(8)} -> \${gid.padEnd(20)} = \${who}\`);
  else { bad++; console.log(\`✗ \${token.padEnd(8)} -> \${gid.padEnd(20)} 素材中不存在此 generalId\`); }
}
console.log(bad === 0 ? '全部 generalId 存在' : \`\${bad} 条指向不存在的 generalId\`);
process.exit(bad === 0 ? 0 : 1);
"
```

这个脚本做两件事：

1. **硬校验** —— `TOKEN_OWNERS` 里每个 generalId 必须真实存在于素材中。有 `✗` 就必须修到全 `✓`，脚本以非零码退出。
2. **人工核对辅助** —— 打印每个 generalId 解析出的武将名与称号，供你逐行扫一眼「这个标记牌配这个武将说得通吗」。

> **为什么不用「标记牌名反查武将名」来校验：** 标记牌的名字和它归属的武将名**没有**必然的字面关系。
> 只有一部分标记牌是以武将命名的（`羊祜.png` 归属羊祜），另一部分是技能名或道具名
> （`命运签` 归属周群、`明鉴` 归属曹叡、`矫诏` 归属郭皇后、`许身` 归属鲍三娘），
> 拿标记牌名去 `byName` 里查必然查不到，会对**正确**的条目报 `✗`。
> 归属的真正证据是卡面底部的「**XX技能卡**」署名条，已记在每条的行尾注释里。

- [ ] **Step 5: 提交**

```bash
git add scripts/qlhd/manual-mappings.ts scripts/qlhd/crop-corners.py
git commit -m "feat(qlhd): manual mapping tables for dual-faction and token owners"
```

---

### Task 5: 生成 generals.json

**Files:**
- Create: `scripts/qlhd/ids.ts`
- Create: `scripts/qlhd/ids.test.ts`
- Create: `scripts/qlhd/build-generals.ts`
- Modify: `packages/data/src/generals.json`（整体重写）

**Interfaces:**
- Consumes: `parseCardFilename`、`ParsedCard`（Task 1）；`DUAL_FACTION`、`UUID_FILE_MAP`、`EUNUCH_ORDER`（Task 4）；`General` 类型（Task 3）
- Produces: `export function generalIdFor(faction: string, cardNo: string, dupIndex: number): string`；重写后的 `packages/data/src/generals.json`（395 条）

- [ ] **Step 1: 写 ID 生成器的失败测试**

Create `scripts/qlhd/ids.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { generalIdFor } from './ids.js';

describe('generalIdFor', () => {
  it('三位卡号直接小写拼接', () => {
    expect(generalIdFor('WEI', '125', 0)).toBe('general_wei_125');
  });

  it('补齐到三位', () => {
    expect(generalIdFor('SHU', '4', 0)).toBe('general_shu_004');
  });

  it('四位卡号原样保留', () => {
    expect(generalIdFor('QUN', '1000', 0)).toBe('general_qun_1000');
  });

  it('字母后缀小写保留', () => {
    expect(generalIdFor('SHU', '085A', 0)).toBe('general_shu_085a');
  });

  it('同卡号第二张加 _b 后缀', () => {
    expect(generalIdFor('SHU', '004', 0)).toBe('general_shu_004');
    expect(generalIdFor('SHU', '004', 1)).toBe('general_shu_004_b');
    expect(generalIdFor('SHU', '004', 2)).toBe('general_shu_004_c');
  });

  it('AM 野心家卡用 am 前缀', () => {
    expect(generalIdFor('AM', '001', 0)).toBe('general_am_001');
  });

  it('XXX 卡号必须由调用方另行处理', () => {
    expect(() => generalIdFor('WEI', 'XXX', 0)).toThrow(/XXX/);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run scripts/qlhd/ids.test.ts`
Expected: FAIL —— 无法解析 `./ids.js`

- [ ] **Step 3: 实现 ID 生成器**

Create `scripts/qlhd/ids.ts`：

```ts
/**
 * 由势力代号 + 卡号生成 generalId。
 *
 * dupIndex 用于同卡号多版本：0 -> 无后缀，1 -> _b，2 -> _c …
 * （素材里有 4 组：孔融 QUN014、诸葛亮 SHU004、张瑾云 SHU097、滕胤 WU098）
 *
 * XXX 卡号（8 名十常侍 + 魏讽）不走这里，由调用方给专用 ID。
 */
export function generalIdFor(faction: string, cardNo: string, dupIndex: number): string {
  if (cardNo === 'XXX') {
    throw new Error(`generalIdFor 不处理 XXX 卡号（${faction}XXX），请由调用方指定 ID`);
  }
  const digits = cardNo.match(/^\d+/)?.[0] ?? '';
  const suffix = cardNo.slice(digits.length);
  const num = digits.length >= 3 ? digits : digits.padStart(3, '0');
  const base = `general_${faction.toLowerCase()}_${num}${suffix.toLowerCase()}`;
  if (dupIndex === 0) return base;
  return `${base}_${String.fromCharCode('a'.charCodeAt(0) + dupIndex)}`;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run scripts/qlhd/ids.test.ts`
Expected: PASS，8 个测试全绿

- [ ] **Step 5: 写 generals.json 生成脚本**

Create `scripts/qlhd/build-generals.ts`：

```ts
#!/usr/bin/env tsx
/**
 * 从解压素材生成 packages/data/src/generals.json（395 条）。
 *
 * 用法： pnpm tsx scripts/qlhd/build-generals.ts
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCardFilename, type ParsedCard } from './parse-filename.js';
import { generalIdFor } from './ids.js';
import { DUAL_FACTION, UUID_FILE_MAP, EUNUCH_ORDER } from './manual-mappings.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = resolve(process.env.HOME!, 'qlhd-src/c国战 - Copy');
const PACK = '群狼环鼎';
const EUNUCH_PARENT = 'general_qun_000';

/** 十常侍目录里这三张是标记牌，不是武将卡。 */
const NON_GENERAL_IN_EUNUCH_DIR = new Set([
  '休整.png', '休整背面.png', '十常侍背面.png',
]);

type Out = {
  id: string; name: string; title: string; faction: string;
  subfaction?: string; hp: number; maxHp: number; gender: string;
  skills: string[]; image: string; pack: string;
  isAmbitionist?: boolean; parentGeneralId?: string;
};

/**
 * AM（野心家）卡的真实势力取自所在素材目录 —— 卡面徽记也印证：
 * AM001 司马昭在「魏」、AM003 孙綝在「吴」、AM004 公孙渊在「群」。
 * 文件名里的 AM 只表示卡类，不是势力。
 */
const DIR_TO_FACTION: Record<string, string> = {
  魏: 'WEI', 蜀: 'SHU', 吴: 'WU', 群: 'QUN',
};

/**
 * AM 卡的势力只能来自 DIR_TO_FACTION，**不设兜底默认值**。
 *
 * `collect()` 还会遍历 双势力/ 与 十常侍/ 两个目录，它们不在 DIR_TO_FACTION 里。
 * 若哪天有 AM 卡出现在那里，静默退回 'QUN' 正是本任务要防的「一律记 QUN」失败模式，
 * 而且不会有任何断言发现。宁可让脚本炸掉，也不要写出一条势力错误的数据。
 */
function amFaction(dir: string): string {
  const f = DIR_TO_FACTION[dir];
  if (!f) {
    throw new Error(
      `AM 野心家卡出现在未映射的素材目录「${dir}」，无法判定势力。` +
      `请把该目录加入 DIR_TO_FACTION，或确认这张卡是否放错了位置。`,
    );
  }
  return f;
}

function collect(): { parsed: ParsedCard; file: string; dir: string }[] {
  const out: { parsed: ParsedCard; file: string; dir: string }[] = [];
  for (const dir of ['魏', '蜀', '吴', '群', '双势力', '十常侍']) {
    for (const file of readdirSync(resolve(SRC, dir))) {
      if (NON_GENERAL_IN_EUNUCH_DIR.has(file)) continue;
      const override = UUID_FILE_MAP[file];
      if (override) {
        out.push({ parsed: { ...override }, file, dir });
        continue;
      }
      const parsed = parseCardFilename(file);
      if (!parsed) throw new Error(`无法解析武将卡文件名: ${dir}/${file}`);
      out.push({ parsed, file, dir });
    }
  }
  return out;
}

function main() {
  const cards = collect();

  // 同 (势力, 卡号) 出现多次时按文件名排序后依次给 _b / _c
  const dupCount = new Map<string, number>();
  const sorted = [...cards].sort((a, b) => a.file.localeCompare(b.file, 'zh-CN'));

  const generals: Out[] = [];
  let eunuchSeq = 0;

  for (const { parsed, file, dir } of sorted) {
    const key = `${parsed.faction}${parsed.cardNo}`;

    let id: string;
    let parentGeneralId: string | undefined;
    if (parsed.cardNo === 'XXX') {
      if (EUNUCH_ORDER.includes(parsed.name)) {
        // 8 名无卡号的十常侍成员 -> m01…m08
        eunuchSeq += 1;
        id = `${EUNUCH_PARENT}_m${String(eunuchSeq).padStart(2, '0')}`;
        parentGeneralId = EUNUCH_PARENT;
      } else {
        // 目前只有魏讽
        id = `general_${parsed.faction.toLowerCase()}_xxx_${parsed.name}`;
      }
    } else {
      const n = dupCount.get(key) ?? 0;
      dupCount.set(key, n + 1);
      id = generalIdFor(parsed.faction, parsed.cardNo, n);
    }

    // 有卡号的十常侍成员（张让 QUN038 / 赵忠 QUN118）也要挂到父卡
    if (parsed.cardNo !== 'XXX' && EUNUCH_ORDER.includes(parsed.name)) {
      parentGeneralId = EUNUCH_PARENT;
    }

    const g: Out = {
      id,
      name: parsed.name,
      title: parsed.title,
      faction: parsed.faction === 'AM' ? amFaction(dir) : parsed.faction,
      hp: 4,
      maxHp: 4,
      gender: 'male',
      skills: [],
      image: `generals/${file.replace(/\.(png|jpg)$/i, '.webp')}`,
      pack: PACK,
    };

    const sub = parsed.subfaction ?? DUAL_FACTION[key];
    if (sub) g.subfaction = sub;
    if (parsed.faction === 'AM') g.isAmbitionist = true;
    if (parentGeneralId) g.parentGeneralId = parentGeneralId;

    generals.push(g);
  }

  // —— 断言 ——
  const ids = generals.map((g) => g.id);
  const dups = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dups.length) throw new Error(`重复 ID: ${[...new Set(dups)].join(', ')}`);
  if (generals.length !== 395) {
    throw new Error(`条目数 ${generals.length}，预期 395`);
  }
  for (const g of generals) {
    const p = resolve(REPO_ROOT, 'assets', g.image);
    if (!existsSync(p)) throw new Error(`图片不存在: ${g.image} (${g.id} ${g.name})`);
  }

  const dest = resolve(REPO_ROOT, 'packages/data/src/generals.json');
  writeFileSync(dest, JSON.stringify(generals, null, 2) + '\n', 'utf8');
  console.log(`写入 ${generals.length} 条 -> ${dest}`);
  console.log(`  野心家 ${generals.filter((g) => g.isAmbitionist).length}`);
  console.log(`  双势力 ${generals.filter((g) => g.subfaction).length}`);
  console.log(`  十常侍成员 ${generals.filter((g) => g.parentGeneralId).length}`);
}

main();
```

- [ ] **Step 6: 运行生成**

Run: `pnpm tsx scripts/qlhd/build-generals.ts`
Expected:
```
写入 395 条 -> .../packages/data/src/generals.json
  野心家 3
  双势力 16
  十常侍成员 10
```
任何断言抛错都要先修到通过，不要跳过。

- [ ] **Step 7: 抽查关键条目**

```bash
pnpm tsx -e "
import g from './packages/data/src/generals.json' with { type: 'json' };
const pick = (id) => JSON.stringify((g as any[]).find(x => x.id === id), null, 1);
console.log('曹丕(URL 继承):', pick('general_wei_014'));
console.log('夏侯霸(双势力):', pick('general_shu_041'));
console.log('司马昭(野心家):', pick('general_am_001'));
console.log('十常侍成员数:', (g as any[]).filter(x => x.parentGeneralId).length);
"
```

预期：`general_wei_014` 是曹丕、`pack` 为 `群狼环鼎`；`general_shu_041` 夏侯霸带 `subfaction: 'WEI'`；`general_am_001` 司马昭 `faction: 'WEI'` 且 `isAmbitionist: true`。

- [ ] **Step 8: 提交**

```bash
git add scripts/qlhd/ids.ts scripts/qlhd/ids.test.ts scripts/qlhd/build-generals.ts packages/data/src/generals.json
git commit -m "feat(qlhd): generate generals.json from pack assets (395 entries)"
```

---

### Task 6: 生成 tokens.json 并把游戏牌并入 cards.json

**Files:**
- Create: `scripts/qlhd/build-tokens.ts`
- Create: `packages/data/src/tokens.json`
- Create: `packages/data/src/pack-cards.json`

**Interfaces:**
- Consumes: `TOKEN_OWNERS`（Task 4）；`Token` 类型（Task 3）；`generals.json`（Task 5）
- Produces: `packages/data/src/tokens.json`（44 条）；`packages/data/src/pack-cards.json`（19 条）。**不改动 `cards.json`**

- [ ] **Step 1: 写生成脚本**

Create `scripts/qlhd/build-tokens.ts`：

```ts
#!/usr/bin/env tsx
/**
 * 生成 packages/data/src/tokens.json 与 packages/data/src/pack-cards.json。
 *
 * 游戏牌目录 21 个文件的去向：
 *   - 19 张带花色点数的 -> pack-cards.json
 *   - 2 张蒲元专属装备   -> tokens.json（挂 ownerGeneralId）
 *
 * **本脚本不改动 cards.json。** 那 146 张标准牌与本次改动无关。
 *
 * 用法： pnpm tsx scripts/qlhd/build-tokens.ts
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOKEN_OWNERS } from './manual-mappings.js';

// readFileSync 仅用于读 generals.json 校验 ownerGeneralId；本脚本不读写 cards.json。

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = resolve(process.env.HOME!, 'qlhd-src/c国战 - Copy');

type TokenOut = {
  id: string; name: string; image: string; backImage?: string;
  ownerGeneralId?: string; category: 'skill' | 'module' | 'misc'; module?: string;
};

const webp = (f: string) => f.replace(/\.(png|jpg)$/i, '.webp');
/** 「羊祜背面.png」-> 「羊祜」；「羊祜.png」-> 「羊祜」 */
const stem = (f: string) => f.replace(/\.(png|jpg)$/i, '').replace(/背面$/, '');

/** 稳定 id：中文名不适合做 id，用序号 + 分类前缀。 */
function tokenId(category: string, seq: number): string {
  return `token_${category}_${String(seq).padStart(3, '0')}`;
}

/**
 * 把一个素材目录里的「正面 + XX背面」按文件名配对。
 *
 * sharedBack：该目录若有一张多件共用的背面（大攻车的 12 个零件共用
 * `零件背面.png`），传进来作为配不到专属背面时的兜底，否则那张共用背面
 * 会成为谁也不引用的孤儿，而 12 个零件又全都缺 backImage。
 */
function pairUp(dir: string, assetDir: string, sharedBack?: string) {
  // 必须排序：tokenId 用的是贯穿全流程的全局 seq 计数器，序号直接取决于文件顺序，
  // 而 readdirSync 不保证跨操作系统/文件系统返回稳定顺序。build-generals.ts 已为
  // 同一个坑显式排过序（那里是 sorted = [...cards].sort(...)），这里保持一致。
  const files = readdirSync(resolve(SRC, dir)).sort();
  const fronts = files.filter((f) => !/背面\.(png|jpg)$/i.test(f));
  const backs = new Map(
    files.filter((f) => /背面\.(png|jpg)$/i.test(f)).map((f) => [stem(f), f]),
  );
  const fallback = sharedBack ? `${assetDir}/${webp(sharedBack)}` : undefined;
  return fronts.map((f) => ({
    name: stem(f),
    image: `${assetDir}/${webp(f)}`,
    backImage: backs.has(stem(f))
      ? `${assetDir}/${webp(backs.get(stem(f))!)}`
      : fallback,
  }));
}

function main() {
  const generals = JSON.parse(
    readFileSync(resolve(REPO_ROOT, 'packages/data/src/generals.json'), 'utf8'),
  ) as { id: string; name: string }[];
  const knownIds = new Set(generals.map((g) => g.id));

  const tokens: TokenOut[] = [];
  let seq = 0;

  // —— 大攻车零件（先建：标记牌目录里混有它的重复件，要靠这份名单去重）——
  const siege = pairUp('大攻车', 'tokens', '零件背面.png');
  const siegeNames = new Set(siege.map((t) => t.name));

  // —— 标记牌 ——
  for (const t of pairUp('标记牌', 'tokens')) {
    // 素材把 `大攻车图纸` 同时放进了 标记牌/ 和 大攻车/ 两个目录（内容 md5 相同），
    // 转换后已合并成同一个 .webp。这里跳过，让它只作为大攻车模块出现一次。
    if (siegeNames.has(t.name)) continue;

    // `大攻车技能` 只存在于 标记牌/ 目录，但它属于大攻车模块而不是某个武将的
    // 技能标记 —— 按名字前缀归到 module，避免它出现在「标记牌」区且归属为空。
    const isSiege = t.name.startsWith('大攻车');

    seq += 1;
    const owner = isSiege ? undefined : TOKEN_OWNERS[t.name];
    if (owner && !knownIds.has(owner)) {
      throw new Error(`TOKEN_OWNERS['${t.name}'] 指向不存在的 generalId: ${owner}`);
    }
    tokens.push({
      id: tokenId(isSiege ? 'module' : 'skill', seq),
      name: t.name,
      image: t.image,
      ...(t.backImage ? { backImage: t.backImage } : {}),
      ...(owner ? { ownerGeneralId: owner } : {}),
      category: isSiege ? 'module' : 'skill',
      ...(isSiege ? { module: '大攻车' } : {}),
    });
  }

  for (const t of siege) {
    seq += 1;
    tokens.push({
      id: tokenId('module', seq),
      name: t.name,
      image: t.image,
      ...(t.backImage ? { backImage: t.backImage } : {}),
      category: 'module',
      module: '大攻车',
    });
  }

  // —— 十常侍目录里的三张标记牌（图在 assets/generals/ 下）——
  for (const [name, front, back] of [
    ['休整', '休整.png', '休整背面.png'],
    ['十常侍背面', '十常侍背面.png', undefined],
  ] as const) {
    seq += 1;
    tokens.push({
      id: tokenId('misc', seq),
      name,
      image: `generals/${webp(front)}`,
      ...(back ? { backImage: `generals/${webp(back)}` } : {}),
      category: 'misc',
    });
  }

  // —— 保留的君主牌 ——
  for (const f of readdirSync(resolve(REPO_ROOT, 'assets/generals/emperors')).sort()) {
    if (/背面/.test(f)) continue;
    seq += 1;
    const m = /^国战UI\.EM\d+\.(.*?)\.([^.]+)\.png$/.exec(f);
    tokens.push({
      id: tokenId('misc', seq),
      name: m ? `${m[2]}（君主）` : f.replace(/\.png$/, ''),
      image: `generals/emperors/${f}`,
      backImage: 'generals/emperors/君主背面.png',
      category: 'misc',
    });
  }

  // —— 游戏牌拆分：带花色点数的进 cards.json，武将专属装备进 tokens ——
  //
  // 游戏牌目录里有 2 张文件名不带花色点数：
  //   蒲元寶物04-天機圖 copy.jpg  /  蒲元防具05-黑光鎧 copy.jpg
  // 它们是武将蒲元（general_shu_059「淬炼百兵」，历史上的铸剑大师）的专属宝物与防具，
  // 不是通用游戏牌。放进 cards.json 会违反 Card 类型（suit / number 是必填），
  // 所以归入 tokens 并挂到蒲元名下，这样也能出现在他的详情页「关联标记牌」区。
  const PACK_EQUIPMENT_OWNERS: Record<string, string> = {
    '蒲元寶物04-天機圖 copy.jpg': 'general_shu_059',
    '蒲元防具05-黑光鎧 copy.jpg': 'general_shu_059',
  };

  const SUIT: Record<string, string> = {
    '♠': 'spade', '♥': 'heart', '♣': 'club', '♦': 'diamond',
  };
  const CARD_PATTERN = /^(.+?)\.([♠♥♣♦])\.(\d+|[AJQK])\.(png|jpg)$/i;

  const packCardFiles: { file: string; m: RegExpExecArray }[] = [];
  for (const f of readdirSync(resolve(SRC, '游戏牌')).sort()) {
    const m = CARD_PATTERN.exec(f);
    if (m) { packCardFiles.push({ file: f, m }); continue; }

    const owner = PACK_EQUIPMENT_OWNERS[f];
    if (!owner) {
      throw new Error(
        `游戏牌「${f}」既不含花色点数，也不在 PACK_EQUIPMENT_OWNERS 里。` +
        `请确认它是通用游戏牌（应带 .花色.点数 后缀）还是某武将的专属装备（需登记归属）。`,
      );
    }
    if (!knownIds.has(owner)) {
      throw new Error(`PACK_EQUIPMENT_OWNERS['${f}'] 指向不存在的 generalId: ${owner}`);
    }
    seq += 1;
    tokens.push({
      id: tokenId('skill', seq),
      name: f.replace(/ copy\.(png|jpg)$/i, '').replace(/\.(png|jpg)$/i, ''),
      image: `cards/${webp(f)}`,
      ownerGeneralId: owner,
      category: 'skill',
    });
  }

  for (const t of tokens) {
    if (!existsSync(resolve(REPO_ROOT, 'assets', t.image))) {
      throw new Error(`标记牌图片不存在: ${t.image}`);
    }
    if (t.backImage && !existsSync(resolve(REPO_ROOT, 'assets', t.backImage))) {
      throw new Error(`标记牌背面不存在: ${t.backImage}`);
    }
  }

  writeFileSync(
    resolve(REPO_ROOT, 'packages/data/src/tokens.json'),
    JSON.stringify(tokens, null, 2) + '\n',
    'utf8',
  );
  console.log(`tokens.json: ${tokens.length} 条`);
  console.log(`  有归属 ${tokens.filter((t) => t.ownerGeneralId).length}`);

  // —— 带花色点数的游戏牌写入 pack-cards.json ——
  //
  // **不并入 cards.json。** Card 类型要求 `type: 'basic'|'trick'|'equipment'`、
  // `description` 和（装备牌的）`subtype`，而这些在只看文件名的前提下无从得知：
  // 七星宝刀是武器、大明日光铠是防具、遁甲天书是宝物、敕令才是锦囊，把 19 张
  // 一律写成 `type: 'trick'` 是往仓库里塞错数据，还会撞坏 cards.test.ts 里
  // 「trick 牌必须有 subtype」「按类型计数」等既有断言。
  //
  // 这里只写文件名能确证的四个字段。将来若有人逐张核对了卡面，再补 type/description。
  const packCards = packCardFiles.map(({ file: f, m }, i) => ({
    id: `qlhd_card_${String(i + 1).padStart(3, '0')}`,
    name: m[1],
    suit: SUIT[m[2]],
    number: m[3] === 'A' ? 1 : m[3] === 'J' ? 11 : m[3] === 'Q' ? 12 : m[3] === 'K' ? 13 : Number(m[3]),
    image: `cards/${webp(f)}`,
  }));

  for (const c of packCards) {
    if (!existsSync(resolve(REPO_ROOT, 'assets', c.image))) {
      throw new Error(`游戏牌图片不存在: ${c.image}`);
    }
  }

  writeFileSync(
    resolve(REPO_ROOT, 'packages/data/src/pack-cards.json'),
    JSON.stringify(packCards, null, 2) + '\n',
    'utf8',
  );
  console.log(`pack-cards.json: ${packCards.length} 条`);
}

main();
```

- [ ] **Step 2: 运行生成**

Run: `pnpm tsx scripts/qlhd/build-tokens.ts`
Expected:
```
tokens.json: 44 条
  有归属 18
pack-cards.json: 19 条
```

跑完后 `git status --short packages/data/src/` 里**不应出现 `cards.json`** —— 本任务完全不碰它。

**44** = 标记牌 24 组 − **1 组与大攻车重名（`大攻车图纸`，已跳过）** + 大攻车 13 组
+ 休整 + 十常侍背面 + 君主牌 4 + **蒲元专属装备 2**。

按 category 拆分应为：**skill 24 / module 14 / misc 6**。
- `大攻车技能` 虽在 标记牌/ 目录，但按名字前缀归入 module，所以标记牌只贡献 22 条 skill
- 蒲元的宝物与防具 2 条也是 skill（挂 `ownerGeneralId: general_shu_059`），22 + 2 = 24

带花色点数的 19 张写入**新文件 `pack-cards.json`**，`cards.json` 保持未改动。

大攻车 15 个文件配对后是 13 个正面：`大攻车图纸背面.jpg` 配到 `大攻车图纸.jpg`，
其余 12 个零件（云纹 / 兔口 / 冲阵 / 奇阵 / 战鼓 / 拒马 / 族旗 / 混元 / 玉符 /
王伦车 / 精钢 / 输石）没有专属背面，通过 `pairUp` 的 `sharedBack` 参数统一指向
共用的 `零件背面.webp`。

**实际数字以脚本输出为准。** 若 tokens 与 44 或 pack-cards 与 19 不符，先打印出实际
名单再排查，不要直接改代码迁就结果。

- [ ] **Step 3: 校验无孤儿背面**

```bash
pnpm tsx -e "
import t from './packages/data/src/tokens.json' with { type: 'json' };
const arr = t as any[];
console.log('总数', arr.length);
console.log('无背面的:', arr.filter(x => !x.backImage).map(x => x.name).join(' '));
console.log('无归属的:', arr.filter(x => x.category==='skill' && !x.ownerGeneralId).map(x => x.name).join(' '));
"
```

「无归属的」应当只剩 Task 4 Step 2 确实认不出的那几张。

- [ ] **Step 4: 提交**

```bash
git add scripts/qlhd/build-tokens.ts packages/data/src/tokens.json packages/data/src/pack-cards.json
git commit -m "feat(qlhd): generate tokens.json and pack-cards.json"
```

---

### Task 7: 清空 skills.json 并修复数据完整性测试

**Files:**
- Modify: `packages/data/src/skills.json`
- Modify: `packages/data/src/__tests__/data-integrity.test.ts`

**Interfaces:**
- Consumes: `generals.json`（Task 5）、`tokens.json`（Task 6）
- Produces: 空的 `skills.json`；断言 395 条武将、零技能、标记牌引用完整的测试套件

- [ ] **Step 1: 先跑现有测试，确认它现在是红的**

Run: `pnpm vitest run packages/data/src/__tests__/data-integrity.test.ts`
Expected: FAIL —— 至少两条：`has 341 entries` 拿到 395；`every general has at least one skill` 因为 `skills: []` 全数失败

这一步是必要的：它证明这些断言真的在保护数据，不是摆设。

- [ ] **Step 2: 清空 skills.json**

```bash
cd /mnt/c/Users/SY/Workspace/110-sgs-wiki
echo '[]' > packages/data/src/skills.json
```

- [ ] **Step 3: 重写数据完整性测试**

Modify `packages/data/src/__tests__/data-integrity.test.ts` —— 整体替换为：

```ts
import { describe, it, expect } from 'vitest';
import generalsData from '../generals.json';
import skillsData from '../skills.json';
import tokensData from '../tokens.json';
import packCardsData from '../pack-cards.json';

interface General {
  id: string;
  name: string;
  faction: string;
  skills: string[];
  image: string;
  pack: string;
  subfaction?: string;
  parentGeneralId?: string;
  isAmbitionist?: boolean;
  [key: string]: unknown;
}

interface Token {
  id: string;
  name: string;
  image: string;
  category: string;
  ownerGeneralId?: string;
  [key: string]: unknown;
}

interface PackCard {
  id: string;
  name: string;
  suit: string;
  number: number;
  image: string;
}

const generals = generalsData as General[];
const skills = skillsData as unknown[];
const tokens = tokensData as Token[];
const packCards = packCardsData as PackCard[];

const VALID_FACTIONS = new Set(['WEI', 'SHU', 'WU', 'QUN', 'JIN']);

describe('generals.json', () => {
  it('has 395 entries', () => {
    expect(generals).toHaveLength(395);
  });

  it('every general has id, name, faction, image and pack', () => {
    for (const g of generals) {
      expect(g.id, `general missing id: ${JSON.stringify(g)}`).toBeTruthy();
      expect(g.name, `general missing name: ${g.id}`).toBeTruthy();
      expect(g.faction, `general missing faction: ${g.id}`).toBeTruthy();
      expect(g.image, `general missing image: ${g.id}`).toBeTruthy();
      expect(g.pack, `general missing pack: ${g.id}`).toBe('群狼环鼎');
    }
  });

  it('has no duplicate IDs', () => {
    const ids = generals.map((g) => g.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every faction and subfaction is a known code', () => {
    for (const g of generals) {
      expect(VALID_FACTIONS.has(g.faction), `${g.id} bad faction ${g.faction}`).toBe(true);
      // 两条 subfaction 断言都要放进守卫里：全部 395 条中只有 16 条带 subfaction，
      // 无条件跑 `expect(undefined).not.toBe(<非空字符串>)` 对其余 379 条恒真，
      // 写着「每个武将副势力≠主势力」却只验证了 4%，是误导。
      if (g.subfaction) {
        expect(VALID_FACTIONS.has(g.subfaction), `${g.id} bad subfaction ${g.subfaction}`).toBe(true);
        expect(g.subfaction, `${g.id} subfaction equals faction`).not.toBe(g.faction);
      }
    }
  });

  it('carries no skill data in this pack', () => {
    for (const g of generals) {
      expect(g.skills, `general ${g.id} should have empty skills`).toEqual([]);
    }
  });

  it('every image path points under generals/', () => {
    for (const g of generals) {
      expect(g.image.startsWith('generals/'), `${g.id} bad image path ${g.image}`).toBe(true);
      expect(g.image.endsWith('.webp') || g.image.endsWith('.png'), `${g.id} bad ext`).toBe(true);
    }
  });

  it('has exactly 3 ambitionist, 10 eunuch members and 16 dual-faction generals', () => {
    expect(generals.filter((g) => g.isAmbitionist)).toHaveLength(3);
    expect(generals.filter((g) => g.parentGeneralId)).toHaveLength(10);
    // 这条计数是上面那个 `if (g.subfaction)` 守卫的配套保险：没有它，
    // 万一哪天 subfaction 数据整体丢失，被守卫包住的两条断言会全部跳过而测试照样绿。
    expect(generals.filter((g) => g.subfaction)).toHaveLength(16);
  });

  it('every parentGeneralId resolves to an existing general', () => {
    const ids = new Set(generals.map((g) => g.id));
    for (const g of generals) {
      if (!g.parentGeneralId) continue;
      expect(ids.has(g.parentGeneralId), `${g.id} orphan parent ${g.parentGeneralId}`).toBe(true);
    }
  });
});

describe('skills.json', () => {
  it('is empty — this pack ships images only', () => {
    expect(skills).toHaveLength(0);
  });
});

describe('tokens.json', () => {
  it('has no duplicate IDs', () => {
    const ids = tokens.map((t) => t.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate token IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every token has a known category', () => {
    for (const t of tokens) {
      expect(['skill', 'module', 'misc']).toContain(t.category);
    }
  });

  it('every ownerGeneralId resolves to an existing general', () => {
    const ids = new Set(generals.map((g) => g.id));
    const orphans = tokens
      .filter((t) => t.ownerGeneralId && !ids.has(t.ownerGeneralId))
      .map((t) => `${t.name} -> ${t.ownerGeneralId}`);
    expect(orphans, `orphan token owners:\n${orphans.join('\n')}`).toHaveLength(0);
  });

  it('module tokens all belong to the 大攻车 module', () => {
    for (const t of tokens) {
      if (t.category !== 'module') continue;
      expect((t as { module?: string }).module, `${t.name} missing module`).toBe('大攻车');
    }
  });
});

describe('pack-cards.json', () => {
  const VALID_SUITS = new Set(['spade', 'heart', 'club', 'diamond']);

  it('has 19 entries', () => {
    expect(packCards).toHaveLength(19);
  });

  it('has no duplicate IDs', () => {
    const ids = packCards.map((c) => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates, `duplicate pack-card IDs: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  it('every card has a real suit and a number in 1..13', () => {
    for (const c of packCards) {
      expect(VALID_SUITS.has(c.suit), `${c.name} bad suit ${c.suit}`).toBe(true);
      expect(Number.isInteger(c.number), `${c.name} non-integer number`).toBe(true);
      expect(c.number >= 1 && c.number <= 13, `${c.name} number out of range: ${c.number}`).toBe(true);
    }
  });

  it('every image path points under cards/ and is a webp', () => {
    for (const c of packCards) {
      expect(c.image.startsWith('cards/'), `${c.id} bad image path ${c.image}`).toBe(true);
      expect(c.image.endsWith('.webp'), `${c.id} not a webp: ${c.image}`).toBe(true);
    }
  });

  it('carries no fabricated type/description/subtype fields', () => {
    // 这些字段在只看文件名的前提下无从得知，本包刻意不写。
    // 若将来有人逐张核对了卡面再补，届时同步更新这条断言。
    for (const c of packCards) {
      const keys = Object.keys(c).sort();
      expect(keys, `${c.id} unexpected fields`).toEqual(['id', 'image', 'name', 'number', 'suit']);
    }
  });
});
```

原测试里依赖 `qsgs-generals.json` 的那条「只在称号与 QSanguosha 源匹配时才合并技能数据」已随技能数据一并移除 —— 本包不产出技能，该约束无对象可管。

- [ ] **Step 4: 运行测试确认全绿**

Run: `pnpm vitest run packages/data/src/__tests__/data-integrity.test.ts`
Expected: PASS

- [ ] **Step 5: 确认 `cards.test.ts` 未受影响**

Task 6 改为把 19 张游戏牌写进独立的 `packages/data/src/pack-cards.json`，**没有改动 `cards.json`**，
所以这个文件里关于标准牌堆的断言（82 basic / 40 trick / 24 equipment、杀的变体计数、花色覆盖等）
全部不受影响。

Run: `pnpm vitest run packages/data/src/cards.test.ts`
Expected: 10/10 全绿，无需任何改动。

若它红了，说明 `cards.json` 被谁动过了 —— 停下来排查，不要改断言。

- [ ] **Step 5c: 补上根 vitest 配置缺失的 `@` 路径别名**

根目录 `pnpm vitest run` 有 **6 个先天失败**（`packages/web/src/app/api/ratings/[id]/route.test.ts` 和
`api/admin/_smoke.test.ts`，报 `Cannot find package '@/lib/entity-store'`）。原因是根
`vitest.config.ts` 的 `include` 匹配到了 `packages/web` 的测试，却没有 `packages/web/vitest.config.ts`
里那份 `@` 别名。这不是本次改动造成的 —— 基线实测就是 `2 failed | 31 passed (33) 文件，
6 failed | 458 passed (464) 测试`。

不修的话，「全量测试全绿」这个闸门永远无法满足，真正的回归会藏在这 6 个已知失败里看不出来。
全仓只有 `packages/web` 用 `@/` 前缀（42 个文件），其余三个包一个都没有，所以根级别名是安全的。

Modify `vitest.config.ts`：

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: [
      "packages/*/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
    ],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      // 只有 packages/web 使用 "@/" 前缀；与 packages/web/vitest.config.ts 保持一致。
      "@": fileURLToPath(new URL("./packages/web/src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 5d: 跑全量测试，确认真的全绿**

Run: `pnpm vitest run`
Expected: **0 failed**。若还有测试失败，逐个打开看，把断言改对；**不要删测试来让它变绿**，
也不要靠回退 Step 5c 来绕过。

- [ ] **Step 6: 提交**

```bash
git add packages/data/src/skills.json packages/data/src/__tests__/ vitest.config.ts
git commit -m "test(data): rewrite integrity suite for 群狼环鼎 (395 generals, no skills)"
```

---

### Task 8: 把标记牌加进全站搜索索引

**Files:**
- Modify: `packages/web/src/components/search/search-data.ts`
- Modify: `packages/web/src/components/search/GlobalSearch.tsx`
- Modify: `packages/web/src/app/search/SearchResultsClient.tsx`
- Create: `packages/web/src/components/search/search-data.test.ts`

**Interfaces:**
- Consumes: `tokens.json`（Task 6）、`generals.json`（Task 5）
- Produces: `SearchResultType` 增加 `"token"` 分支；`search()` 能命中标记牌名

- [ ] **Step 1: 写失败的搜索测试**

Create `packages/web/src/components/search/search-data.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { search, searchEntries } from './search-data';

describe('search index', () => {
  it('索引里不再有技能条目', () => {
    expect(searchEntries.filter((e) => e.type === 'skill')).toHaveLength(0);
  });

  it('不再有名为「未知」的条目', () => {
    expect(searchEntries.filter((e) => e.title === '未知')).toHaveLength(0);
  });

  it('武将按名字可搜', () => {
    const hits = search('司马师');
    expect(hits.some((h) => h.type === 'general' && h.title === '司马师')).toBe(true);
  });

  it('武将按称号可搜', () => {
    const hits = search('惟几成务');
    expect(hits.some((h) => h.type === 'general')).toBe(true);
  });

  it('标记牌按名字可搜', () => {
    const hits = search('上上签');
    expect(hits.some((h) => h.type === 'token' && h.title === '上上签')).toBe(true);
  });

  it('搜「羊祜」同时命中武将与其标记牌', () => {
    const hits = search('羊祜');
    expect(hits.some((h) => h.type === 'general')).toBe(true);
    expect(hits.some((h) => h.type === 'token')).toBe(true);
  });

  it('群狼环鼎新增牌按名字可搜', () => {
    const hits = search('七星宝刀');
    expect(hits.some((h) => h.type === 'card' && h.title === '七星宝刀')).toBe(true);
  });

  it('十常侍子卡可搜且指向父卡详情页', () => {
    const hits = search('高望');
    const hit = hits.find((h) => h.type === 'general' && h.title === '高望');
    expect(hit).toBeDefined();
    expect(hit!.href).toBe('/generals/general_qun_000');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run packages/web/src/components/search/search-data.test.ts`
Expected: FAIL —— 「标记牌按名字可搜」等条目找不到

- [ ] **Step 3: 改造 search-data.ts**

Modify `packages/web/src/components/search/search-data.ts`：

① 把 skills 的 import 换成 tokens：

```ts
import generalsData from "../../../../data/src/generals.json";
import tokensData from "../../../../data/src/tokens.json";
import cardsData from "../../../../data/src/cards.json";
import packCardsData from "../../../../data/src/pack-cards.json";
import faqData from "../../../../data/src/faq.json";
```

② 类型改动：

```ts
export type SearchResultType = "general" | "token" | "card" | "faq";
```

③ 删掉 `RawSkill` 类型和 `skills` 常量，新增：

```ts
type RawToken = {
  id: string;
  name: string;
  category: string;
  ownerGeneralId?: string;
};

type RawPackCard = {
  id: string;
  name: string;
  suit: string;
  number: number;
};
```

④ `RawGeneral` 加上 `parentGeneralId`：

```ts
type RawGeneral = {
  id: string;
  name: string;
  title: string;
  faction: string;
  parentGeneralId?: string;
};
```

⑤ `buildSearchEntries()` 里，把整段 skills 循环替换成 tokens 循环，并让武将条目在有父卡时指向父卡：

```ts
const generals = generalsData as RawGeneral[];
const tokens = tokensData as RawToken[];
const packCards = packCardsData as RawPackCard[];

const generalNameMap = new Map<string, string>(
  generals.map((g) => [g.id, g.name]),
);

function buildSearchEntries(): SearchResult[] {
  const entries: SearchResult[] = [];

  // Generals — searchable by name + title.
  // 十常侍子卡没有独立详情页，链接指向父卡。
  for (const g of generals) {
    entries.push({
      id: g.id,
      type: "general",
      title: g.name,
      subtitle: g.title,
      href: `/generals/${g.parentGeneralId ?? g.id}`,
    });
  }

  // Tokens — searchable by name; subtitle shows the owning general when known.
  for (const t of tokens) {
    const owner = t.ownerGeneralId ? generalNameMap.get(t.ownerGeneralId) : undefined;
    entries.push({
      id: t.id,
      type: "token",
      title: t.name,
      subtitle: owner ?? (t.category === "module" ? "大攻车" : "标记牌"),
      href: t.ownerGeneralId ? `/generals/${t.ownerGeneralId}` : "/cards",
    });
  }

  // 群狼环鼎新增牌 —— 按名字可搜，副标题给花色点数
  const SUIT_SIGN: Record<string, string> = {
    spade: "♠", heart: "♥", club: "♣", diamond: "♦",
  };
  for (const c of packCards) {
    entries.push({
      id: c.id,
      type: "card",
      title: c.name,
      subtitle: `群狼环鼎 ${SUIT_SIGN[c.suit] ?? ""}${c.number}`,
      href: "/cards",
    });
  }

  // ... 标准牌 cards 和 faq 循环保持不变
```

⑥ **两个**消费端文件都对 `SearchResultType` 做了穷举，**都要改**（只改一个会因
`Record<SearchResultType, ...>` 缺键而编译失败）：

- `packages/web/src/components/search/GlobalSearch.tsx`
- `packages/web/src/app/search/SearchResultsClient.tsx`

两处各有一个 `TYPE_META` 对象和一个 `order` 数组。改法相同：

把 `skill:` 那一项整体改成 `token:`，标签由「技能」改为「标记牌」，图标和颜色沿用原来的
（`text-wei`）—— 不需要画新图标：

```ts
  token: {
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "标记牌",
    color: "text-wei",
  },
```

并把 `order` 数组里的 `"skill"` 换成 `"token"`：

```ts
  const order: SearchResultType[] = ["general", "token", "card", "faq"];
```

> 这两个文件的 `TYPE_META` / `groupResults` 是重复代码，本次**不要顺手抽取共用** ——
> 那属于计划范围外的重构。照原样各改各的，把重复问题留给最终评审分诊。

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run packages/web/src/components/search/search-data.test.ts`
Expected: PASS，8 个测试全绿

- [ ] **Step 5: 类型检查**

Run: `pnpm --filter '@sgs/web' lint`
Expected: 无 `skill` 相关的残留类型错误

- [ ] **Step 6: 提交**

```bash
git add packages/web/src/components/search/ packages/web/src/app/search/SearchResultsClient.tsx
git commit -m "feat(search): index tokens and pack cards, drop skill entries"
```

---

### Task 9: 站点 UI 改动

**Files:**
- Modify: `packages/web/src/app/generals/components/GeneralListClient.tsx`
- Modify: `packages/web/src/app/generals/page.tsx`
- Modify: `packages/web/src/app/generals/[id]/page.tsx`
- Modify: `packages/web/src/components/search/GlobalSearch.tsx`（仅搜索框占位符文案）
- Modify: `packages/web/src/app/search/page.tsx`（仅 metadata 文案）
- Create: `packages/web/src/app/generals/[id]/components/TokenStrip.tsx`

**Interfaces:**
- Consumes: `Token` 类型（Task 3）、`tokens.json`（Task 6）、`generals.json`（Task 5）
- Produces: `TokenStrip` 组件，props `{ tokens: Token[] }`

- [ ] **Step 1: 列表页隐藏体力筛选、排除十常侍子卡**

Modify `packages/web/src/app/generals/components/GeneralListClient.tsx`：

① 删除 `import HpFilter from "./HpFilter";`
② 删除 `const VALID_HPS = new Set([3, 4, 5]);` 和 `parseHp` 函数
③ 删除 `hpFilter` 的 `useState` 与 URL 同步里的 `hp` 参数读写
④ 删除 `filtered` 里的整段 HP filter
⑤ 删除工具栏 JSX 里的 `<HpFilter ... />` 及其相邻的一个 `<div className="hidden h-6 w-px ..." />` 分隔条
⑥ 结果计数那行的条件里去掉 `hpFilter > 0`
⑦ 「清除筛选」按钮的 `onClick` 里去掉 `setHpFilter(0)`

`HpFilter.tsx` 文件本身保留不删 —— 将来补上真实体力值就能直接接回来。

Modify `packages/web/src/app/generals/page.tsx`，把 `entries` 的构造改为排除子卡：

```ts
  const entries: GeneralEntry[] = generals
    // 十常侍 10 名子卡没有独立详情页，只在父卡页面展示
    .filter((g) => !(g as { parentGeneralId?: string }).parentGeneralId)
    .map((g) => ({
```

同时把 `GeneralEntry` 里的 `skillNames` 相关代码删掉（`skills` 已全空，`skillNameMap` 是死代码）：

```ts
export default async function GeneralsPage() {
  const [generals, ratings] = await Promise.all([
    entityStore.getGenerals(),
    entityStore.getRatings(),
  ]);

  const entries: GeneralEntry[] = generals
    .filter((g) => !(g as { parentGeneralId?: string }).parentGeneralId)
    .map((g) => ({
      id: g.id,
      name: g.name,
      title: g.title,
      faction: g.faction,
      hp: g.hp,
      image: g.image,
      averageTier: averageTier(ratings[g.id as unknown as string] ?? null),
    }));
```

对应地在 `GeneralListClient.tsx` 里从 `GeneralEntry` 类型删掉 `skillNames: string[];`，并把搜索过滤里的 `g.skillNames.some(...)` 那一行删掉。

- [ ] **Step 1b: 更新 `/generals` 的文案（它还在宣传已被移除的功能）**

`packages/web/src/app/generals/page.tsx` 有两处用户可见文案仍在承诺「体力筛选」和「技能名搜索」，
而这两样这次一个被移除、一个数据被清空。不改的话页面会明着说谎。

metadata 那处：

```ts
export const metadata: Metadata = {
  title: section?.label ?? "武将",
  description: "三国杀国战武将图鉴 — 群狼环鼎武将包，按势力筛选，按武将名与称号搜索。",
};
```

正文那处：

```tsx
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          浏览群狼环鼎武将包全部 {entries.length} 名武将，按势力筛选，或搜索武将名与称号。
        </p>
```

> 站点其余地方的「三国杀国战」**不要动** —— 国战是游戏模式，群狼环鼎是这个模式下的武将包，
> 两者不冲突。包名已经在详情页通过「系列：群狼环鼎」体现了。

还有两处搜索相关的文案也在宣传「技能」，而技能数据已被清空、索引里换成了标记牌。一并改掉：

`packages/web/src/components/search/GlobalSearch.tsx` 的搜索框占位符：

```tsx
          placeholder="搜索武将、标记牌、卡牌..."
```

`packages/web/src/app/search/page.tsx` 的 metadata：

```ts
export const metadata: Metadata = {
  title: "搜索",
  description: "三国杀国战 Wiki 全站搜索 — 武将、标记牌、卡牌、FAQ。",
};
```

> 这两处是 Task 8 评审发现的：搜索索引里已经没有任何「技能」条目了（335 条占位技能连同
> `skills.json` 一起清空），但界面还在告诉用户可以搜技能。

> ### ⚠️ 本地跑 dev 与 build 看到的数据**不一样**，这是正常的
>
> `entity-store.ts` 优先读 Redis，读不到才回退到打包进来的 JSON。而两种模式加载的
> env 文件不同：
>
> | 命令 | 加载的 env | 有无 Redis 凭据 | 看到的数据 |
> |---|---|---|---|
> | `pnpm --filter '@sgs/web' dev` | `.env.local`（只有 `VERCEL_OIDC_TOKEN`） | 无 | **JSON 回退 → 新数据 395 条** ✓ |
> | `pnpm --filter '@sgs/web' build` | `.env.production.local`（含 `KV_REST_API_*`） | 有 | **生产 Redis → 旧数据 341 条** |
>
> 也就是说：**在 Task 11 执行 Redis 替换之前，本地 `build` 预渲染出来的仍是旧包的
> 341 条路径，这不是 bug。** 用 `dev` 来肉眼验收新数据，用 `build` 只验证「能否构建成功」，
> 不要用 build 的路径条数去核对新数据。Task 11 灌完 Redis 之后，build 才会预渲染 385 条。
>
> （本地 build 会连生产 Redis，但只做读取，无写入风险。）

- [ ] **Step 2: 本地确认列表页**

Run: `pnpm --filter '@sgs/web' dev`，浏览 `http://localhost:3000/generals`
Expected: 顶部显示「共 385 名武将」（395 − 10 名子卡），势力筛选只有魏蜀吴群四个按钮，**没有体力筛选**，搜索「司马」能出结果

- [ ] **Step 3: 写 TokenStrip 组件**

Create `packages/web/src/app/generals/[id]/components/TokenStrip.tsx`：

```tsx
"use client";

import type { Token } from "@sgs/data";
import { assetUrl } from "@/lib/assets";

type TokenStripProps = {
  tokens: Token[];
};

export default function TokenStrip({ tokens }: TokenStripProps) {
  if (tokens.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {tokens.map((t) => (
        <figure
          key={t.id as unknown as string}
          className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80"
        >
          <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
            <img
              alt={t.name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              src={assetUrl(t.image)}
            />
          </div>
          <figcaption className="px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            {t.name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 详情页接入标记牌区与十常侍成员区，并隐藏假体力**

Modify `packages/web/src/app/generals/[id]/page.tsx`：

① 顶部加 import：

```ts
import type { Token } from "@sgs/data";
import tokensData from "../../../../../data/src/tokens.json";
import TokenStrip from "./components/TokenStrip";
```

② 在 `const ratings = await entityStore.getRatings();` 之后插入：

```ts
  /* 关联标记牌（构建期静态数据，不走 Redis） */
  const allTokens = tokensData as unknown as Token[];
  const generalTokens = allTokens.filter(
    (t) => (t.ownerGeneralId as unknown as string) === (general.id as unknown as string),
  );

  /* 十常侍等父卡的成员子卡 */
  const memberGenerals = allGeneralsRaw.filter(
    (g) =>
      (g as { parentGeneralId?: string }).parentGeneralId ===
      (general.id as unknown as string),
  );
```

③ **删除整段「HP hearts」的 `<div>`**（从 `{/* HP hearts */}` 注释到它对应的闭合 `</div>`）—— 本包 `hp` 是占位值 4，渲染假数据是坏 UI。

④ 在「Visitor rating」那个 `<section>` **之前**插入两个新 section：

```tsx
      {/* 关联标记牌 */}
      {generalTokens.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-5">关联标记牌</h2>
          <TokenStrip tokens={generalTokens} />
        </section>
      )}

      {/* 成员子卡（十常侍） */}
      {memberGenerals.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title mb-5">成员（{memberGenerals.length}）</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {memberGenerals.map((m) => (
              <figure
                key={m.id as unknown as string}
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80"
              >
                <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    alt={m.name}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                    src={assetUrl(m.image)}
                  />
                </div>
                <figcaption className="px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                  {m.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
```

⑤ `generateMetadata` 里的 description 引用了 `g.hp`，改掉：

```ts
    description: `${g.name}（${g.title}）— ${FACTION_META[g.faction].label}势力。三国杀国战武将详情。`,
```

⑥ `generateStaticParams` 要排除子卡，避免为没有页面的成员生成路由：

```ts
export async function generateStaticParams() {
  const all = await entityStore.getGenerals();
  return all
    .filter((g) => !(g as { parentGeneralId?: string }).parentGeneralId)
    .map((g) => ({ id: g.id as unknown as string }));
}
```

- [ ] **Step 5: 本地确认详情页**

浏览这三个页面：
- `http://localhost:3000/generals/general_wei_014` —— 曹丕，验证 URL 继承，无体力红心
- `http://localhost:3000/generals/general_wei_089` —— 羊祜，应出现「关联标记牌」区
- `http://localhost:3000/generals/general_qun_000` —— 十常侍，应出现「成员（10）」区

- [ ] **Step 6: 提交**

```bash
git add packages/web/src/app/generals/ packages/web/src/components/search/GlobalSearch.tsx packages/web/src/app/search/page.tsx
git commit -m "feat(web): token strip + eunuch members, drop placeholder HP UI"
```

---

### Task 10: /cards 页新增三个分区

**Files:**
- Modify: `packages/web/src/app/cards/page.tsx`
- Modify: `packages/web/src/app/generals/components/SearchBar.tsx`（仅占位符文案）
- Modify: `packages/web/src/lib/assets.ts`
- Create: `packages/web/src/lib/assets.test.ts`
- Create: `packages/web/src/app/cards/components/PackGallery.tsx`

**Interfaces:**
- Consumes: `tokens.json`（Task 6）、`cards.json` 中带 `image` 的条目（Task 6）
- Produces: `PackGallery` 组件，props `{ title: string; items: { id: string; name: string; image: string; note?: string }[] }`

- [ ] **Step 1: 写画廊组件**

Create `packages/web/src/app/cards/components/PackGallery.tsx`：

```tsx
"use client";

import { assetUrl } from "@/lib/assets";

export type GalleryItem = {
  id: string;
  name: string;
  image: string;
  note?: string;
};

type PackGalleryProps = {
  title: string;
  items: GalleryItem[];
};

export default function PackGallery({ title, items }: PackGalleryProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="section-title mb-5">
        {title}
        <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
          {items.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it) => (
          <figure
            key={it.id}
            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80"
          >
            <div className="aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img
                alt={it.name}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                src={assetUrl(it.image)}
              />
            </div>
            <figcaption className="px-2.5 py-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {it.name}
              </p>
              {it.note && (
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {it.note}
                </p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 页面接入三个分区**

Modify `packages/web/src/app/cards/page.tsx`：

① 顶部加 import：

```ts
import tokensData from "../../../../data/src/tokens.json";
import packCardsData from "../../../../data/src/pack-cards.json";
import generalsData from "../../../../data/src/generals.json";
import PackGallery, { type GalleryItem } from "./components/PackGallery";
```

② `RawCard` 与 `buildCardSummaries()` / `totalCopies` **完全不用改** —— Task 6 把 19 张
新增牌写进了独立的 `pack-cards.json`，`cards.json` 里仍然只有那 146 张标准牌。

⑤ 在 `<CardListClient ... />` 之后插入三个画廊：

```tsx
      <CardListClient cards={cards} totalCopies={totalCopies} />

      <PackGallery title="群狼环鼎新增牌" items={packCards} />
      <PackGallery title="标记牌" items={tokenItems} />
      <PackGallery title="大攻车" items={moduleItems} />
```

⑥ 在 `export default function CardsPage()` 内、`return` 之前构造这三组数据：

```ts
  type RawToken = {
    id: string; name: string; image: string;
    category: string; ownerGeneralId?: string;
  };
  const tokens = tokensData as RawToken[];
  const generalNames = new Map(
    (generalsData as { id: string; name: string }[]).map((g) => [g.id, g.name]),
  );

  type RawPackCard = {
    id: string; name: string; suit: string; number: number; image: string;
  };
  const SUIT_SIGN: Record<string, string> = {
    spade: "♠", heart: "♥", club: "♣", diamond: "♦",
  };
  const packCards: GalleryItem[] = (packCardsData as RawPackCard[]).map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    note: `${SUIT_SIGN[c.suit] ?? ""}${c.number}`,
  }));

  const tokenItems: GalleryItem[] = tokens
    .filter((t) => t.category === "skill")
    .map((t) => ({
      id: t.id,
      name: t.name,
      image: t.image,
      note: t.ownerGeneralId ? generalNames.get(t.ownerGeneralId) : undefined,
    }));

  const moduleItems: GalleryItem[] = tokens
    .filter((t) => t.category === "module")
    .map((t) => ({ id: t.id, name: t.name, image: t.image }));
```

- [ ] **Step 3: 修 `assetUrl()` 的 URL 编码（服务端每页都在报错）**

`packages/web/src/lib/assets.ts` 的 `assetUrl()` 直接把原始文件名拼进 URL，不做编码。
后果是**每个 `/generals/[id]` 页面在服务端都会抛一次**：

```
⨯ TypeError: Cannot convert argument to a ByteString because the character
  at index 73 has a value of 22269 which is greater than 255
```

`22269` 是「国」字。Next.js 要把这个 URL 放进 preload 响应头，而 HTTP 头只能是
latin-1，中文字符直接抛异常。页面仍返回 200、DOM 也正确（浏览器会自己给 `<img src>`
编码），但服务端日志被刷满。

**这对本任务尤其相关**：你要建的 `/cards` 页面里，19 张新增牌的文件名带 `♠♥♣♦`
（U+2660 等，同样 >255），会撞上完全一样的坑。

改 `packages/web/src/lib/assets.ts`：

```ts
export function assetUrl(path: string): string {
  const trimmed = path.replace(/^\/+/, "");
  // 文件名里有中文、`&`（双势力卡）和 `♠♥♣♦`（新增牌）等非 ASCII 字符。
  // 不编码的话，Next.js 把这个 URL 塞进 preload 响应头时会抛 ByteString 错误
  // （HTTP 头只能是 latin-1），每个详情页都会在服务端报一次。
  // encodeURI 只编码非 ASCII 与不安全字符、保留 `/` 分隔符，结果是纯 ASCII。
  return `${BASE_URL}/${encodeURI(trimmed)}`;
}
```

新建 `packages/web/src/lib/assets.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import { assetUrl } from "./assets";

describe("assetUrl", () => {
  it("percent-encodes CJK filenames so the URL is a valid ByteString", () => {
    const url = assetUrl("generals/国战UI.WEI014.荡然由心.曹丕.webp");
    expect(url).toContain("%E5%9B%BD%E6%88%98UI.WEI014");
    // eslint-disable-next-line no-control-regex
    expect(/^[\x00-\xFF]*$/.test(url), `not latin-1 safe: ${url}`).toBe(true);
  });

  it("encodes the ♠♥♣♦ suit glyphs used by pack card filenames", () => {
    const url = assetUrl("cards/七星宝刀.♠.K.webp");
    expect(url).toContain("%E2%99%A0");
    expect(/^[\x00-\xFF]*$/.test(url)).toBe(true);
  });

  it("keeps path separators intact", () => {
    expect(assetUrl("tokens/羊祜.webp")).toMatch(/\/assets\/tokens\/[^/]+$/);
  });

  it("strips leading slashes", () => {
    expect(assetUrl("//tokens/羊祜.webp")).toBe(assetUrl("tokens/羊祜.webp"));
  });
});
```

> **为什么可以放心编码**：控制方已用 `main` 上真实存在的旧图实测过，未编码、`encodeURI`、
> 分段 `encodeURIComponent` 三种写法 jsDelivr 都返回 **HTTP 200 且字节数完全相同**
> （含带 `&` 的 `国战UI.QUN&SHU072.炽焰不惧.刘琦.png`）。编码不会改变 CDN 的取值结果。

- [ ] **Step 4: 顺手改掉第三处过时文案**

`packages/web/src/app/generals/components/SearchBar.tsx:29` 的占位符仍是：

```tsx
        placeholder="搜索武将名、称号、技能名…"
```

Task 9 已经把 `skillNames` 从列表页的搜索过滤里删掉了，现在只能按武将名与称号搜，
这行文案在骗用户。改成：

```tsx
        placeholder="搜索武将名、称号…"
```

> 这是 Task 9 的实现者发现的第三处遗留「技能」文案（前两处是 `GlobalSearch.tsx` 的占位符
> 和 `app/search/page.tsx` 的 metadata，已在 Task 9 改掉）。**只改这一行字符串，不要动
> 该文件的任何逻辑。**

- [ ] **Step 5: 本地确认**

浏览 `http://localhost:3000/cards`
Expected: 原有标准牌列表数量不变（不含新增 21 张），下方出现三个分区，标记牌分区里有归属的会在名字下方显示武将名

> ### ⚠️ 本地跑 dev 与 build 看到的数据**不一样**，这是正常的
>
> `entity-store.ts` 优先读 Redis，读不到才回退到打包进来的 JSON。而两种模式加载的
> env 文件不同：
>
> | 命令 | 加载的 env | 有无 Redis 凭据 | 看到的数据 |
> |---|---|---|---|
> | `pnpm --filter '@sgs/web' dev` | `.env.local`（只有 `VERCEL_OIDC_TOKEN`） | 无 | **JSON 回退 → 新数据 395 条** ✓ |
> | `pnpm --filter '@sgs/web' build` | `.env.production.local`（含 `KV_REST_API_*`） | 有 | **生产 Redis → 旧数据 341 条** |
>
> 也就是说：**在 Task 11 执行 Redis 替换之前，本地 `build` 预渲染出来的仍是旧包的
> 341 条路径，这不是 bug。** 用 `dev` 来肉眼验收新数据，用 `build` 只验证「能否构建成功」，
> 不要用 build 的路径条数去核对新数据。Task 11 灌完 Redis 之后，build 才会预渲染 385 条。
>
> （本地 build 会连生产 Redis，但只做读取，无写入风险。）

- [ ] **Step 6: 构建检查**

Run: `pnpm --filter '@sgs/web' build`
Expected: 构建成功

- [ ] **Step 7: 提交**

```bash
git add packages/web/src/app/cards/ packages/web/src/app/generals/components/SearchBar.tsx packages/web/src/lib/assets.ts packages/web/src/lib/assets.test.ts
git commit -m "feat(web): pack cards, tokens and siege-engine galleries on /cards"
```

---

### Task 11: seed-redis 加 --replace 模式

**Files:**
- Modify: `scripts/seed-redis.ts`
- Create: `scripts/qlhd/backup-redis.ts`

**Interfaces:**
- Consumes: `generals.json`、`skills.json`、`faq.json`
- Produces: `--replace` 开关，清空旧键后灌入新数据

- [ ] **Step 1: 加 --replace 实现**

Modify `scripts/seed-redis.ts`：

① 文件头注释追加一段：

```
 * Replace mode:
 *   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... \
 *     pnpm seed-redis -- --yes --replace
 *
 *   Deletes every general:* / skills:by-general:* / skill:* key **that is
 *   referenced by generals:index or skills:index**, both index keys, and ALL
 *   rating data (ratings:all + ratings:log:*), then seeds fresh.
 *
 *   删除是 index 驱动的，不是 SCAN 驱动的 —— 未被两个 index 引用的孤儿值键
 *   （例如 putGeneral 写完值键后 index 更新失败留下的残骸）不在删除范围内。
 *   这一点很重要：/generals/[id] 没有设 dynamicParams = false，index 之外的
 *   id 会走按需渲染并直接读值键，所以残留的孤儿值键才是 ghost page 的真正载体。
 *   正常路径下不会产生孤儿键；若怀疑历史上有，需另行 SCAN 排查。
 *
 *   Add --dry-run to print the exact key set that WOULD be deleted and exit
 *   without writing anything.
```

② 参数解析处加：

```ts
const REPLACE = args.has("--replace");
const DRY_RUN = args.has("--dry-run");

// --dry-run 只在 --replace 分支里被读取。若不加这道守卫，
// `--yes --force --dry-run` 会绕过 index 守卫、直接执行一次完整 seed，
// 把生产数据整体覆写 —— 一个名叫 dry-run 的开关触发了破坏性写入。
if (DRY_RUN && !REPLACE) {
  console.error("--dry-run 目前只对 --replace 有效；不带 --replace 时本脚本仍会写入。已中止。");
  process.exit(2);
}
```

③ 在 `const existingIndex = await r.get<string[]>("generals:index");` 这段守卫**之前**插入替换逻辑：

```ts
  if (REPLACE) {
    console.error(`>>> --replace: wiping existing pack data on ${targetHost}`);

    const oldGeneralIds = (await r.get<string[]>("generals:index")) ?? [];
    const oldSkillIds = (await r.get<string[]>("skills:index")) ?? [];
    console.error(`    ${oldGeneralIds.length} generals, ${oldSkillIds.length} skills to remove`);

    const keys: string[] = [
      ...oldGeneralIds.map((id) => `general:${id}`),
      ...oldGeneralIds.map((id) => `skills:by-general:${id}`),
      ...oldSkillIds.map((id) => `skill:${id}`),
      "generals:index",
      "skills:index",
      "ratings:all",
    ];

    // ratings:log:YYYYMMDD 需要枚举而不是猜日期；放在删除之前，
    // 这样 --dry-run 也能报出完整的待删清单。
    const logKeys: string[] = [];
    {
      let cursor = "0";
      do {
        const [next, batch] = await r.scan(cursor, { match: "ratings:log:*", count: 200 });
        cursor = String(next);
        logKeys.push(...batch);
      } while (cursor !== "0");
    }

    if (DRY_RUN) {
      // 评分是本次唯一不可逆的损失，必须单独、具体地展示它的体量。
      // 把它混在「generals:index / skills:index / ratings:all  3」这样的行里，
      // 人看到「3」不会意识到自己正在批准销毁全站评分。
      const ratingsAll =
        (await r.get<Record<string, { total?: number }>>("ratings:all")) ?? {};
      const ratedCount = Object.keys(ratingsAll).length;
      const totalVotes = Object.values(ratingsAll).reduce(
        (a, v) => a + (v?.total ?? 0),
        0,
      );

      // 旧包有、新包没有的 ID —— 这些 URL 替换后会 404。
      const newIds = new Set(generals.map((g) => g.id));
      const vanishing = oldGeneralIds.filter((id) => !newIds.has(id));

      console.error(`>>> --dry-run: 以下 ${keys.length + logKeys.length} 个键**将会被删除**，本次不执行任何写操作`);
      console.error(`    general:*            ${oldGeneralIds.length}`);
      console.error(`    skills:by-general:*  ${oldGeneralIds.length}`);
      console.error(`    skill:*              ${oldSkillIds.length}`);
      console.error(`    generals:index       1`);
      console.error(`    skills:index         1`);
      console.error(`    ratings:log:*        ${logKeys.length}${logKeys.length ? ` (${logKeys.join(", ")})` : ""}`);
      console.error(``);
      console.error(`>>> ⚠️  ratings:all —— 这是不可逆的部分`);
      console.error(`    ${ratedCount} 名武将有评分，合计 ${totalVotes} 票，删除后无法恢复`);
      console.error(``);
      console.error(`>>> 替换后将写入 ${generals.length} generals / ${skills.length} skills / ${faqs.length} faqs`);
      if (vanishing.length > 0) {
        console.error(`>>> ⚠️  ${vanishing.length} 个旧 ID 在新包中不存在，其 URL 将变成 404：`);
        console.error(`    ${vanishing.join(", ")}`);
      } else {
        console.error(`>>> 所有旧 ID 在新包中都有对应条目，无 URL 失效`);
      }
      console.error(``);
      console.error(`>>> dry-run 结束，Redis 未被改动。`);
      console.error(`    注意：本次统计是此刻的快照。dry-run 与真正执行之间若有人投票或`);
      console.error(`    在 admin 里改动数据，实际删除的键集合会与上面略有出入。`);
      console.error(`    重跑 dry-run 是安全的（纯只读），执行前可再跑一次确认。`);
      process.exit(0);
    }

    // Upstash caps the number of args per command; delete in chunks.
    for (let i = 0; i < keys.length; i += 256) {
      const chunk = keys.slice(i, i + 256);
      if (chunk.length > 0) await r.del(...chunk);
    }

    if (logKeys.length > 0) {
      await r.del(...logKeys);
      console.error(`    removed ${logKeys.length} rating log keys`);
    }

    console.error(`    wipe complete (${keys.length} keys + ${logKeys.length} logs)`);
  }
```

④ 把守卫改成 `--replace` 时也放行：

```ts
  const existingIndex = await r.get<string[]>("generals:index");
  if (existingIndex && existingIndex.length > 0 && !FORCE && !REPLACE) {
```

- [ ] **Step 2: 自查代码，不要执行任何 Redis 操作**

> ### 🛑 本任务**只写代码，不碰生产 Redis**
>
> `--replace` 会**永久删除**生产库里的全部 `general:*` / `skill:*` / `skills:by-general:*`
> 与两个 index 键，以及**全部评分数据**（`ratings:all` 与 `ratings:log:*`）。这是不可逆的、
> 工作区之外的破坏性操作，必须由控制方在取得用户当面确认后执行。
>
> **你不要运行 `pnpm seed-redis`，不要带 `--replace`，也不要带 `--dry-run`。**
> 连 dry-run 也不要跑 —— 它虽然只读，但仍会连上生产库，没有必要。

请改为静态自查，把结论写进报告：

1. 待删键清单是否完整覆盖了这六类：`general:*`、`skills:by-general:*`、`skill:*`、
   `generals:index`、`skills:index`、`ratings:all`、`ratings:log:*`
2. `--dry-run` 分支是否确实在**任何 `r.del` 之前** `process.exit(0)`，即真的不会写
3. `logKeys` 的枚举是否移到了删除之前（否则 dry-run 报不出这一类）
4. 分片删除 `for (let i = 0; i < keys.length; i += 256)` 的边界是否正确（keys 为空时不应调用 `r.del()`）
5. `--replace` 是否正确绕过了原有的「index 已存在就拒绝覆盖」守卫，而 `--force` 的原语义未被破坏
6. `dump-redis` 是否**没有**被本任务以任何方式调用（它会覆盖 packages/data/src 下的三个 JSON）

- [ ] **Step 3: 写独立的备份脚本（这是你的交付物，但同样不要运行它）**

Create `scripts/qlhd/backup-redis.ts`：

```ts
#!/usr/bin/env tsx
/**
 * 在 seed-redis --replace 之前，把生产 Redis 里**会被删除的全部键**存成一份快照。
 *
 * 为什么不用 scripts/dump-redis.ts：那个脚本不写 stdout，而是直接覆盖
 * packages/data/src/{generals,skills,faq}.json —— 在替换流程的这个时点，
 * 那三个文件装的是刚生成好的新数据，跑一次就会被 Redis 里的旧数据换掉。
 *
 * 备份范围必须与 seed-redis.ts 的 --replace 删除集合逐类对应：
 *   general:<id>              (id ∈ generals:index)
 *   skills:by-general:<gid>   (gid ∈ generals:index)
 *   skill:<id>                (id ∈ skills:index)
 *   generals:index / skills:index
 *   ratings:all
 *   ratings:log:<date>        (SCAN 枚举)
 * 另外一并存 faqs（--replace 不删，但备份更宽属安全方向）。
 *
 * 用法：
 *   cd packages/web
 *   BACKUP=/tmp/redis-backup-$(date +%Y%m%d-%H%M%S).json pnpm tsx ../../scripts/qlhd/backup-redis.ts
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { Redis } from "@upstash/redis";

const out = process.env.BACKUP;
if (!out) {
  console.error("请用环境变量 BACKUP 指定输出文件路径");
  process.exit(1);
}

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("Missing UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN)");
  process.exit(1);
}
console.error(`>>> backup target: ${new URL(url).host}`);

const r = new Redis({ url, token });

async function scanAll(match: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [next, batch] = await r.scan(cursor, { match, count: 200 });
    cursor = String(next);
    keys.push(...batch);
  } while (cursor !== "0");
  return keys;
}

async function grabByIndex(indexKey: string, key: (id: string) => string) {
  const ids = (await r.get<string[]>(indexKey)) ?? [];
  const values = ids.length ? await r.mget<unknown[]>(...ids.map(key)) : [];
  return { ids, values };
}

(async () => {
  const generalIds = (await r.get<string[]>("generals:index")) ?? [];

  const snapshot = {
    takenAt: new Date().toISOString(),
    host: new URL(url).host,
    generals: await grabByIndex("generals:index", (id) => `general:${id}`),
    skills: await grabByIndex("skills:index", (id) => `skill:${id}`),
    faqs: await grabByIndex("faqs:index", (id) => `faq:${id}`),
    // 派生表：理论上可从 skills[].generalIds 重算，但若线上曾与之漂移，
    // 那份漂移量只存在于这些键里，删掉就没了。原样存一份，成本 5 行。
    skillsByGeneral: {
      keys: generalIds.map((id) => `skills:by-general:${id}`),
      values: generalIds.length
        ? await r.mget<unknown[]>(...generalIds.map((id) => `skills:by-general:${id}`))
        : [],
    },
    ratings: await r.get("ratings:all"),
    ratingLogs: {} as Record<string, unknown[]>,
  };

  for (const k of await scanAll("ratings:log:*")) {
    snapshot.ratingLogs[k] = await r.lrange(k, 0, -1);
  }

  writeFileSync(out, JSON.stringify(snapshot, null, 2));
  console.error(
    `备份完成 -> ${out}\n` +
      `  generals ${snapshot.generals.ids.length} / skills ${snapshot.skills.ids.length} / ` +
      `faqs ${snapshot.faqs.ids.length} / skills:by-general ${snapshot.skillsByGeneral.keys.length} / ` +
      `ratingLogs ${Object.keys(snapshot.ratingLogs).length} 个键`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**同样不要运行它。** 它只读，但没有必要在本任务里连生产库。请在报告里逐类核对：这份备份的
键集合与 `seed-redis.ts` 的 `--replace` 删除集合是否**一一对应**，并列出对照表。

- [ ] **Step 4 由控制方执行，不属于你的任务**

实际的备份、`--dry-run` 实跑、正式 `--replace`、以及事后校验，全部由控制方在用户确认后进行。

- [ ] **Step 5: 提交**

```bash
git add scripts/seed-redis.ts scripts/qlhd/backup-redis.ts
git commit -m "feat(scripts): seed-redis --replace with dry-run, wipes pack data and ratings"
```

---

### Task 12: 端到端验证与合流

**Files:** 无新增

- [ ] **Step 1: 全量测试**

Run: `pnpm vitest run`
Expected: 全绿

> ### ⚠️ 本地跑 dev 与 build 看到的数据**不一样**，这是正常的
>
> `entity-store.ts` 优先读 Redis，读不到才回退到打包进来的 JSON。而两种模式加载的
> env 文件不同：
>
> | 命令 | 加载的 env | 有无 Redis 凭据 | 看到的数据 |
> |---|---|---|---|
> | `pnpm --filter '@sgs/web' dev` | `.env.local`（只有 `VERCEL_OIDC_TOKEN`） | 无 | **JSON 回退 → 新数据 395 条** ✓ |
> | `pnpm --filter '@sgs/web' build` | `.env.production.local`（含 `KV_REST_API_*`） | 有 | **生产 Redis → 旧数据 341 条** |
>
> 也就是说：**在 Task 11 执行 Redis 替换之前，本地 `build` 预渲染出来的仍是旧包的
> 341 条路径，这不是 bug。** 用 `dev` 来肉眼验收新数据，用 `build` 只验证「能否构建成功」，
> 不要用 build 的路径条数去核对新数据。Task 11 灌完 Redis 之后，build 才会预渲染 385 条。
>
> （本地 build 会连生产 Redis，但只做读取，无写入风险。）

- [ ] **Step 2: 全量构建**

```bash
pnpm --filter '@sgs/data' build
pnpm --filter '@sgs/web' build
```
Expected: 两个都成功，Next 构建输出里 `/generals/[id]` 的静态页数为 385

- [ ] **Step 3: 逐项人工验收**

> ### ⚠️ 图片能否加载，在合流推送之前**无法验证**
>
> `assetUrl()` 的基址是 `https://cdn.jsdelivr.net/gh/Shihao-Yu/110-sgs-wiki@main/assets`，
> 指向的是 **`main` 分支**。而新图目前只存在于 `feat/qunlang-huanding` 上 —— 实测 `main`
> 上 `.webp` 文件数为 **0**，随便取一条新图 URL 请求 jsDelivr 返回 **HTTP 404**。
>
> 这不是沙盒或网络限制，是流程的固有次序：**必须先合流推送，图片才可能加载**。
> 所以下面这张走查表**只验证 DOM 结构、文案与数量**，图片渲染留到 Step 6 部署后再看。
> 本地看到裂图属正常，不要为此去「修」任何东西。

`pnpm --filter '@sgs/web' start` 后逐条走查：

| 检查项 | 预期 |
|---|---|
| `/generals` | 共 385 名武将；四个势力按钮；无体力筛选 |
| `/generals/general_wei_014` | 曹丕「荡然由心」，系列显示「群狼环鼎」，无体力红心，无技能区 |
| `/generals/general_wei_089` | 羊祜，有「关联标记牌」区 |
| `/generals/general_qun_000` | 十常侍，有「成员（10）」区 |
| `/generals/general_shu_041` | 夏侯霸，同时显示「蜀」和「魏」两个势力徽章 |
| `/cards` | 标准牌数量不变 + 三个新分区 |
| 全站搜索「羊祜」 | 同时命中武将与标记牌 |
| 全站搜索「未知」 | **零结果**（旧占位技能已清空） |
| 全站搜索「高望」 | 命中并跳转到 `/generals/general_qun_000` |

- [ ] **Step 4: 合流到 main**

```bash
git checkout main
git merge --no-ff feat/qunlang-huanding -m "feat: replace general pack with 群狼环鼎"
git push origin main
```

推送约 100 MB，视网速可能需要几分钟。

- [ ] **Step 5: 确认 jsDelivr 取到新图（一般无需 purge）**

`assetUrl()` 指向 `https://cdn.jsdelivr.net/gh/Shihao-Yu/110-sgs-wiki@main/assets`，而 jsDelivr
对**分支**引用（`@main`，非 tag）默认缓存 12 小时。但**这次基本不需要 purge**，原因是：

- 分支起点 `6fce1e0` 上 `assets/` 里的 `.webp` 文件数为 **0**
- 本次产出的 480 个 `.webp` 路径与旧路径**零交集**（旧图全是 `.png` / `.jpg`，且称号也变了）
- 唯一重叠的 6 条是保留未动的 `assets/generals/emperors/` 下 5 个 PNG 和 `assets/tokens/desktop.ini`，内容未变，缓存命中反而是正确的

jsDelivr 的分支缓存只影响**曾被请求过的路径**。这 480 个 URL 从未被任何人请求过，首次访问
就会回源到 GitHub 拉取。而站点是在合流+重新部署之后才开始引用 `.webp`，那时文件已在 `main` 上。

**要做的只是抽查确认：**

```bash
# 随便挑三张不同目录的新图，确认返回 200 且是 image/webp
for u in \
  "assets/generals/国战UI.WEI014.荡然由心.曹丕.webp" \
  "assets/tokens/羊祜.webp" \
  "assets/cards/七星宝刀.♠.K.webp"
do
  enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$u")
  code=$(curl -s -o /dev/null -w '%{http_code} %{content_type}' \
    "https://cdn.jsdelivr.net/gh/Shihao-Yu/110-sgs-wiki@main/$enc")
  echo "$code  $u"
done
```

预期三条都是 `200 image/webp`。

**只有在某张图确实 404 时**（例如推送后 jsDelivr 短暂缓存了缺失响应），才对**那一条路径**做定向
purge，不要对 480 个文件批量循环 —— 那样又慢又会撞 jsDelivr 的速率限制：

```bash
curl -s "https://purge.jsdelivr.net/gh/Shihao-Yu/110-sgs-wiki@main/<被编码的单个路径>"
```

返回 `{"status":"finished"}` 即可。

- [ ] **Step 6: 触发 Vercel 部署并验收线上**

搜索索引是**构建期**从 JSON 生成的，数据换了必须重新部署才会生效。推送 `main` 若已配置自动部署则等待完成；否则在 admin 里点「同步搜索」（调 `/api/admin/sync-search`，走 `VERCEL_DEPLOY_HOOK_URL`）。

部署完成后对线上重跑 Step 3 的走查表。**这一次要重点确认图片真的加载出来了** —— 这是
整个流程里第一次能够验证图片，此前本地看到的裂图是预期的（见 Step 3 上方说明）。

若有图片 404，用 Step 5 给出的单条 purge 命令处理，不要批量循环。

---

## Self-Review

**1. Spec coverage**

| Spec 章节 | 对应任务 |
|---|---|
| 2 · D1 完全替换 | Task 2 Step 3（删旧图）、Task 5（重写 generals.json）、Task 11（清 Redis） |
| 2 · D2 只解析文件名 | Task 1、Task 5 |
| 2 · D3 四类特殊牌全收 | Task 6、Task 10 |
| 2 · D4 WebP q85 | Task 2 |
| 2 · D5 读 31 张认亲 | Task 4 |
| 2 · D6 名字可搜 | Task 8 |
| 2 · D7 统一 Token 类型 | Task 3 |
| 2 · D8 保留君主牌 | Task 2 Step 3（不删 emperors）、Task 6 Step 1（收进 tokens） |
| 2 · D9 清空评分 | Task 11 |
| 3 ID 策略 | Task 5 Step 1–4 |
| 4 数据模型 | Task 3 |
| 5.1 六类边界 | Task 1 Step 3 逐条测试 |
| 5.2 双势力 | Task 4 Step 3 `DUAL_FACTION` |
| 5.3 标记牌归属 | Task 4 Step 2–4 |
| 6 图片管道 | Task 2 |
| 7 数据管道 | Task 5、Task 6、Task 7 |
| 8 搜索 | Task 7 Step 2（清空 skills）、Task 8 |
| 9 站点改动 | Task 9、Task 10 |
| 10 Redis 替换 | Task 11 |
| 11 验证 | Task 12 |

无遗漏。

**2. Placeholder scan**

`manual-mappings.ts` 里 `TOKEN_OWNERS` 的 `general_wu_XXX` 是**有意留下的待填值**，Task 4 Step 4 的校验脚本会把它标成 `✗` 并给出正确值，属于带验证闭环的填空而非占位符。Task 6 Step 2 的 tokens 条目数写的是推算值并注明「以脚本输出为准」，同样附了偏差时的处理方式。

**3. Type consistency**

- `parseCardFilename` / `ParsedCard` / `CardFaction` / `SubFaction`（Task 1）→ Task 4、5 引用一致
- `generalIdFor(faction, cardNo, dupIndex)`（Task 5）签名前后一致
- `Token` 字段（Task 3）→ Task 6 生成、Task 8 索引、Task 9 `TokenStrip`、Task 10 `PackGallery` 使用一致
- `GalleryItem`（Task 10）在组件与页面两处定义一致
- Task 9 删除 `GeneralEntry.skillNames` 时，同步删了 `page.tsx` 的构造和 `GeneralListClient` 的过滤引用

## 已知风险

1. **Task 2 Step 3 是破坏性的** —— 先删旧图再转换。旧图在 git 历史里仍可 `git checkout HEAD~1 -- assets/` 找回，但工作区会有一段时间处于两不着的状态。建议这一步一口气做完再做别的。
2. **Task 11 Step 3 会永久删除线上评分**，且 `--replace` 无 dry-run。Step 3 强制要求先 `dump-redis` 备份且校验非空。
3. **jsDelivr 12 小时缓存**（Task 12 Step 5）是最容易被忽略的一环，漏掉会导致线上大面积裂图，而本地一切正常。
4. **Task 6 的 tokens 条目数是推算值**。「零件背面.png」这类共用背面可能被当成独立正面，Step 2 已说明如何在 `pairUp` 里排除。
