#!/usr/bin/env tsx
/**
 * 生成 packages/data/src/tokens.json，并把 21 张游戏牌并入 cards.json。
 *
 * 用法： pnpm tsx scripts/qlhd/build-tokens.ts
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOKEN_OWNERS } from './manual-mappings.js';

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
  const files = readdirSync(resolve(SRC, dir));
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
  for (const f of readdirSync(resolve(REPO_ROOT, 'assets/generals/emperors'))) {
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

  // —— 带花色点数的游戏牌并入 cards.json ——
  const cardsPath = resolve(REPO_ROOT, 'packages/data/src/cards.json');
  const cards = JSON.parse(readFileSync(cardsPath, 'utf8')) as Record<string, unknown>[];
  const base = cards.filter((c) => c.image == null);   // 幂等：先剔除上次追加的
  let added = 0;
  for (const { file: f, m } of packCardFiles) {
    added += 1;
    base.push({
      id: `qlhd_card_${String(added).padStart(3, '0')}`,
      name: m[1],
      type: 'trick',
      suit: SUIT[m[2]],
      number: m[3] === 'A' ? 1 : m[3] === 'J' ? 11 : m[3] === 'Q' ? 12 : m[3] === 'K' ? 13 : Number(m[3]),
      description: '',
      image: `cards/${webp(f)}`,
    });
  }
  writeFileSync(cardsPath, JSON.stringify(base, null, 2) + '\n', 'utf8');
  console.log(`cards.json: 标准牌 ${base.length - added} 条 + 群狼环鼎 ${added} 条`);
}

main();
