/**
 * 由势力代号 + 卡号生成 generalId。
 *
 * dupIndex 用于同卡号多版本：0 -> 无后缀，1 -> _b，2 -> _c …
 * （素材里有 4 组：孔融 QUN014、诸葛亮 SHU004、张瑾云 SHU097、滕胤 WU098）
 *
 * XXX 卡号（8 名十常侍 + 魏讽）不走这里，由调用方给专用 ID。
 */
export function generalIdFor(faction: string, cardNo: string, dupIndex: number): string {
  if (cardNo === 'XXX') {
    throw new Error(`generalIdFor 不处理 XXX 卡号（${faction}XXX），请由调用方指定 ID`);
  }
  const digits = cardNo.match(/^\d+/)?.[0] ?? '';
  const suffix = cardNo.slice(digits.length);
  const num = digits.length >= 3 ? digits : digits.padStart(3, '0');
  const base = `general_${faction.toLowerCase()}_${num}${suffix.toLowerCase()}`;
  if (dupIndex === 0) return base;
  return `${base}_${String.fromCharCode('a'.charCodeAt(0) + dupIndex)}`;
}
