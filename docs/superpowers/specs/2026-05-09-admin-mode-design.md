# Admin 内联编辑模式 — 设计稿

**Date**: 2026-05-09
**Status**: Draft (awaiting user review)
**Scope**: 仅 Feature ①「管理员模式」。Feature ②「牌局记录」单独规格。

## 1. 背景与目标

`sgs-wiki` 是一个 Next.js 15 静态生成站，部署在 Vercel，所有内容（武将、卡牌、技能、FAQ）当前以 JSON 文件形式打包在 `packages/data/src/*.json`。

用户希望加入"管理员模式"，使少量受信管理员（1–2 人）能在线修改卡牌/武将/技能描述、增删改 FAQ，且改动**几秒内**对所有访客可见。无独立后端服务器、无 GitHub PR 流程、无草稿审批环节。

## 2. 范围

### In-scope（v1）
- 修改**已有**武将基础字段（HP、势力、珠联璧合搭档、image URL、designer、pack 等）
- 修改**已有**武将技能描述（`Skill.description`）及结构字段（type、timing、tags）
- 修改**已有**卡牌字段（description、suit、number、range 等）
- FAQ：增、删、改（包括将 FAQ 关联到武将/技能/卡牌）
- 单一共享密码登录、HTTP-only cookie session
- 「撤回上一版」（最近 10 版历史）

### Out-of-scope（v1）
- ❌ 新建武将 / 卡牌 / 技能（仅 FAQ 可新增）
- ❌ 图片上传（image URL 字段只允许编辑 URL 文本，不上传文件）
- ❌ Markdown 渲染（描述当纯文本 + 换行符处理）
- ❌ 多管理员账号 / 审计 author（统一记 "admin"）
- ❌ 草稿 / 预览 / 审批工作流
- ❌ Feature ② 牌局记录（独立规格）

## 3. 整体架构

```
[Visitor browser]
       ↓ HTTP
[Vercel CDN]  ← revalidatePath() invalidates here
       ↓ (miss)
[Next.js App on Vercel]  ←──────┐
       ↕ Route Handlers          │
[Vercel KV (Redis)]              │
       ↑                         │
[Admin browser] → POST /api/admin/* (cookie auth)
```

**核心组件**：
- **Vercel KV** — 唯一运行时数据源（包括内容、历史版本、session）
- **Next.js Route Handlers** (`/api/*`) — 后端逻辑
- **现有 SSG 页面** — 数据加载从 `import json` 改为 `await getKv(...)`，其余结构保留
- **内联编辑 UI** — admin 登录后，访客页面上自动显示铅笔图标和「+ FAQ」按钮
- **`scripts/seed-kv.ts`** — 一次性脚本，把当前 JSON 灌进 KV

**部署平台**：Vercel（已上线），使用 Vercel KV 免费档（30K 操作/月）。

## 4. 数据模型

### 4.1 KV 键设计

| Key | Value | 说明 |
|---|---|---|
| `content:generals` | `General[]`（JSON 数组） | 全部武将 |
| `content:cards` | `Card[]` | 全部卡牌 |
| `content:skills` | `Skill[]` | 全部技能 |
| `content:faqs` | `FAQ[]` | 全部 FAQ |
| `history:{type}:{id}` | `Array<{version, savedAt, value}>`（最近 10 版） | 单条目历史，用于撤回 |
| `session:{token}` | `{exp, createdAt}`（TTL 30 天） | admin session |

类型定义复用 `packages/data/src/types/`：`General`、`Card`、`Skill`、`FAQ`。

### 4.2 历史记录策略
- 每次保存某条目前，将当前值 push 到 `history:{type}:{id}`
- 历史数组上限 10，超出从队首丢弃（环形）
- 「撤回上一版」= history pop 最新 → 当作新值写回（同时把"被撤回前的版本"压回 history）

### 4.3 一次性 seed
- `scripts/seed-kv.ts` 读 `packages/data/src/*.json`，写入对应 `content:*` key
- 首次部署后手动跑一次（`pnpm seed-kv`，本地连 prod KV）
- 后续 JSON 文件保留作为**回退种子**（KV 挂时 visitor 读路径 fallback）

## 5. API 路由

| Method | Path | 行为 |
|---|---|---|
| POST | `/api/auth/login` | 接收 `{password}`；比对 env `ADMIN_PASSWORD`；生成 32 字节 token；写 `session:{token}`；返回 cookie；返回 200 |
| POST | `/api/auth/logout` | 删除 `session:{token}`；清 cookie |
| GET | `/api/auth/me` | 返回 `{authed: bool}`（前端用来判断是否渲染编辑按钮） |
| POST | `/api/admin/{type}/{id}` | 验 cookie；schema 校验；push history；写 content；调 `revalidatePath('/{type}/{id}')` 等；返回 200 + 新值 |
| POST | `/api/admin/{type}/{id}/revert` | 验 cookie；history pop；写当前；revalidate |
| POST | `/api/admin/faqs` | 新建 FAQ（验 cookie + 校验 + revalidate） |
| DELETE | `/api/admin/faqs/{id}` | 删 FAQ；revalidate 受影响页 |

**`{type}`** ∈ `generals | cards | skills | faqs`。

**revalidate 策略**（每次写都触发对应路径）：
- 改武将 X → revalidate `/generals`、`/generals/X`
- 改技能 Y → revalidate `/generals/{每个挂这个技能的武将}` + 全武将列表（如果列表展示了技能名）
- 改卡牌 → revalidate `/cards`
- 改 FAQ（增删改） → revalidate `/faq` + 关联到的 `/generals/{id}` 和 `/cards`（如果详情页显示相关 FAQ）

## 6. 认证

**模型**：单一共享密码（环境变量 `ADMIN_PASSWORD`）。

**登录流程**：
1. 用户访问 `/admin/login` → 表单输密码
2. POST 到 `/api/auth/login`
3. 服务端 `crypto.timingSafeEqual` 比对（防时序攻击；明文比对就行，不需要 hash）
4. 生成 `crypto.randomBytes(32).toString('hex')` 作为 token
5. KV 写 `session:{token}` (TTL 30 天)
6. 返回 `Set-Cookie: admin_session=<token>; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`
7. 重定向到首页

**鉴权**：所有 `/api/admin/*` 请求中间件先读 cookie → 查 `session:{token}` → 不存在/过期则 401。

**前端态**：visitor 页面调 `GET /api/auth/me` 一次（或 server-side 直接读 cookie），决定是否渲染编辑按钮。

## 7. UI 设计

**所有 visitor 路径不变**。admin 登录后，**同一套页面**多渲染一些编辑控件。

### 7.1 唯一新增页面：`/admin/login`
- 中央一个简单 form：密码输入框 + 「登录」按钮
- 登录成功跳首页
- 登录失败显示错误（密码错 / KV 不可达）

### 7.2 顶栏（admin 已登录时）
- 现有顶栏右侧加：`● 管理员模式 · 退出`
- 「退出」点击 → POST `/api/auth/logout` → 跳首页

### 7.3 武将详情页（`/generals/[id]`）
admin 登录后多渲染：
- 武将基础区右上角一个齿轮图标 → 点击展开"基础字段表单"（HP/势力/性别/pack/designer/image URL/perfectMatchPartners/...）
- 每个技能区块（描述、type、timing、tags）右上角一个铅笔 → 就地展开技能编辑表单
- 「相关 FAQ」区块底部：「+ 为本武将添加 FAQ」按钮（点击展开新建 FAQ 表单，relatedGeneralIds 自动填本武将 id）

### 7.4 卡牌页（`/cards`）
- 每张卡牌（或每个 card 详情区块）右上一个铅笔 → 就地展开卡牌编辑表单
- 关联 FAQ 区块底部「+ 为本卡牌添加 FAQ」按钮

### 7.5 FAQ 列表页（`/faq`）
- 顶部加「+ 新建 FAQ」按钮（点击展开通用 FAQ 表单）
- 每条 FAQ 行右侧 admin-only：铅笔（编辑） + 红色"删除"图标（删前二次确认）

### 7.6 编辑表单原则（typed forms，不暴露 JSON）

| 字段类型 | 控件 |
|---|---|
| 字符串短文本 | `<input type="text">` |
| 字符串多行 | `<textarea>` |
| 数字（HP、number 等） | `<input type="number">` + min/max |
| 枚举（faction、suit、type 等） | `<select>` + 全部合法值 |
| boolean（paired、isEmperor） | `<input type="checkbox">` |
| 关联多选（skills、relatedGeneralIds 等） | 简单 multi-select（typeahead 搜索 + 已选 chips） |
| ID 数组的 string 数组（pairedNames） | 标签输入框（回车加 chip） |

每个就地表单底部：`保存 / 取消 / 撤回上一版（disabled if no history）`。FAQ 详情表单额外有红色「删除」按钮。

保存成功 → toast「已保存」 → 表单收起 → 页面内容自动反映新值（下一次访问该路径 CDN 已失效）。

### 7.7 视觉风格
- 编辑控件复用现有 Tailwind 设计语言（vermillion seal / xuan paper），不引入新 UI 库
- 铅笔/齿轮/+ 按钮风格统一：小尺寸、淡灰色，hover 时变 vermillion

## 8. 错误处理与边界

| 场景 | 行为 |
|---|---|
| KV 读失败（visitor 路径） | fallback 读打包的 JSON 种子；不中断渲染 |
| KV 读失败（admin 编辑前） | 表单显示「无法加载，请刷新」 |
| KV 写失败 | 表单不收起，toast 报错，按钮可重试 |
| 校验失败（422） | 表单字段下方红字提示哪一项不合规 |
| 认证失效（401） | 前端跳 `/admin/login` |
| 并发编辑同字段 | last-write-wins，不做 ETag；可通过撤回恢复 |
| 撤回时 history 为空 | 按钮 disable |

## 9. 测试策略

| 层级 | 内容 |
|---|---|
| Unit | KV adapter（read/write/history push/revert/seed）；schema validators（per type，覆盖 enum/range/必填） |
| Integration | API Route Handlers（mock KV；验证 auth gate、校验、revalidate 调用、history 写入） |
| E2E（Playwright，已有） | 登录 → 改技能描述 → 验证页面更新 → 撤回 → 验证原内容 → 退出 → 验证铅笔消失 |
| 手动烟测（部署后） | 4 类型各编辑一条；撤回；新增 FAQ；删 FAQ；admin/visitor 切换 |

## 10. 实施步骤

1. 装 `@vercel/kv` 依赖
2. 实现 `packages/web/src/lib/kv.ts`（读/写/history adapter，含 fallback）
3. 实现 schema validators（`packages/web/src/lib/validators.ts`，复用现有 type）
4. 实现 Route Handlers（auth + admin CRUD）
5. 写 `scripts/seed-kv.ts` 并 `pnpm seed-kv` 命令
6. Vercel dashboard：开 KV、绑定到项目、设 env `ADMIN_PASSWORD`
7. 本地连 prod KV 跑一次 seed
8. 重构现有 SSG 页面：`@sgs/data` 直接 import → 改为 `await getKv(...)`，所有 page 加 `export const revalidate = false`（依赖 on-demand revalidate）
9. 实现 `/admin/login` 页
10. 现有页面加铅笔 / 齿轮 / + FAQ 按钮（基于 cookie 状态条件渲染）
11. 实现就地编辑表单组件（每类型一个）
12. 顶栏加 admin 状态指示 + 退出
13. 写测试（unit + integration + E2E）
14. 部署 Vercel + 烟测

## 11. 风险与开放问题

- **KV 数据为空**（首次部署时）：seed 脚本必须在第一个用户访问之前跑完，否则 visitor 看到空站。**缓解**：visitor 路径 fallback 到 JSON 种子；seed 失败不上线。
- **revalidate 漏路径**：如果某个详情页依赖了某个改动但 revalidate 没列出，会显示旧数据直到 CDN 自然过期。**缓解**：写一个集中的"哪些 path 依赖哪些 type"的映射表，所有 admin 写都查它。
- **多 admin 强制下线**：单一密码改了之后老 session 仍有效（直到 KV TTL 过期）。**缓解**：v1 不处理；如需要可加「强制全部下线」按钮（清所有 `session:*`）。
- **KV 免费额度**：30K 操作/月。读路径靠 ISR 缓存，正常一天 ~10–100 写、读量取决于 revalidate 触发频率。预估远低于额度，但需观察。
