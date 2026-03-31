import type { EquipmentSlots } from '../state/player.js';

export type EquipmentSlot = keyof EquipmentSlots;

/** Result of attempting to play a card via standalone functions. */
export interface CardPlayResult {
  success: boolean;
  reason?: string;
}
