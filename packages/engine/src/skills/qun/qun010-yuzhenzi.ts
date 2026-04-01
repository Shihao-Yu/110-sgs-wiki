/**
 * QUN010 于吉 (Yu Ji / Yu Zhenzi) — 太平道人
 *
 * 蛊惑 (Bewitch / Guhuo): You may play a hand card face-down claiming it
 * to be any basic or trick card. Other players may challenge; if challenged
 * and the card matches the claim, the challenger loses 1 HP.
 */

import type { GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const QUN010 = 'QUN010' as GeneralId;

export const guhuo: SkillPlugin = {
  id: 'qun_guhuo',
  name: '蛊惑',
  generalId: QUN010,
  type: 'active',
  description: '你可以将一张手牌扣置声明为任意一张基本牌或锦囊牌并使用之。其他角色可质疑。',
  triggers: ['playCard'],
  canActivate(ctx) {
    if (ctx.event.type !== 'playCard') return false;
    return ctx.event.player === ctx.player.id && ctx.player.handCards.length > 0;
  },
  activate(ctx) {
    // Simplified: play the card face-down as claimed
    if (ctx.player.handCards.length === 0) return;
    const [claimed] = ctx.player.handCards.splice(0, 1);
    ctx.game.discardPile.push(claimed);
    ctx.game.activeEffects.push({
      id: `guhuo_${ctx.game.turnCount}`,
      name: 'guhuo',
      sourcePlayerId: ctx.player.id,
      targetPlayerIds: [],
      duration: 'phase',
      properties: { faceDownPlay: true },
    });
  },
};

export const qun010Skills: SkillPlugin[] = [guhuo];
