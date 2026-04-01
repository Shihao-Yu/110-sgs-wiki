/**
 * QUN000 十常侍 (Shi Chang Shi / Ten Attendants) — 祸乱纲常
 *
 * Special QUN general with unique multi-character mechanics.
 * In the Sanguosha Kingdom War mode, 十常侍 acts as multiple
 * characters occupying a single seat. They have special rules:
 *   - Treated as having 4 faction identities (all QUN)
 *   - Can reveal portions independently
 *   - Uses unique skill activation tied to the "ten eunuchs" theme
 *
 * Skills pending implementation.
 */

import type { Faction, GeneralId } from '@sgs/data';
import type { SkillPlugin } from '../types.js';

const GENERAL_ID = 'general_qun_000' as GeneralId;

export const FACTION: Faction = 'QUN';

/**
 * Marker indicating this general uses multi-character seat mechanics.
 * The engine should treat this general as occupying the seat of
 * multiple sub-characters (the ten eunuchs).
 */
export const IS_MULTI_CHARACTER = true;

export const shichangshiPlaceholder: SkillPlugin = {
  id: 'special_qun_000_placeholder',
  name: '十常侍技能',
  generalId: GENERAL_ID,
  type: 'passive',
  description: '特殊群势力武将。十常侍作为多角色占据一个座位，具有独特机制。',
  triggers: ['phaseChange'],
  canActivate: () => false,
  activate() { /* placeholder */ },
};

export const qun000Skills: SkillPlugin[] = [shichangshiPlaceholder];
