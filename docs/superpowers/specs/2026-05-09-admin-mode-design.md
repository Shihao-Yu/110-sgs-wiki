# Admin 内联编辑模式 — 设计稿

**Date**: 2026-05-09 (last revised: 2026-05-10, post spec-challenge)
**Status**: Approved (awaiting implementation plan)
**Scope**: 仅 Feature ①「管理员模式」v1。Feature ②「牌局记录」单独规格。

## 1. 背景与目标

`sgs-wiki` 是一个 Next.js 15 静态生成站，部署在 Vercel，所有内容（武将、卡牌、技能、FAQ）当前以 JSON 文件形式打包在 `packages/data/src/*.json`。

用户是三国杀国战爱好者，希望加入"管理员模式"，使少量受信管理员（v1 即上线 2 人：1 名技术 + 1 名非技术）能在线修改武将技能描述/字段、增删改 FAQ，且改动**几秒内**对所有访客可见。无独立后端服务器、无 GitHub PR 流程、无草稿审批环节。

**关键约束**（spec-challenge 已验证）：
- 1 名非技术管理员存在 → "git commit + 等部署" 路线行不通，必须有 UI
- "几秒生效" 是硬要求 → 不能走 git-as-CMS（60–90s 部署延迟）

定位：**hobbyist-grade**，轻维护、低成本、快速上线、可迭代。

## 2. 范围

### In-scope（v1）
- 修改**已有**武将基础字段（HP、势力、珠联璧合搭档、image URL、designer、pack、isEmperor、gender 等）
- 修改**已有**武将技能描述（`Skill.description`）及结构字段（type、timing、tags）—— 通过武将详情页内的技能区块编辑
- FAQ：增、删、改（v1 只支持关联到武将，`relatedGeneralIds`）
- 单一共享密码登录、HMAC 签名 cookie session（含 `SESSION_GENERATION` 强制下线机制）
- 「立即同步搜索」按钮（admin chrome 里）—— 触发 Vercel deploy hook，搜索 index 在下次 build 后对齐
- 每晚 Redis → JSON 快照（GitHub Action）写回 git，给运维 + 恢复手段

### Out-of-scope（v1，明确不做）
- ❌ **卡牌编辑**：因为 `cards/page.tsx` 把 146 张原始牌按名字去重聚合成 49 个 summary（杀 x30、闪 x21），"编辑哪一张杀"语义不清。延后到 v2，需要先重设计卡牌编辑单位。
- ❌ **将 FAQ 关联到卡牌/技能**：保留 `relatedSkillIds`/`relatedCardIds` 字段不在 v1 编辑器里暴露，先支持最常用的 `relatedGeneralIds`
- ❌ 新建武将 / 卡牌 / 技能（仅 FAQ 可新增）
- ❌ 图片上传（image URL 字段允许编辑 URL 文本，不上传文件）
- ❌ Markdown 渲染（描述当纯文本 + 换行符处理）
- ❌ 多管理员账号 / 审计 author / 撤回历史（v1 简单 last-write-wins，无 history；详见 §11）
- ❌ 草稿 / 预览 / 审批工作流
- ❌ 自动搜索索引实时刷新（首页搜索框结果在 admin 点「立即同步搜索」并 build 完成后才更新；详见 §4.4）
- ❌ Feature ② 牌局记录（独立规格）

### 关于「撤回上一版」
v1 直接砍掉。原因：history 增加 KV 读写、需要 UI、需要 KV key schema 复杂化；hobbyist 场景下"误改"概率低，恢复手段是"再改一次回来"或"从昨晚 git 快照对照"。如果实际使用后频繁误改，v2 再加。

## 3. 整体架构

```
[Visitor browser]
       ↓ HTTP
[Vercel CDN]  ← revalidatePath() invalidates here
       ↓ (miss)
[Next.js App on Vercel]  ←──────┐
       ↕ entityStore adapter     │
[Upstash Redis] (主) +           │
[bundled JSON] (visitor 读 fallback)
       ↑                         │
[Admin browser] → POST /api/admin/* (signed cookie auth)
       ↑
[GitHub Actions cron] ← 每晚 dump Redis → git commit packages/data/snapshots/
```

**核心组件**：
- **Upstash Redis**（通过 Vercel Marketplace 接）—— 运行时数据源
- **`entityStore` adapter**（`packages/web/src/lib/entity-store.ts`）—— 读/写都走它。隔离 Redis 调用，未来换 Postgres/Turso/D1 只改这一文件
- **Bundled JSON**（`packages/data/src/*.json`）—— 仅作 visitor 读路径的 stale-while-error fallback；admin 写不通过它
- **Next.js Route Handlers** (`/api/*`) —— 后端逻辑
- **现有 SSG 页面** —— 数据加载从 `import json` 改为 `await entityStore.getXxx(...)`，其余结构保留
- **内联编辑 UI** —— admin 登录后，访客页面上自动显示铅笔图标和「+ FAQ」按钮
- **`scripts/seed-redis.ts`** —— 一次性脚本，把当前 JSON 灌进 Redis
- **`.github/workflows/redis-snapshot.yml`** —— 每晚 cron，dump Redis → 写 `packages/data/src/*.json` → commit

**部署平台**：Vercel（已上线），Upstash Redis 免费档（10K 命令/天，256MB 容量）。

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

### 4.2 entityStore adapter（隔离 Redis）

`packages/web/src/lib/entity-store.ts` 暴露统一接口，所有页面/API 都走它：

```ts
interface EntityStore {
  // Reads (visitor + admin)
  getGeneral(id: GeneralId): Promise<General | null>;
  getGenerals(): Promise<General[]>;
  getSkill(id: SkillId): Promise<Skill | null>;
  getSkillsByGeneral(generalId: GeneralId): Promise<Skill[]>;
  getFaq(id: FAQId): Promise<FAQ | null>;
  getFaqs(): Promise<FAQ[]>;
  // Writes (admin only — caller responsible for auth)
  putGeneral(id: GeneralId, value: General): Promise<void>;
  putSkill(id: SkillId, value: Skill): Promise<void>;
  putFaq(id: FAQId, value: FAQ): Promise<void>;
  deleteFaq(id: FAQId): Promise<void>;
}
```

实现细节：
- 实际跑 Upstash Redis 调用
- 读路径捕获 Upstash 异常 → 自动 fallback 读对应 JSON 文件 + 在 console / Vercel logs 标注
- 写路径任何失败都直接抛出（admin 看到错）
- 反查表（`skills:by-general:*`）由 `putSkill` 透明维护

### 4.3 一次性 seed 脚本
- `scripts/seed-redis.ts` 读 `packages/data/src/generals.json`、`skills.json`、`faq.json`，写入对应 key + 维护 index/反查表
- 首次部署后手动跑一次（`pnpm seed-redis`，本地连 prod Upstash）
- **重要**：必须在第一个 visitor 访问之前完成 seed。如果忘了，§4.5 的 fallback 也能保住基本可用性，但 admin 编辑前一定要 seed 完。

### 4.4 搜索索引（已知限制 + 同步按钮）

现有 `packages/web/src/components/search/search-data.ts` 在编译时把 JSON 打进客户端 bundle。v1 **不重写搜索**：
- 编辑生效后，详情页/列表页通过 revalidate 几秒内刷新
- **首页搜索框结果**仍反映 build 时的状态，要等到下一次 build 才更新
- admin 顶栏放一个「**立即同步搜索**」按钮：点击 → POST `/api/admin/sync-search` → 后端调 Vercel Deploy Hook → 触发 redeploy（60–90s 后搜索对齐）
- 编辑保存的 toast 提示："已保存。如需让搜索框立即对齐，点顶栏的「立即同步搜索」"
- v2 可以重写为 Redis 拉数据（要做的话需要客户端 fetch + 缓存）

### 4.5 Stale-while-error fallback（visitor 读路径）

Spec-challenge 反复指出 Redis-only 无 fallback 是 hobbyist 场景下"单点故障"。v1 调整：

- **visitor 读路径**：Upstash 调用失败 / 超时（3s）→ adapter fallback 读 `@sgs/data` JSON（即 `packages/data/src/*.json`）→ 页面渲染加一个细长的"内容暂时回退到上次部署版本"横幅
- **admin 写路径**：不 fallback。Redis 不可达 → 表单 toast 报错，让 admin 重试。绝不能用 JSON 假装写成功。
- **CI 校验**：`packages/data/src/*.json` 加 header 注释 `<!-- DO NOT EDIT MANUALLY — managed by /admin and nightly snapshot -->`，PR 改了这些文件 CI 报警（除非 commit 含 `[snapshot]` tag，留给 nightly action）

理由：visitor 看到 24h 内的旧内容 ≠ 看到完全空白错误页。后者更糟。这与 §3.3（4.3 旧版）的"绝不双源"原则做出了取舍——读路径接受最大 24h 漂移（搭配 §4.6 nightly snapshot），写路径仍严格。

### 4.6 Nightly Redis → JSON snapshot

`.github/workflows/redis-snapshot.yml`，每天 03:00 UTC：
1. 连 prod Upstash，dump 全部 `general:*` / `skill:*` / `faq:*` 内容
2. 重建 `packages/data/src/generals.json` / `skills.json` / `faq.json`
3. 如有变化 → commit `data: nightly snapshot YYYY-MM-DD [snapshot]` 到 main
4. 不触发 Vercel rebuild（snapshot 只是恢复点，不是部署源）

效果：
- JSON 永远不超过 24h 漂移
- §4.5 的 fallback 在最坏情况下显示 "≤24h ago"
- 整段 git 历史是天然的"内容编辑日志"（即使 v1 没 admin 端 history）
- Redis 真挂了重建 → 拿最近一份 JSON 重跑 seed 即可

## 5. API 路由

| Method | Path | 行为 |
|---|---|---|
| POST | `/api/auth/login` | 接收 `{password}`；`crypto.timingSafeEqual` 比对 env `ADMIN_PASSWORD`；签发 HMAC 签名 cookie（含 `SESSION_GENERATION`）；返回 200 |
| POST | `/api/auth/logout` | 清 cookie |
| GET | `/api/auth/me` | 验签 cookie；返回 `{authed: bool}` |
| PATCH | `/api/admin/generals/{id}` | 验签；schema 校验；`entityStore.putGeneral`；调 `revalidatePath('/generals')` + `revalidatePath('/generals/{id}')` |
| PATCH | `/api/admin/skills/{id}` | 验签；校验；`entityStore.putSkill`；查反查表 → revalidate 所有挂这个技能的武将详情页 + `/generals` |
| POST | `/api/admin/faqs` | 验签；校验；生成新 id（`faq_${nanoid(8)}`）；`entityStore.putFaq` + push 到 `faqs:index`；revalidate `/faq` + 关联的 `/generals/{id}` |
| PATCH | `/api/admin/faqs/{id}` | 验签；校验；`entityStore.putFaq`（包含修改前后 oldValue/newValue 的 relatedGeneralIds 全部 revalidate）|
| DELETE | `/api/admin/faqs/{id}` | 验签；`entityStore.deleteFaq` + 从 `faqs:index` 移除；revalidate 同上 |
| POST | `/api/admin/sync-search` | 验签；fetch env `VERCEL_DEPLOY_HOOK_URL`；返回 202 + 提示 |

**revalidate 映射表**（集中放在 `packages/web/src/lib/revalidate-map.ts`，所有 admin 写都查它）：

```ts
type Mutation = {
  type: 'general' | 'skill' | 'faq';
  id: string;
  oldValue?: any;  // 删除/改前
  newValue?: any;  // 改后
};
function pathsToRevalidate(m: Mutation): string[] { ... }
```

考虑 oldValue 是为了：FAQ 改了 `relatedGeneralIds` 时，新旧两套关联武将都要 revalidate。

`revalidate-map.ts` 必须有 unit tests 覆盖每种 mutation type（general/skill/faq × create/update/delete + relation 变更场景）。

## 6. 认证

**模型**：单一共享密码（环境变量 `ADMIN_PASSWORD`） + 签名 cookie（无服务端 session 存储） + 强制下线 generation。

**环境变量**：
- `ADMIN_PASSWORD`：明文（Vercel env 已加密）
- `SESSION_SECRET`：32 字节 hex（HMAC 密钥）
- `SESSION_GENERATION`：整数（默认 `1`）；bump 该值即让所有现存 cookie 失效（密码泄漏 / 离职等场景的应急手段）

**登录流程**：
1. `/admin/login` 表单输密码
2. POST `/api/auth/login`
3. 服务端 `crypto.timingSafeEqual(input, process.env.ADMIN_PASSWORD)` 比对
4. 比对通过 → cookie payload `{exp: now + 30d, gen: SESSION_GENERATION}`
5. cookie 格式：`base64(payload).hexHmac(payload, SESSION_SECRET)`
6. 返回 `Set-Cookie: admin_session=...; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`

**鉴权**：所有 `/api/admin/*` 中间件读 cookie → 拆分 payload + signature → 验签 + 检查 exp + 检查 `payload.gen === SESSION_GENERATION` → 任一不通过则 401。无需 Redis 查询。

**密码 / session 应急**：
- 密码泄漏：Vercel 改 `ADMIN_PASSWORD` env + bump `SESSION_GENERATION` → redeploy → 所有老 cookie 30 秒内失效（取决于函数冷启动与缓存清理）
- 单纯踢人：bump `SESSION_GENERATION` 即可

**前端态**：
- 普通详情页**默认不在 server 渲染时检查 cookie**（保持静态可缓存）
- admin chrome（铅笔/齿轮/+ 按钮 / 「立即同步搜索」按钮 / 退出）由一个 client component `<AdminAffordances>` 渲染，挂载后调 `GET /api/auth/me` → `{authed: true}` → 才显示
- 这避免把 admin cookie 检测拖进 SSG 缓存路径

## 7. UI 设计

**所有 visitor 路径不变**。admin 登录后，**同一套页面**通过 client-side 检测多渲染编辑控件。

### 7.1 唯一新增页面：`/admin/login`
- 中央简单 form：密码输入 + 「登录」
- 登录成功跳首页（`/`）
- 登录失败显示错误

### 7.2 顶栏（admin 已登录时）
- `<AdminAffordances>` 客户端组件挂载后，在顶栏右侧渲染：
  - `● 管理员模式`
  - `[同步搜索]` 按钮（点击触发 deploy hook，按钮 disabled + "正在同步..." 直到 60s 超时或刷新）
  - `[退出]` 链接

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

保存成功 → toast「已保存。如需让首页搜索立即对齐，点顶栏的『同步搜索』」 → 表单收起 → 页面 server component 重新渲染（revalidate 已触发）。

### 7.6 视觉风格
复用现有 Tailwind 设计语言（xuan paper / vermillion seal）。铅笔/齿轮/+ 按钮：小尺寸、淡灰色，hover 时变 vermillion。「同步搜索」按钮做成低调的 outline 样式。不引入新 UI 库。

## 8. 错误处理与边界

| 场景 | 行为 |
|---|---|
| Redis 读失败（visitor 路径） | adapter fallback 读 JSON + 渲染"内容暂时回退到上次部署版本"横幅；不中断 |
| Redis 读失败（admin 编辑前） | 表单显示「无法加载，请刷新」（不 fallback，避免编辑陈旧数据） |
| Redis 写失败 | 表单不收起，toast 报错，按钮可重试 |
| Schema 校验失败（422） | 表单字段下方红字提示哪一项不合规 |
| 认证失效（401） | 前端跳 `/admin/login` |
| Deploy hook 失败（同步搜索按钮） | toast 报错，admin 可手动去 Vercel dashboard 重 deploy |
| 并发编辑同字段 | last-write-wins；2 admin 场景冲突极少；如踩到可对照 nightly snapshot |
| 密码泄漏 | bump `SESSION_GENERATION` + 改密码 + redeploy → 全部 cookie 失效 |

## 9. 测试策略

| 层级 | 内容 |
|---|---|
| Unit | `entityStore` adapter（read/write/index 维护/JSON fallback 触发）；schema validators（per type，覆盖 enum/range/必填）；HMAC sign/verify（含 generation 校验）；`revalidate-map.ts` 全 mutation 类型 |
| Integration | API Route Handlers（mock Redis；验证 auth gate、`SESSION_GENERATION` 强制下线、校验、revalidate 调用、deploy hook 调用） |
| Manual smoke（部署后） | 登录 → 改技能描述 → 验证武将页几秒内更新 → 「同步搜索」→ 60s 后验证搜索框对齐 → 新建 FAQ → 删 FAQ → 退出 → 验证编辑控件消失 → bump `SESSION_GENERATION` 再 redeploy → 验证旧 session 跳登录页 |

注：项目当前**未配置 Playwright**（仓库有 `.playwright-cli/` 缓存目录但无 config/test）。E2E 不作为 v1 必交付，烟测靠手动覆盖。

## 10. 实施步骤

1. 装 `@upstash/redis` 依赖
2. Vercel dashboard：Marketplace 添加 Upstash Redis 集成 → 自动注入连接环境变量；创建 Deploy Hook → 拷 URL
3. 设环境变量 `ADMIN_PASSWORD`、`SESSION_SECRET`（32 字节 hex）、`SESSION_GENERATION=1`、`VERCEL_DEPLOY_HOOK_URL` 到 Vercel
4. 实现 `packages/web/src/lib/entity-store.ts`（adapter；含 JSON fallback、index 维护）
5. 实现 schema validators（`packages/web/src/lib/validators.ts`，复用 `@sgs/data` types）
6. 实现 cookie 签名工具（`packages/web/src/lib/auth.ts`，HMAC sign/verify + generation 校验）
7. 实现 `revalidate-map.ts` + 配套 unit tests
8. 实现 Route Handlers（auth + admin CRUD + sync-search）
9. 写 `scripts/seed-redis.ts` + `pnpm seed-redis` 命令
10. 本地连 prod Upstash 跑一次 seed（**部署前必做**）
11. 在 `packages/data/src/*.json` 顶部加 `<!-- DO NOT EDIT MANUALLY -->` header；CI 加检查（PR 改这些文件且 commit 不含 `[snapshot]` tag → fail）
12. 写 `.github/workflows/redis-snapshot.yml`（每晚 03:00 UTC）
13. 重构 `/generals/[id]` 与 `/generals` 的数据加载：`import @sgs/data` → `await entityStore.getXxx(...)`
14. 重构 `/faq` 数据加载同上
15. 实现 `/admin/login` 单页
16. 实现 `<AdminAffordances>` client component（顶栏 + 「同步搜索」按钮）+ 各编辑表单组件（武将基础 / 技能 / FAQ）
17. 写 unit + integration 测试
18. 部署 Vercel + 手动烟测 + 触发一次 nightly snapshot 验证

## 11. 风险与开放问题

- **Seed 时机**：必须在首个 visitor 访问之前跑完 seed，否则站点初次访问会触发 §4.5 的 fallback 显示横幅（不致命，但不专业）。**缓解**：先在 prod 部署 admin 路由前完成 seed；用 redis CLI 验证 key 已写入；再开放 visitor 流量。
- **revalidate 漏路径**：技能 X 改了，但忘了 revalidate 引用该技能的武将页。**缓解**：`revalidate-map.ts` 集中映射 + `skills:by-general:*` 反查表 + 配套 unit tests + CDN 默认值兜底。
- **搜索一致性**：编辑生效后，详情页秒级刷新；首页搜索框需要 admin 主动点「同步搜索」并等 60–90s build。**缓解**：toast 明确提示；admin 心智模型上接受这是"全文索引重建"性质的操作。
- **Upstash 免费额度**：10K 命令/天。读量取决于 ISR 缓存命中率；写量微小。**缓解**：监控 Upstash dashboard；超额触发 §4.5 fallback 不致命；若长期超额可付费升级或加 in-memory cache 层。
- **冷启动**：Redis 第一次连接可能 100-300ms。**缓解**：Upstash 全球边缘 + Vercel function 同区域，正常无感。
- **Nightly snapshot 漂移检测**：如果 snapshot action 失败（network、token 过期、Redis 状态异常），JSON 会停在最后一次成功的时点。**缓解**：action 失败发 GitHub notification；失败超过 2 天 dev 会注意到。
- **JSON 文件被手动改后冲突**：CI 检查应该挡住，但万一漏过 → snapshot action 下一次 commit 会无差别覆盖手改。**接受**：admin/snapshot 是数据源，手改 JSON 不应该发生（CI + header 已警告）。
