# Admin 内联编辑模式 — 设计稿

**Date**: 2026-05-09
**Status**: Draft (post-codex review revision)
**Scope**: 仅 Feature ①「管理员模式」v1。Feature ②「牌局记录」单独规格。

## 1. 背景与目标

`sgs-wiki` 是一个 Next.js 15 静态生成站，部署在 Vercel，所有内容（武将、卡牌、技能、FAQ）当前以 JSON 文件形式打包在 `packages/data/src/*.json`。

用户是三国杀国战爱好者，希望加入"管理员模式"，使少量受信管理员（1–2 人）能在线修改武将技能描述/字段、增删改 FAQ，且改动**几秒内**对所有访客可见。无独立后端服务器、无 GitHub PR 流程、无草稿审批环节。

定位：**hobbyist-grade**，轻维护、低成本、快速上线、可迭代。

## 2. 范围

### In-scope（v1）
- 修改**已有**武将基础字段（HP、势力、珠联璧合搭档、image URL、designer、pack、isEmperor、gender 等）
- 修改**已有**武将技能描述（`Skill.description`）及结构字段（type、timing、tags）—— 通过武将详情页内的技能区块编辑
- FAQ：增、删、改（包括将 FAQ 关联到武将）
- 单一共享密码登录、签名 HTTP-only cookie session

### Out-of-scope（v1，明确不做）
- ❌ **卡牌编辑**：因为 `cards/page.tsx` 把 146 张原始牌按名字去重聚合成 49 个 summary（杀 x30、闪 x21），"编辑哪一张杀"语义不清。延后到 v2，需要先重设计卡牌编辑单位。
- ❌ **将 FAQ 关联到卡牌/技能**：保留 `relatedSkillIds`/`relatedCardIds` 字段不在 v1 编辑器里暴露，先支持最常用的 `relatedGeneralIds`
- ❌ 新建武将 / 卡牌 / 技能（仅 FAQ 可新增）
- ❌ 图片上传（image URL 字段允许编辑 URL 文本，不上传文件）
- ❌ Markdown 渲染（描述当纯文本 + 换行符处理）
- ❌ 多管理员账号 / 审计 author / 撤回历史（v1 简单 last-write-wins，无 history；详见 §11）
- ❌ 草稿 / 预览 / 审批工作流
- ❌ 搜索索引实时更新（首页搜索框结果会延迟到下一次部署才反映改动；详见 §11）
- ❌ Feature ② 牌局记录（独立规格）

### 关于「撤回上一版」
v1 直接砍掉。原因：history 增加 KV 读写、需要 UI、需要 KV key schema 复杂化；hobbyist 场景下"误改"概率低，恢复手段是"再改一次回来"。如果实际使用后频繁误改，v2 再加。

## 3. 整体架构

```
[Visitor browser]
       ↓ HTTP
[Vercel CDN]  ← revalidatePath() invalidates here
       ↓ (miss)
[Next.js App on Vercel]  ←──────┐
       ↕ Route Handlers          │
[Upstash Redis]                  │
       ↑                         │
[Admin browser] → POST /api/admin/* (signed cookie auth)
```

**核心组件**：
- **Upstash Redis**（通过 Vercel Marketplace 接）—— 唯一运行时数据源
- **Next.js Route Handlers** (`/api/*`) —— 后端逻辑
- **现有 SSG 页面** —— 数据加载从 `import json` 改为 `await getRedis(...)`，其余结构保留
- **内联编辑 UI** —— admin 登录后，访客页面上自动显示铅笔图标和「+ FAQ」按钮
- **`scripts/seed-redis.ts`** —— 一次性脚本，把当前 JSON 灌进 Redis

**部署平台**：Vercel（已上线），Upstash Redis 免费档（10K 命令/天，256MB 容量；对本场景容量绰绰有余、命令数依赖 ISR 缓存命中率）。

**关于 Vercel KV**：Vercel KV 已不再为新项目提供，目前 Vercel 推荐 Marketplace 接 Upstash Redis。本设计直接采用 Upstash。

## 4. 数据模型

### 4.1 Redis 键设计（per-entity，避免整数组 blob 写入冲突）

| Key 模式 | Value | 说明 |
|---|---|---|
| `general:{id}` | `General`（JSON） | 单个武将完整对象 |
| `generals:index` | `string[]`（JSON 数组，所有 generalId） | 用于批量列表读取（页面 + 路由参数） |
| `skill:{id}` | `Skill`（JSON） | 单个技能 |
| `skills:by-general:{generalId}` | `string[]`（JSON，技能 id 列表） | 反查关系（武将详情页用，避免扫所有 skill） |
| `faq:{id}` | `FAQ`（JSON） | 单个 FAQ |
| `faqs:index` | `string[]`（JSON 数组，所有 faqId） | FAQ 列表用 |

注：v1 不维护卡牌的 Redis key（卡牌不在编辑范围）。卡牌仍走现有 `cards.json`。

### 4.2 一次性 seed 脚本
- `scripts/seed-redis.ts` 读 `packages/data/src/generals.json`、`skills.json`、`faq.json`，写入对应 key + 维护 index/反查表
- 首次部署后手动跑一次（`pnpm seed-redis`，本地连 prod Upstash）
- **重要**：必须在第一个 visitor 访问之前完成 seed，否则页面会读到空值

### 4.3 不做 JSON 运行时 fallback
Codex 指出 KV+JSON 双源会"复活旧内容"（split-brain）。v1 决定：
- visitor 路径只读 Redis
- Redis 不可达 → 页面渲染错误状态（`error.tsx` 边界），让运维知道
- JSON 文件留存只作为**初始种子**和**人工恢复手段**（紧急情况下重跑 seed）

### 4.4 搜索索引（已知限制）
现有 `packages/web/src/components/search/search-data.ts` 在编译时把 JSON 打进客户端 bundle。v1 **不重写搜索**：
- 编辑生效后，详情页/列表页通过 revalidate 几秒内刷新
- **首页搜索框结果**仍反映 build 时的状态，要等到下一次部署（任何 commit 触发或手动 redeploy）才更新
- 这个限制写到 admin UI 的提示里（编辑保存后 toast 加一行小字「搜索结果将在下次部署后更新」）
- v2 可重写为 Redis 拉数据（要做的话需要客户端 fetch + 缓存）

## 5. API 路由

| Method | Path | 行为 |
|---|---|---|
| POST | `/api/auth/login` | 接收 `{password}`；`crypto.timingSafeEqual` 比对 env `ADMIN_PASSWORD`；签发 HMAC 签名 cookie；返回 200 |
| POST | `/api/auth/logout` | 清 cookie |
| GET | `/api/auth/me` | 验签 cookie；返回 `{authed: bool}` |
| PATCH | `/api/admin/generals/{id}` | 验签；schema 校验；写 `general:{id}`；调 `revalidatePath('/generals')` + `revalidatePath('/generals/{id}')` |
| PATCH | `/api/admin/skills/{id}` | 验签；校验；写 `skill:{id}`；查 `skills:by-general:*` 反查表 → revalidate 所有用到该技能的武将详情页 + `/generals` |
| POST | `/api/admin/faqs` | 验签；校验；生成新 id（`faq_${nanoid(8)}`）；写 `faq:{id}` + push 到 `faqs:index`；revalidate `/faq` + 关联的 `/generals/{id}` |
| PATCH | `/api/admin/faqs/{id}` | 验签；校验；写 `faq:{id}`；revalidate 同上 |
| DELETE | `/api/admin/faqs/{id}` | 验签；删 `faq:{id}` + 从 `faqs:index` 移除；revalidate 同上 |

**revalidate 映射表**（集中放在 `packages/web/src/lib/revalidate-map.ts`，所有 admin 写都查它）：

```ts
type Mutation = { type: 'general' | 'skill' | 'faq'; id: string; oldValue?: any; newValue?: any };
function pathsToRevalidate(m: Mutation): string[] { ... }
```

考虑 oldValue 是为了：FAQ 改了 `relatedGeneralIds` 时，新旧两套关联武将都要 revalidate。

## 6. 认证

**模型**：单一共享密码（环境变量 `ADMIN_PASSWORD`） + 签名 cookie（无服务端 session 存储）。

**登录流程**：
1. `/admin/login` 表单输密码
2. POST `/api/auth/login`
3. 服务端 `crypto.timingSafeEqual(input, process.env.ADMIN_PASSWORD)` 比对
4. 比对通过 → 用 env `SESSION_SECRET`（HMAC key）签发 cookie payload `{exp: now + 30d}`
5. cookie 格式：`base64(payload).hexHmac(payload, SESSION_SECRET)`
6. 返回 `Set-Cookie: admin_session=...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`

**鉴权**：所有 `/api/admin/*` 中间件读 cookie → 拆分 payload + signature → 验签 + 检查 exp → 不通过则 401。无需 Redis 查询。

**前端态**：
- 普通详情页**默认不在 server 渲染时检查 cookie**（保持静态可缓存）
- admin chrome（铅笔/齿轮/+ 按钮）由一个 client component `<AdminAffordances>` 渲染，挂载后调 `GET /api/auth/me` → `{authed: true}` → 就显示编辑按钮
- 这避免把 admin cookie 检测拖进 SSG 缓存路径

## 7. UI 设计

**所有 visitor 路径不变**。admin 登录后，**同一套页面**通过 client-side 检测多渲染编辑控件。

### 7.1 唯一新增页面：`/admin/login`
- 中央简单 form：密码输入 + 「登录」
- 登录成功跳首页（`/`）
- 登录失败显示错误

### 7.2 顶栏（admin 已登录时）
- `<AdminAffordances>` 客户端组件挂载后，在顶栏右侧渲染：`● 管理员模式 · 退出`
- 「退出」 → POST `/api/auth/logout` → 跳首页

### 7.3 武将详情页（`/generals/[id]`，admin 视图新增）
- 武将基础信息区右上角一个齿轮 → 点击就地展开"基础字段编辑表单"
- 每个技能区块右上角一个铅笔 → 就地展开"技能编辑表单"
- 「相关 FAQ」区块底部：「+ 为本武将添加 FAQ」按钮 → 展开新建 FAQ 表单（`relatedGeneralIds` 自动填本武将 id）
- 每个相关 FAQ 行边上：铅笔（编辑） + 红色删除（带二次确认）

### 7.4 FAQ 列表页（`/faq`，admin 视图新增）
- 顶部「+ 新建 FAQ」按钮
- 每条 FAQ 边上：铅笔（编辑）+ 红色删除（带二次确认）

### 7.5 编辑表单原则（typed forms，不暴露 JSON）

| 字段类型 | 控件 |
|---|---|
| 字符串短文本 | `<input type="text">` |
| 字符串多行（description / answer） | `<textarea>` |
| 数字（HP） | `<input type="number">` + min/max |
| 枚举（faction、skill type 等） | `<select>` + 全部合法值 |
| boolean（paired、isEmperor） | `<input type="checkbox">` |
| 关联多选（perfectMatchPartners、relatedGeneralIds） | 简易 multi-select（typeahead + chips） |
| 字符串数组（pairedNames、tags、timing） | 标签输入框（回车加 chip） |

每个就地表单底部：`保存 / 取消`。FAQ 编辑表单额外有红色「删除」按钮。

保存成功 → toast「已保存」+ 「搜索结果将在下次部署后更新」（仅当编辑会影响搜索时显示） → 表单收起 → 页面 server component 重新渲染（revalidate 已触发）。

### 7.6 视觉风格
复用现有 Tailwind 设计语言（xuan paper / vermillion seal）。铅笔/齿轮/+ 按钮：小尺寸、淡灰色，hover 时变 vermillion。不引入新 UI 库。

## 8. 错误处理与边界

| 场景 | 行为 |
|---|---|
| Redis 读失败（visitor 路径） | 页面渲染 `error.tsx` 提示「数据暂不可用」；不 fallback JSON（避免显示陈旧内容） |
| Redis 读失败（admin 编辑前） | 表单显示「无法加载，请刷新」 |
| Redis 写失败 | 表单不收起，toast 报错，按钮可重试 |
| Schema 校验失败（422） | 表单字段下方红字提示哪一项不合规 |
| 认证失效（401） | 前端跳 `/admin/login` |
| 并发编辑同字段 | last-write-wins；2 admin 场景冲突极少 |

## 9. 测试策略

| 层级 | 内容 |
|---|---|
| Unit | Redis adapter（read/write/index 维护）；schema validators（per type，覆盖 enum/range/必填）；HMAC sign/verify |
| Integration | API Route Handlers（mock Redis；验证 auth gate、校验、revalidate 调用） |
| Manual smoke（部署后） | 登录 → 改技能描述 → 验证武将页更新 → 新建 FAQ → 验证 FAQ 列表 + 关联武将页更新 → 删 FAQ → 退出 → 验证编辑控件消失 |

注：项目当前**未配置 Playwright**（仓库有 `.playwright-cli/` 缓存目录但无 config/test）。E2E 不作为 v1 必交付，烟测靠手动覆盖。

## 10. 实施步骤

1. 装 `@upstash/redis` 依赖
2. Vercel dashboard：Marketplace 添加 Upstash Redis 集成 → 自动注入连接环境变量
3. 设环境变量 `ADMIN_PASSWORD` 和 `SESSION_SECRET`（32 字节随机 hex）到 Vercel
4. 实现 `packages/web/src/lib/redis.ts`（read/write adapter，含 index 维护）
5. 实现 schema validators（`packages/web/src/lib/validators.ts`，复用 `@sgs/data` types）
6. 实现 cookie 签名工具（`packages/web/src/lib/auth.ts`，HMAC sign/verify）
7. 实现 Route Handlers（auth + admin CRUD）
8. 实现 `revalidate-map.ts`
9. 写 `scripts/seed-redis.ts` + `pnpm seed-redis` 命令
10. 本地连 prod Upstash 跑一次 seed（**部署前必做**）
11. 重构 `/generals/[id]` 与 `/generals` 的数据加载：`import @sgs/data` → `await getRedis(...)`
12. 重构 `/faq` 数据加载同上
13. 实现 `/admin/login` 单页
14. 实现 `<AdminAffordances>` client component（顶栏）+ 各编辑表单组件（武将基础 / 技能 / FAQ）
15. 写 unit + integration 测试
16. 部署 Vercel + 手动烟测

## 11. 风险与开放问题

- **Seed 时机**：必须在首个 visitor 访问之前跑完 seed，否则站点 5xx。**缓解**：先在 prod 部署 admin 路由前完成 seed；用 redis CLI 验证 key 已写入；再开放 visitor 流量（v1 无流量切换需求，但仍按"先 seed 再上线"顺序操作）。
- **revalidate 漏路径**：技能 X 改了，但忘了 revalidate 引用该技能的武将页。**缓解**：`revalidate-map.ts` 集中映射 + `skills:by-general:*` 反查表。如有遗漏，CDN 也会自然过期（默认值取决于 Next.js cache config，v1 接受最长几小时延迟兜底）。
- **搜索索引滞后**（已知限制）：详情页能秒级刷新，但首页搜索框反映 build 时数据。**缓解**：编辑后 toast 提示；管理员心智模型上接受"搜索是 build-time index"；v2 重写。
- **Upstash 免费额度**：10K 命令/天。读量取决于 ISR 缓存命中率，正常应远低于；写量微小。**缓解**：监控 Upstash dashboard；若超额可付费升级或加 in-memory cache 层。
- **冷启动**：Redis 第一次连接可能 100-300ms。**缓解**：Upstash 全球边缘 + Vercel function 同区域，正常无感；最坏情况页面 TTFB 多几百毫秒一次。
- **Session 强制失效**：单一密码改了之后，老 cookie 仍有效到 30 天 exp。**缓解**：v1 不处理；如有泄漏需求可加 `SESSION_GENERATION` 环境变量参与签名，重置时 bump 它即可使所有老 cookie 失效。
