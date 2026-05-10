# 牌局记录 (Session Recorder) — 设计稿 v1

**Date**: 2026-05-10
**Status**: Draft → Codex review → implement (no further user confirmation per directive)

## 1. 背景与目标

线下玩三国杀国战时，发牌后每个人会拿到 2 个武将。中途想看队友的武将技能时，挨个翻卡牌很麻烦。这个功能让一个人（任何路过的访客）把当前牌局填进 wiki，所有玩家打开同一个 URL 就能查任意人的武将详情。

**核心**：不是游戏引擎，只是一个共享在线"白板"。

## 2. 范围

### In-scope (v1)
- 全局**单一共享**牌局（一个 Redis key），任何访客读取
- **任何人可编辑**（无登录，B 方案）
- 玩家数 **2-8 可调**（默认 5）
- 每个玩家：可编辑名字 + 选 2 个武将
- 武将通过 typeahead 多选搜（全部 341 个池子）
- **全局去重**：同一武将不能出现在两个 slot 里
- 每个武将卡片可点击 → 跳 `/generals/[id]` 详情页
- **自动保存** + **轮询**：编辑时 debounce 500ms PUT；查看时每 10s 拉一次
- "重置"按钮：清空所有武将（保留玩家数 + 名字），二次确认
- "上次更新于 X 时间" 时间戳
- 顶栏导航加 "牌局" 链接

### Out-of-scope (v1)
- ❌ 随机抽将（用户明确不要）
- ❌ 多个并行牌局（只有一个 global）
- ❌ 历史记录（不存历史，新建即覆盖）
- ❌ 出牌/计分/任何游戏逻辑
- ❌ 房间号/团队码/权限
- ❌ 角色/势力分配（国战自由出势力，记录意义小）
- ❌ 实时 push（用 polling 不用 SSE/WebSocket）

## 3. 数据模型

**Redis key 设计**（per-entity 模式延续）：

| Key | Value |
|---|---|
| `session:current` | `{ playerCount: number, players: Player[], updatedAt: string }` |

```ts
interface Player {
  name: string;          // 1-50 chars, optional default "玩家N"
  generals: [string | null, string | null];  // 2 slots, null = 未填
}

interface Session {
  playerCount: number;   // 2-8
  players: Player[];     // length === playerCount
  updatedAt: string;     // ISO timestamp
}
```

默认值（KV 空时）：5 个空玩家，generals=[null,null]，名字 "玩家1"…"玩家5"。

**复用 entityStore**：在 `packages/web/src/lib/entity-store.ts` 加 `getSession()` / `putSession()`。

## 4. API 路由

| Method | Path | 行为 |
|---|---|---|
| GET | `/api/session` | 返回当前 session（无 auth）；缓存 no-store |
| PUT | `/api/session` | 全量替换；body 校验；写 Redis；返回新值。**无 auth**。 |

**校验**（在 `packages/web/src/lib/validators.ts` 加 `validateSessionInput`）：
- `playerCount` ∈ [2, 8]
- `players` 长度 === playerCount
- 每个 player.name 长度 ≤ 50
- 每个 player.generals 必须是 length-2 数组
- generals 里非 null 的总集合无重复
- 每个非 null generalId 必须存在（轻校验：`/^general_/` 即可，不去 Redis 验存在）
- body 大小受现有 `MAX_BODY_BYTES=50KB` 限制（已经在 auth-gate；session 不走 auth-gate，需要在 PUT handler 自己再做一次 body 大小检查）

无 auth ≠ 无防护：
- IP rate limit：`@upstash/ratelimit` slidingWindow(20, "1 m") 防止暴力扫
- 50KB 体积上限

## 5. UI 设计

### 5.1 新增页面：`/session`
路径 `packages/web/src/app/session/page.tsx`，client component（需要状态 + 轮询）。

**布局**（自上而下）：
1. **页头**：`牌局记录` 标题 + 副标题"任何人都能编辑，自动保存"
2. **控制栏**：
   - `玩家数: [2|3|4|5|6|7|8]` 数字下拉
   - `[重置牌局]` 按钮（红色 outline，点击展开 InlineConfirm）
   - 右侧 `已保存 · 02:30` （状态指示器：保存中 / 已保存 + 时间戳）
3. **玩家网格**（responsive grid，desktop 2 列、mobile 1 列）：
   - 每个 `<SessionPlayer>` 卡片：
     - 顶部：名字 input
     - 中部：2 个武将槽
       - 已选：渲染武将缩图卡（GeneralCard 风格） + 名字 + 势力 badge + 移除 ×
       - 未选：占位 + `选择武将` 按钮 → 弹 typeahead picker
     - 卡片可点击跳 `/generals/[id]`

### 5.2 顶栏导航
`packages/web/src/lib/site.ts` 加一项：
```ts
{ slug: "session", href: "/session", label: "牌局", ... }
```

### 5.3 武将选择器
复用 admin 模式的 `MultiSelect` 但简化为 single-select。新建 `<GeneralPicker>` 组件：搜索输入 + filtered list（去掉已被任意 slot 选过的 generals）。

### 5.4 自动保存逻辑
client-side：
- 任何 setState 触发 debounce(500ms) → PUT `/api/session`
- 状态机：`idle | saving | saved | error`
- "saved" 显示 "已保存 · HH:MM:SS"
- "error" 显示 "保存失败，重试中"，每 5s 重试

**冲突处理**：last-write-wins（无 ETag）。多人同时改 = 后写者胜出。可见但极少触发；hobbyist 接受。

### 5.5 轮询
- 页面 mount 后每 **10s** GET `/api/session`
- 如果 server 的 `updatedAt` 比本地 newer **且本地不是 saving 状态**：用 server 数据覆盖本地（防止"我正在编辑"被别人覆盖到一半）
- tab 切换可见时立刻拉一次

## 6. 错误处理

| 场景 | 行为 |
|---|---|
| Redis 读失败（GET） | 返回默认空 session（5 玩家） + 设 fallback flag → 顶栏 banner 提示 |
| Redis 写失败（PUT） | 502 + 客户端 toast "保存失败，10s 后重试" |
| 校验失败 | 422 + 字段错误（不应在正常 UI 流程出现，因为 UI 强制约束） |
| 体积超限 | 413 |
| 速率超限 | 429 |
| Player count 改小：超出的玩家被丢弃 | UI 弹 InlineConfirm "缩减到 N 人，玩家 N+1 起的将会被清掉" |
| Player count 改大：新增空玩家 | 直接加 |

## 7. 测试

- Unit: `validateSessionInput`（边界 + 重复 generalId + 长度）
- Unit: `entityStore.getSession()` / `putSession()` round-trip + fallback
- Integration: API routes（GET 默认 + GET 已存 + PUT 校验 + PUT 写 + 体积限）
- 手动烟测：开两个浏览器，一边改，另一边 10s 内看到

## 8. 实施步骤

1. `validators.ts` 加 `validateSessionInput` + 单测
2. `entity-store.ts` 加 `getSession` / `putSession` + 单测
3. `lib/ratelimit.ts` 加 `sessionPutLimiter` (20/min)
4. `app/api/session/route.ts` GET + PUT
5. `lib/site.ts` 加 `session` 导航项 + 集成测试
6. `app/session/page.tsx` 页面 shell（client component）
7. `components/session/SessionEditor.tsx` 主编辑器（含 polling、auto-save、控制栏）
8. `components/session/SessionPlayer.tsx` 单玩家卡片
9. `components/session/GeneralPicker.tsx` typeahead 选择器（去重 props）
10. `components/session/InlineConfirmReset.tsx` 复用 admin 的 InlineConfirm 处理"重置"和"缩减玩家数"
11. 部署 + 烟测

## 9. 风险

- **任何人可改** = 任何 bot/恶意用户也能改。**缓解**：rate limit；体积限；UI 简单文本不易引爆；最坏情况清空 Redis key 重来
- **轮询带宽**：每个查看者 10s 一次 GET，多人同时观看时 Upstash 命令数会涨。**缓解**：GET 路径加 30s edge cache（`Cache-Control: public, s-maxage=10, stale-while-revalidate=60`）— 但要注意：edge cache 会延迟 admin 改动可见。**取舍**：可见延迟最多 ~10s 是可接受的（这是个白板，不是聊天）
- **Tab 不可见时仍轮询**：不必要消耗。**缓解**：`document.visibilityState !== 'visible'` 时跳过轮询
