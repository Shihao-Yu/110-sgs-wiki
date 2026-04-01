import type { Metadata } from "next";
import SearchResultsClient from "./SearchResultsClient";

export const metadata: Metadata = {
  title: "搜索",
  description: "三国杀国战 Wiki 全站搜索 — 武将、技能、卡牌、FAQ。",
};

export default function SearchPage() {
  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-8">
        <span className="eyebrow">Search</span>
        <h1 className="section-title mt-3">搜索结果</h1>
      </header>
      <SearchResultsClient />
    </div>
  );
}
