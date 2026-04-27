/**
 * Take the raw OCR dump (packages/data/src/ocr-generals.json) and produce a
 * clean card-as-printed dataset (packages/data/src/card-text.json) keyed by
 * the same generals.json IDs. Strips watermark / footer / flavor-quote noise.
 *
 * Output shape:
 *   {
 *     "generated": "2026-04-26T...",
 *     "items": {
 *       "general_wei_001": {
 *         "skillsText": "奸雄 当你受到1点伤害后...",
 *         "skillLines": ["奸雄", "当你受到1点伤害后...", ...],
 *         "ocrScore": 0.9539
 *       },
 *       ...
 *     }
 *   }
 *
 * The card-text.json file is what the web app reads to show the
 * "卡面原文" section on each general's detail page.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '..', 'packages', 'data', 'src');

interface OcrItem {
  image: string;
  title: string;
  titleScore: number;
  name: string;
  nameScore: number;
  skillsText: string;
  skillLines: string[];
  skillsScore: number;
}

interface OcrPayload {
  items: OcrItem[];
}

interface MergedGeneral {
  id: string;
  faction: string;
  number: string;
  image: string;
  name: string;
  title: string;
}

const ocr: OcrPayload = JSON.parse(
  readFileSync(resolve(dataDir, 'ocr-generals.json'), 'utf-8'),
);
const generals: MergedGeneral[] = JSON.parse(
  readFileSync(resolve(dataDir, 'generals.json'), 'utf-8'),
);

/** Strings to drop wholesale from skill lines. */
const NOISE_PATTERNS: RegExp[] = [
  /^TM$/,
  /^™$/,
  /^TM&.*/,
  /^TMQ$/,
  /^WEL$/i,
  /.*©.*\d{2,4}.*/,
  /^WEI[\s.]?\d+$/i,
  /^SHU[\s.]?\d+$/i,
  /^WU[\s.]?\d+$/i,
  /^QUN[\s.]?\d+$/i,
  /^JIN[\s.]?\d+$/i,
  /^WL\d+$/i, // common OCR misread for WEI/WU
  /^[A-Z]{2,3}\d{2,4}$/, // generic faction-code + number footer pattern
  /^\d{4}$/, // year stamps
  /Illustration/i,
  /插画/,
  /^\d{2,4}$/, // bare card numbers like "001"
  /^[“"][^”"]*$/, // dangling open-quote line
];

/** A "related generals" line on the card lists 2–4 名 candidate 副将 names,
 * Chinese-comma separated.  E.g. "典韦，郭嘉，曹昂" or just "张飞". */
function isRelatedGeneralsLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 30) return false;
  // Bare CJK 2–4 chars (single related general, e.g. "张飞")
  if (/^[一-鿿]{2,4}$/.test(trimmed)) return true;
  // 2+ comma-separated CJK chunks of 2–4 chars
  const chunks = trimmed.split(/[，,]/u).map((c) => c.trim());
  if (chunks.length < 2) return false;
  return chunks.every((c) => /^[一-鿿]{2,4}$/.test(c));
}

/** Lines that LOOK like flavor quotes (in “…” or "…") get dropped — those
 * are the italic flavor quotations on cards, not skill text. */
function isFlavorQuote(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Flavor quotes are usually wrapped in 中文引号 “…” or English quotes "…"
  if (/^[“"].*[”"]?$/.test(trimmed)) return true;
  return false;
}

function isNoise(line: string): boolean {
  for (const pat of NOISE_PATTERNS) {
    if (pat.test(line)) return true;
  }
  return false;
}

function cleanLines(lines: string[]): string[] {
  const cleaned: string[] = [];
  let inFlavorQuote = false;
  let droppedFirstLine = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isNoise(line)) continue;
    // Related-generals line ONLY appears at the very top of the skill block
    // (above the first 技能名). Drop only the first qualifying line so we
    // don't accidentally remove 2–4 char 技能名 like "奸雄" or "武聖".
    if (!droppedFirstLine && cleaned.length === 0 && isRelatedGeneralsLine(line)) {
      droppedFirstLine = true;
      continue;
    }
    if (isFlavorQuote(line)) {
      inFlavorQuote = true;
      continue;
    }
    if (inFlavorQuote) {
      // Once we entered a flavor-quote block, keep dropping until we hit a
      // non-quote line that looks like a real skill again.  Heuristic: if
      // the line contains any standard skill-tier keyword, exit quote mode.
      const looksLikeSkill = /[，。；：技牌伤判摸出阶段你]/u.test(line);
      if (!looksLikeSkill) continue;
      inFlavorQuote = false;
    }
    cleaned.push(line);
  }
  return cleaned;
}

/** Build lookup from card image filename → general id. */
const imageToId = new Map<string, string>();
for (const g of generals) {
  imageToId.set(g.image, g.id);
}

const items: Record<
  string,
  {
    skillsText: string;
    skillLines: string[];
    ocrScore: number;
  }
> = {};

let matched = 0;
let unmatched = 0;
for (const ocrItem of ocr.items) {
  const imageRel = ocrItem.image.replace(/^assets\//, '');
  const id = imageToId.get(imageRel);
  if (!id) {
    unmatched += 1;
    continue;
  }
  matched += 1;

  const cleanedLines = cleanLines(ocrItem.skillLines);
  items[id] = {
    skillsText: cleanedLines.join('\n'),
    skillLines: cleanedLines,
    ocrScore: ocrItem.skillsScore,
  };
}

const output = {
  generated: new Date().toISOString(),
  source: 'ocr-generals.json',
  matched,
  unmatched,
  items,
};

writeFileSync(
  resolve(dataDir, 'card-text.json'),
  JSON.stringify(output, null, 2) + '\n',
  'utf-8',
);

console.log(`wrote card-text.json (matched=${matched}, unmatched=${unmatched})`);
