"use client";

/**
 * 只在有未保存修改时出现的底部操作栏。
 *
 * 起因：保存按钮在页面顶部的工具栏里，往下滚动改玩家武将时就看不见了，
 * 结果经常有人改完直接走人。改成脏了就把保存钉在视口底部——底部而非顶部，
 * 是因为手机上拇指够得到，而且不占顶部空间。不脏时整条栏不渲染。
 *
 * z-10 是有意低于 GeneralPicker 下拉的 z-20：选将时下拉应当盖住这条栏，
 * 而不是被它挡掉最后几个选项。
 */
type StickySaveBarProps = {
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onDiscard: () => void;
};

export default function StickySaveBar({
  saving,
  error,
  onSave,
  onDiscard,
}: StickySaveBarProps) {
  return (
    <>
      {/* 占位：fixed 不占文档流，没有它最后一张玩家卡会被栏遮住 */}
      <div aria-hidden className="h-20" />

      <div
        aria-label="未保存的修改"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-vermillion/30 bg-paper-mist/95 shadow-[0_-2px_16px_rgba(0,0,0,0.10)] backdrop-blur dark:bg-paper-deep/95"
        role="region"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="page-shell flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3">
          <span
            className={`min-w-0 flex-1 truncate text-xs font-medium sm:text-sm ${
              error ? "text-red-600 dark:text-red-400" : "text-vermillion"
            }`}
          >
            {error ?? "有未保存的修改"}
          </span>

          {/* 手机上触摸目标拉到 44px（btn-* 默认 py-1.5 只有约 32px），桌面收回 */}
          <button
            className="btn-secondary !px-3 !py-3 sm:!px-4 sm:!py-2.5"
            disabled={saving}
            onClick={onDiscard}
            type="button"
          >
            <span className="sm:hidden">放弃</span>
            <span className="hidden sm:inline">放弃修改</span>
          </button>
          <button
            aria-label="保存当前牌局"
            className="btn-primary !px-5 !py-3 sm:!px-6 sm:!py-2.5"
            disabled={saving}
            onClick={onSave}
            type="button"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </>
  );
}
