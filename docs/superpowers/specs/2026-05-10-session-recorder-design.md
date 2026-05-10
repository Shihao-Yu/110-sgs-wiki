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

**Redis key 设计**：

| Key | Value |
|---|---|
| `session:current` | `{ revision: number, playerCount: number, players: Player[], updatedAt: string }` |

```ts
interface Player {
  name: string;          // 1-50 chars, optional default "玩家N"
  generals: [string | null, string | null];  // 2 slots, null = 未填
}

interface Session {
  revision: number;      // monotonic, +1 on every successful PUT (CAS guard)
  playerCount: number;   // 2-8
  players: Player[];     // length === playerCount
  updatedAt: string;     // ISO timestamp
}
```

默认值（KV 空时）：`{ revision: 0, playerCount: 5, players: [...5 empty], updatedAt: now() }`。

**单独的 session adapter**（不复用 `entityStore` 的读 fallback 语义）：在 `packages/web/src/lib/session-store.ts` 实现 `getSession()` / `putSession()`. 关键差异：
- **读失败抛出**，不静默返回 bundled JSON。session 没有"种子"概念，回退到空白会被随后的 PUT 覆盖真数据。
- **写实施 CAS**：`putSession({ ifRevision, value })` 用 Upstash `eval` 原子 read-modify-write，或简化为乐观读取 → 比对 → 写入（小并发场景够用）。
- 都加 3s 超时（沿用 entityStore 的 `withTimeout`）。

## 4. API 路由

| Method | Path | 行为 |
|---|---|---|
| GET | `/api/session` | 返回当前 session（无 auth）；`Cache-Control: no-store`；Redis 不可用 → 503 |
| PUT | `/api/session` | 全量替换；body 校验；CAS（必须传 `ifRevision`）；写 Redis；返回新值（含新 revision）。**无 auth**。`409` 表示 revision stale（客户端要 GET + merge + 重试） |

**校验**（在 `packages/web/src/lib/validators.ts` 加 `validateSessionInput`）：
- `playerCount` ∈ [2, 8]
- `players` 长度 === playerCount
- 每个 player.name 长度 ≤ 50（非空字符串；可允许空字符串，UI 显示默认"玩家N"）
- 每个 player.generals 必须是 length-2 数组
- generals 里非 null 的总集合**全局无重复**（同一武将不能两人都用）
- 每个非 null generalId 必须匹配 `/^general_/`（轻校验，不查 Redis）
- `ifRevision` 是非负整数

无 auth ≠ 无防护：
- 专用 session 限速器（不复用 login/sync）：
  - **写**：`sessionWriteLimiter` slidingWindow(60, "1 m") / IP — 自动保存 500ms debounce 下，最快每秒 2 个 PUT，60/分钟容易够正常使用
  - **读**：`sessionReadLimiter` slidingWindow(120, "1 m") / IP — 5s 轮询单 tab = 12/分钟，10 个 tab = 120/分钟刚好
- 50KB body 上限（PUT handler 自己检查）

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

### 5.4 自动保存逻辑（带 CAS）
client-side：
- 任何 setState 触发 debounce(500ms) → PUT `/api/session` body `{ ...session, ifRevision: localRevision }`
- 状态机：`idle | saving | saved | conflict | error`
- 200 → 用响应替换本地 state（拿到新 revision）
- 409 (conflict) → 立刻 GET 拿最新，应用到本地（覆盖未保存的本地改动），toast "另一人刚改过，已加载最新版"
- 5xx (error) → "保存失败，3s 后重试"，3s 后单次重试

**为什么 CAS 优于 LWW**：单 tab 没事，但用户描述"全局共享" + 桌上多人 = 真有可能两人同开页面同时填一个空 slot。CAS 防止"我填好了你的版本一覆盖把我刚填的清掉"。代价：偶尔 conflict 时本地改动被覆盖（但 toast 提醒，立刻看到最新）。

### 5.5 轮询
- 页面 mount 后每 **5s** GET `/api/session`
- `document.visibilityState !== 'visible'` 时跳过
- tab 切换可见时立刻拉一次
- 如果 server `revision` > local AND 本地不是 saving：用 server 替换

## 6. 错误处理

| 场景 | 行为 |
|---|---|
| Redis 读失败（GET） | **503**，UI 显示 "数据暂不可用，刷新重试"。不返回伪造的默认值（避免 stale 覆盖） |
| Redis 写失败（PUT） | 502 + 客户端 toast "保存失败，3s 后重试"，自动重试一次 |
| 校验失败 | 422 + 字段错误（UI 应在前端先拦） |
| revision 冲突 | 409 + 客户端拉最新覆盖本地 + toast 提示 |
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

1. `validators.ts` 加 `validateSessionInput`（含 ifRevision、duplicate 检查）+ 单测
2. `lib/session-store.ts`（新文件，不复用 entity-store 读 fallback）`getSession` / `putSession`（CAS）+ 单测
3. `lib/ratelimit.ts` 加 `sessionWriteLimiter` (60/m) + `sessionReadLimiter` (120/m)
4. `app/api/session/route.ts` GET + PUT (CAS、no-store、限速、503 on Redis 失败)
5. `lib/site.ts` 加 `session` 导航项
6. `app/session/page.tsx` 页面 shell（server component 渲染 shell + 加载初始 session 数据）
7. `components/session/SessionEditor.tsx` 主编辑器（client component，polling + auto-save + CAS 处理）
8. `components/session/SessionPlayer.tsx` 单玩家卡片（mobile 折叠态）
9. `components/session/GeneralPicker.tsx` typeahead single-select（接受 excludedIds prop）
10. 部署 + 双 tab 烟测（CAS conflict 路径）

## 9. 风险

- **任何人可改** = 任何 bot/恶意用户也能改。**缓解**：rate limit；体积限；UI 简单文本不易引爆；最坏情况清空 Redis key 重来
- **轮询带宽**：每个查看者 10s 一次 GET，多人同时观看时 Upstash 命令数会涨。**缓解**：GET 路径加 30s edge cache（`Cache-Control: public, s-maxage=10, stale-while-revalidate=60`）— 但要注意：edge cache 会延迟 admin 改动可见。**取舍**：可见延迟最多 ~10s 是可接受的（这是个白板，不是聊天）
- **Tab 不可见时仍轮询**：不必要消耗。**缓解**：`document.visibilityState !== 'visible'` 时跳过轮询
