import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell py-16">
      <section className="panel p-8 text-center sm:p-10">
        <span className="eyebrow">404</span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
          页面不存在
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          这个页面还没有内容。回首页看看吧。
        </p>
        <Link
          className="mt-8 inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          href="/"
        >
          返回首页
        </Link>
      </section>
    </div>
  );
}
