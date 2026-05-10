import type { Metadata } from "next";
import { entityStore } from "@/lib/entity-store";
import { getNavigationItemBySlug } from "@/lib/site";
import { getSession, defaultSession, type Session } from "@/lib/session-store";
import SessionEditor from "@/components/session/SessionEditor";

const section = getNavigationItemBySlug("session");

export const metadata: Metadata = {
  title: section?.label ?? "牌局记录",
  description: "线下国战玩家亮将后记录到这里，桌上其他人随时翻看技能详情。",
};

export const dynamic = "force-dynamic";

export default async function SessionPage() {
  const generals = await entityStore.getGenerals();
  const allGenerals = generals.map((g) => ({
    id: g.id as unknown as string,
    name: g.name,
    faction: g.faction as unknown as string,
    hp: g.hp,
    image: g.image,
  }));

  let initialSession: Session | null = defaultSession();
  let initialError: string | null = null;
  try {
    initialSession = await getSession();
  } catch (e) {
    console.warn("[/session] initial load failed", e);
    initialSession = null;
    initialError = "数据暂不可用，请刷新重试";
  }

  return (
    <div className="page-shell py-8 sm:py-12">
      <header className="mb-6">
        <span className="eyebrow">牌局</span>
        <h1 className="section-title mt-3">牌局记录</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          国战桌上有人亮将后填进来，其他人随时打开本页就能看到场上亮出的将。任何访客可编辑，改完点保存，5 秒同步。
        </p>
      </header>

      <SessionEditor
        initialSession={initialSession}
        initialError={initialError}
        allGenerals={allGenerals}
      />
    </div>
  );
}
