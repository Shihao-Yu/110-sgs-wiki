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
