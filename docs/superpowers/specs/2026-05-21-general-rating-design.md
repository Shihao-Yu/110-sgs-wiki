# 武将评级（General Rating）— 设计稿 v1

**Date**: 2026-05-21
**Status**: Approved (spec-challenge passed, see `docs/superpowers/reviews/2026-05-21-general-rating-challenge.md`)

## 1. 背景与目标

110-sgs-wiki 现在只能展示武将的体力、技能等"客观"信息，但用户对"这个武将到底强不强"完全没有共识入口。需要一个让访客快速表达评级的功能。

预期投票总量很小（每个武将 3–5 票级别），所以方案的复杂度要往简里走，不做加权平均、置信区间、分布直方图等需要大样本才有意义的处理。

**核心**：每个武将一个 5 档评级，访客投票，详情页可投，列表页可按档位筛选。

## 2. 范围

### In-scope (v1)
- 5 档评级（自高到低）：**夯 / 顶级 / 人上人 / npc / 拉完了**
- 访客投票，无需登录；**一人一票，可改为另一档**
- 详情页 `/generals/[id]` 出现投票 UI，显示当前众数 + 总票数
- 列表页 `/generals` 加一个 "评级" 筛选控件（与 `FactionFilter` / `HpFilter` 并列）
- 列表卡片**完全不显示评级**（用户要求 UI 克制）
- 有票就显示众数，不设阈值；总票数=0 视为"未评级"
- 防刷：localStorage 记录"我投了哪档"，叠加 IP rate-limit

### Out-of-scope (v1)
- ❌ 管理员定档（评级是访客数据，不与编辑混源）
- ❌ 分布直方图、加权平均、置信区间
- ❌ 按评级排序（无视觉锚点，列表卡片不显示评级，排序无意义）
- ❌ 投票历史、撤销 / 重置
- ❌ 评论 / 文字理由
- ❌ 列表卡片角标 / 颜色提示
- ❌ 管理员后台查看原始计数（暂不需要）

## 3. 数据模型

### Tier 定义

```ts
export const RATING_TIERS = ['夯', '顶级', '人上人', 'npc', '拉完了'] as const;
export type RatingTier = typeof RATING_TIERS[number];
```

数组顺序即"档位从高到低"，众数并列时取索引更小者（更高档优先）。

### KV 存储

**主表**：`ratings:all`（单一 key 装全部聚合数据）

```ts
type GeneralRating = {
  counts: Record<RatingTier, number>;  // 5 个计数器
  total: number;                        // 冗余字段 = sum(counts)
  updatedAt: string;                    // ISO timestamp
};

type RatingsAll = Record<GeneralId, GeneralRating>;
```

**为什么单 key 而不是 `rating:<generalId>` 一武将一 key**：

- 列表页筛选需要一次性拿到所有 ~150 个武将的众数；按 ID mget 也可行但 entityStore 现在没有这种封装，单 key 更顺。
- 写入并发：3–5 票总量下 read-modify-write 竞争可忽略。
- payload 体积：150 武将 × 5 counts × 几个字节 ≈ 几 KB，KV 单 value 上限远超出。

**事件日志**：`ratings:log:YYYY-MM-DD`（按日切分的 append-only 列表）

```ts
type VoteEvent = {
  generalId: GeneralId;
  from: RatingTier | null;   // 旧档位（首次投为 null）
  to: RatingTier;
  ts: string;                // ISO timestamp
  ipHash: string;            // sha256(ip).substring(0,12)，仅用于事后查异常
};
```

**为什么记**：spec-challenge 指出"丢弃投票流"是设计里唯一硬不可逆的决定。每次 POST 多一个 KV `LPUSH` 到当日 key —— 几乎零运行成本，但保留了"按时间切片"、"补丁后重置"、"事后查刷票"的未来选项。**v1 读端完全不消费这份日志**，纯写入；只是保命。

按日切分（不是单 key 全表）避免日志无界增长，未来想清理就按 key 删。

### 众数计算

```ts
function topTier(rating: GeneralRating): RatingTier | null {
  if (rating.total === 0) return null;
  let best: RatingTier = RATING_TIERS[0];
  let bestCount = rating.counts[best];
  for (const t of RATING_TIERS) {  // 高档先遍历，并列保留更高
    if (rating.counts[t] > bestCount) {
      best = t;
      bestCount = rating.counts[t];
    }
  }
  return bestCount > 0 ? best : null;
}
```

并列时取更高档：避免 1:1 平局反复横跳。

### 访客身份

不存用户身份。投票来源识别靠：

1. **客户端 localStorage**：key `vote:<generalId>` → 值为该用户投的档位。改票 = 覆盖。提交时同时发 `{ from?: tier, to: tier }`，服务端递减 `from`、递增 `to`。
2. **服务端 IP rate-limit**：复用 `packages/web/src/lib/ratelimit.ts`，限制单 IP `/api/ratings/*` 调用频率（10 次/分钟级别，与现有 admin 调用风格保持一致）。

不试图防"清浏览器再投"。该用量下不值得。

## 4. API

### `POST /api/ratings/:generalId`

**Body**:
```ts
{ from?: RatingTier; to: RatingTier }
```

**Behavior**：
1. 校验 `to ∈ RATING_TIERS`；`from` 若存在也校验。
2. 校验 `generalId` 真实存在（防止恶意请求往不存在的 ID 灌票）。
3. 读 `ratings:all` → 找到 / 初始化该 general 的 rating → `counts[from]--`（若有，`max(0, ...)`）、`counts[to]++` → `total = sum(counts)` → 写回。
4. `LPUSH` 一条 `VoteEvent` 到 `ratings:log:<today>` 当日 key。失败不阻塞主路径（事件日志是 best-effort，主聚合写成功就算成功）。
5. 触发列表页和详情页的 `revalidatePath`（沿用项目 `revalidate-map` 模式）。
6. 返回最新的 `{ counts, total, topTier }`。

**Error cases**：
- 400：`to` 非法；`from` 非法
- 404：generalId 不存在
- 429：rate-limit 触发

不需要鉴权。

读 API 不需要：列表页和详情页 SSR 直接通过 `entityStore.getRatings()` 拿数据。

## 5. UI

**通用样式准则**：所有新增控件必须延续现有视觉语言，不引入新调色板 / 新组件库 / 新交互范式。具体复用规则：

- 容器：用现有 `panel` / 卡片间距，与详情页其他 section 对齐
- 按钮：标签/单选风格抄 `HpFilter` —— `rounded-lg border px-3 py-2 text-xs font-semibold transition-all`，选中态用 `border-brand/50 bg-brand/10 text-brand`，未选中态用 `border-slate-200/80 bg-white/80 ...`，深色模式 token 沿用 `dark:border-slate-700/80 dark:bg-slate-900/80 ...`
- 标题 / label：用 `text-xs font-medium text-slate-500 dark:text-slate-400` 与 `HpFilter` 的"体力:" 一致
- 不引入新颜色 token：评级档位**不做**红/橙/黄/蓝/灰的硬编码彩虹色（之前草稿里那一组要撤）。视觉区分靠"选中态高亮"，5 个 tier 按钮本身用统一的 slate / brand 配色

### 详情页 `/generals/[id]`

在现有内容下方加一个"评级"区块（用 `panel` 包起来，与同页其他 section 风格一致）：

```
评级                          目前 4 票最多投：人上人

[ 夯 ] [ 顶级 ] [人上人] [ npc ] [拉完了]
                  ↑当前众数（沿用 HpFilter 选中态高亮）
                  自己投过的档位再叠一圈 brand-color ring（`ring-2 ring-brand/60`）
```

**Copy 决策**：标题行用「目前 N 票最多投：XXX」而不是「众数」/「平均」之类的统计名词。spec-challenge 指出 N=3–5 时"众数"措辞过重，这个口径如实承认"小样本下的最多人投"，不暗示统计意义上的代表性。

- 未评级时：右上角的票数行替换成 "暂无评级，来投一票"
- 5 个 tier 按钮一行，单元尺寸沿用 `HpFilter` 的 `px-3 py-2`；移动端宽度不够时 `flex-wrap` 换两行，不引入横向滚动
- 投票成功后乐观更新本地 counts + localStorage，不刷整页
- 提示文字（"点击投票，可随时改"）用 `text-xs text-slate-500 dark:text-slate-400`

### 列表页 `/generals`

在 `GeneralListClient` 的 toolbar 加一个 `RatingFilter`，与 `FactionFilter` / `HpFilter` 同级，**完全照抄 `HpFilter` 的结构**（label + 一排按钮）：

```
评级：[全部] [夯] [顶级] [人上人] [npc] [拉完了] [未评级]
```

- 单选（不是多选），默认"全部"
- 选中某档：只显示 `topTier === 选中档` 的武将
- 选中"未评级"：只显示 `total === 0` 的武将
- 结果计数沿用现有 `共 X 名武将（已筛选...）` 文案
- **卡片本身不变**：不加 badge、不加文字、不加颜色变化
- 注意：评级按钮多了一个（HpFilter 4 个，RatingFilter 7 个），移动端要确认横向不溢出 —— 必要时这一组可独占一行（用现有 toolbar 的 `flex-col gap-3 sm:flex-row` 节奏）

### Admin

不动。管理员表单不加评级编辑入口。

## 6. SSR 数据流

### `entityStore` 扩展

在 `packages/web/src/lib/entity-store.ts` 新增 `getRatings(): Promise<RatingsAll>` 方法。返回 KV 里的全表（KV 为空则返回 `{}`）。

不做 fallback to file —— 评级是纯运行时数据，没有种子文件可读。KV 不可用时返回 `{}`，等价于"全员未评级"。

### 列表页

```ts
const [generals, skills, ratings] = await Promise.all([
  entityStore.getGenerals(),
  entityStore.getSkills(),
  entityStore.getRatings(),
]);

const entries = generals.map((g) => ({
  ...existingFields,
  topTier: topTier(ratings[g.id]) ?? null,  // null = 未评级
}));
```

`GeneralEntry` 加 `topTier: RatingTier | null` 字段，仅供筛选使用。

### 详情页

```ts
const ratings = await entityStore.getRatings();
const rating = ratings[id] ?? null;
```

把 `rating` 透传给客户端组件，负责渲染按钮组和处理投票。

## 7. 文件清单（实现时）

修订（来自 spec-challenge）：评级是纯运行时数据，不进 `packages/data` 共享层；KV adapter 直接并入 `entity-store.ts`，不另起 store 文件。从原本 6 个新文件压到 4 个。

**新增**：
- `packages/web/src/lib/ratings.ts` — `RatingTier`, `RATING_TIERS`, `GeneralRating`, `VoteEvent`, `topTier()` —— 一站式 types + 纯函数
- `packages/web/src/app/api/ratings/[id]/route.ts` — POST 端点
- `packages/web/src/components/RatingPanel.tsx` — 详情页投票区块（client component）
- `packages/web/src/app/generals/components/RatingFilter.tsx` — 列表页筛选控件

**修改**：
- `packages/web/src/lib/entity-store.ts` — 加 `getRatings()` / `updateRating(id, from, to, ipHash)` —— 后者负责主表 RMW + append-only log 写
- `packages/web/src/app/generals/page.tsx` — Promise.all 加一项，entries 加 topTier
- `packages/web/src/app/generals/components/GeneralListClient.tsx` — 加 ratingFilter 状态 + 筛选逻辑
- `packages/web/src/app/generals/[id]/page.tsx` — 读 rating 传给 RatingPanel
- `packages/web/src/lib/revalidate-map.ts` — 加 ratings 路径

## 8. 测试

- `topTier()` 单测：空、单档、平局、全 0
- `ratings-store` 单测：read-modify-write、from 缺失、from 计数已为 0 时不下溢
- `/api/ratings/:id` route 单测：合法/非法 tier、不存在的 generalId、from/to 同档、rate-limit
- `RatingFilter` 行为：组件级测试（与 `HpFilter` 风格一致）
- 手动验证（mobile + desktop）：
  - 首次投票 / 改票 / 多次改票
  - 详情页刷新后众数和"自己投过的档"持久
  - 列表页"未评级"筛选只剩 0 票武将
  - 列表卡片不显示任何评级痕迹

## 9. 风险与权衡

| 风险 | 缓解 |
|---|---|
| 单 key 写并发覆盖 | 用量极小，read-modify-write 冲突概率近 0；不引入分布式锁 |
| 清浏览器再投 | 接受。规模决定了不值得做账号系统 |
| KV 不可用 | 列表页 `getRatings()` 返回 `{}`，全员显示为"未评级"。投票 POST 失败时用现有 toaster 提示"投票失败，请稍后重试"，按钮保持可点 |
| 票数极少时"众数"误导 | 接受。3–5 票级别加阈值反而让大多数武将都显示"未评级"，失去意义 |

## 10. Out of scope (future)

- 评级历史 / 时间序列
- 管理员后台看 raw counts 排查异常
- 单武将分布展开（柱状图）
- 多人聚会模式：一次性给多个武将打分
