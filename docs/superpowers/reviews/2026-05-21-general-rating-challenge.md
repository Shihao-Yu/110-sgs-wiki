# Strategic Challenge Report: 武将评级 (General Rating) v1

**Date**: 2026-05-21
**Spec**: `docs/superpowers/specs/2026-05-21-general-rating-design.md`
**Reviewer lenses**: first-principles, problem-worth, future-blindspots, simplicity

## Overall Assessment: **PROCEED WITH MINOR CHANGES**

四个角度一致认为这是一份合身的设计稿（SOUND / SOUND / SOUND / CONCERNS-but-not-fundamental）。没有一个 agent 说要 RETHINK。共同点都集中在两件事上：(1) 低样本下的「众数」措辞过重，(2) 几个能省的文件/抽象可以直接砍掉。其余多数发现属于"知道就好"，不需要进 v1。

## The Problem Statement Test

**What the spec says we're solving:**
> 用户对"这个武将到底强不强"完全没有共识入口

**What we're actually solving (first-principles decomposition):**
> 社区想要一个低摩擦、能跟客观数据并列展示的「集体观点摘要」

**Gap:** 不大但真实存在 —— "投票汇总" 是这个摘要的一种形态，但在 3–5 票级别"众数"这个统计量并不能像它听起来那么权威。这不是要换设计，是要换措辞。

## Challenge Summary

| Lens | Verdict | Key Finding |
|------|---------|-------------|
| First Principles | ⚠️ CONCERNS | "众数"在 N=3-5 时是"最后投票的人 33% 概率翻盘"，UI 用词偏重 |
| Problem Worth | ✅ SOUND | 2-3 工程日，hobby 项目 ROI 合理；同样建议软化"众数"措辞 |
| Future Blindspots | ✅ SOUND | 唯一硬不可逆决定：丢弃投票流（不存事件）；其余风险都能后修 |
| Simplicity | ✅ SOUND | 6 个新文件能压成 4 个（无损） |

## 🔴 Fundamental Concerns

无。没有一项发现挑战"该不该做"。

## 🟡 Strategic Risks (建议进 v1 处理)

### 1. "众数"措辞偏重（两个 lens 同时点名）

低样本下，"人上人 · 4 票" 看起来像权威结论，但其实"4 票里 2 票投了人上人"也长这样。**改一个 copy 字段就行**：

- 现有：`评级：人上人 · 4 票`
- 改为：`目前 4 票最多投：人上人`（或类似"目前/最近/4 人投票中最多投"的口径）

UI 不动，按钮组保持原样高亮，只改标题行 copy。零成本。

### 2. 文件数能压缩（simplicity lens）

Spec 里 6 个新文件能压到 4 个：

- ❌ `packages/data/src/types/rating.ts` —— 评级是运行时数据，不进 JSON 不进 build script，没必要放 `packages/data`。直接放 `packages/web/src/lib/ratings.ts`。
- ❌ `packages/web/src/lib/ratings-store.ts` —— Spec 自己也说"也可放进 entity-store.ts"，就放进去，跟 `getGenerals` / `getSkills` 一致。

Plan 写出来直接按 4 文件版本。

### 3. 投票流不可逆（future-blindspots lens，需要决策）

**唯一一个 "now or never" 的设计选择**。当前 spec 只存 counts 不存事件 ——

- 利：简单、payload 小、零额外写入
- 弊：未来想做"按时间过滤"、"补丁后重置"、"检测刷票"全部不可能

如果想保留这扇门，**v1 加一行 KV 写**就够了：每次 POST 同时往 `ratings:log:YYYY-MM-DD` 推一条 `{generalId, from, to, ts, ip_hash}`。读端 v1 完全不用。

要不要做，看你倾向。

## 🟢 Noted but Acceptable

- 单 KV key 写并发：在 3-5 票/武将的总量下竞争概率约等于 0
- 清浏览器再投：spec 已承认，hobby 规模下不值得做账号系统
- 卡片不显示 + 列表可筛选的「黑盒」张力：你已确认要这个 trade-off
- 5 个 tier 标签写死类型：未来加一档不破坏存量数据，重命名/重排会破，但目前不在视野内

## Assumptions That Need Validation

简单的 sanity check，在 plan 阶段一次性回答：

1. `HpFilter` 是单选 ——「完全照抄」才成立
2. `revalidate-map` 支持注册新路径 —— spec 假设可以
3. `lib/ratelimit.ts` 能接受非 admin 路由的 key —— spec 写"复用"，需要确认 API

这三个 plan 阶段读一次相关文件就能确认，不是真风险，只是 spec 里默认了。

## The "What If" Scenarios

| 场景 | 当前 spec 应对 | 我的评估 |
|------|------|------|
| 突然被知名社区转发，单日 100x 流量 | 单 key RMW 在并发写下会丢票 | 概率低、即便发生也不致命；不在 v1 解决 |
| 三国杀打补丁，30 个武将强弱重排 | 累积票数固化旧 meta | 后续可加 `version` 字段；v1 不阻塞 |
| 单人脚本/换 IP 刷票 | rate-limit 按 IP，会被绕过 | 出现后再加 admin 视图回查；v1 不阻塞 |

## Alternative Approaches Considered

四个 lens 都试过提替代方案，没有一个比当前 spec 显著更优：

- **Admin-curated tier + 公共讨论入口**：和 wiki 编辑口吻一致，但失去"集体智慧"原意 —— 用户原本就选了访客投票
- **Discord 投票 / Google Form**：摩擦更大，且不能在 wiki 内展示
- **3 档表情反应 (👍/😐/👎)**：丢掉了夯/拉完了的本地化趣味 —— 不可接受

结论：保留访客投票 + 5 tier，不换方向。

## Recommendation

**直接进 writing-plans**，但 plan 里要把以下三条作为 spec 的修订项加进去：

1. **Copy 软化**：标题行从"众数"措辞改为"目前 N 票最多投：XXX"
2. **文件压缩**：删掉 `packages/data/src/types/rating.ts` 和 `packages/web/src/lib/ratings-store.ts` 计划项，全部归到 `packages/web/src/lib/ratings.ts` + `entity-store.ts`
3. **投票流问题**：**需要你决策** —— 加一行 append-only log？还是接受"未来永远不能回溯"？

前两条我可以直接在 plan 里落地。第 3 条想问你一下。
