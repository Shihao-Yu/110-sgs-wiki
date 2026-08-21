import type { GeneralId } from './general.js';

export type TokenId = string & { readonly __brand: 'TokenId' };

/** 标记牌分类：技能标记 / 模块配件（大攻车）/ 其他（君主牌、休整牌等）。 */
export type TokenCategory = 'skill' | 'module' | 'misc';

export interface Token {
  id: TokenId;
  /** 卡面名称，如「羊祜」「上上签」「云纹」。 */
  name: string;
  image: string;
  /** 对应的「XX背面」图，按文件名自动配对。 */
  backImage?: string;
  /** 能确定归属时才有；认不出的留空。 */
  ownerGeneralId?: GeneralId;
  category: TokenCategory;
  /** category === 'module' 时的模块名，目前只有「大攻车」。 */
  module?: string;
}
