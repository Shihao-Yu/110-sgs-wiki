const DEFAULT_BASE_URL =
  "https://cdn.jsdelivr.net/gh/Shihao-Yu/110-sgs-wiki@main/assets";

const RAW_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL ?? DEFAULT_BASE_URL;
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export function assetUrl(path: string): string {
  const trimmed = path.replace(/^\/+/, "");
  return `${BASE_URL}/${trimmed}`;
}
