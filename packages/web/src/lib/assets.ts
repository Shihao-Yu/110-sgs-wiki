const DEFAULT_BASE_URL =
  "https://cdn.jsdelivr.net/gh/Shihao-Yu/110-sgs-wiki@main/assets";

const RAW_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL ?? DEFAULT_BASE_URL;
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export function assetUrl(path: string): string {
  const trimmed = path.replace(/^\/+/, "");
  // 文件名里有中文、`&`（双势力卡）和 `♠♥♣♦`（新增牌）等非 ASCII 字符。
  // 不编码的话，Next.js 把这个 URL 塞进 preload 响应头时会抛 ByteString 错误
  // （HTTP 头只能是 latin-1），每个详情页都会在服务端报一次。
  // encodeURI 只编码非 ASCII 与不安全字符、保留 `/` 分隔符，结果是纯 ASCII。
  return `${BASE_URL}/${encodeURI(trimmed)}`;
}
