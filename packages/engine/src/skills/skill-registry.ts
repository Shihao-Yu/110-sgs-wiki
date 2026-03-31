import type { GeneralId } from '@sgs/data';
import { EventEmitter, type PhaseCallback } from '../phase/event-emitter.js';
import { PHASE_ORDER } from '../phase/phase-manager.js';
import { createSkillContext, type SkillContextFactoryOptions } from './skill-context.js';
import type { GameEventType, SkillContext, SkillPlugin } from './types.js';

interface RegisteredSkill {
  skill: SkillPlugin;
  order: number;
}

type PhaseBindingOptions = Omit<SkillContextFactoryOptions, 'event' | 'game' | 'player'>;

export class SkillRegistry {
  private readonly skillsById = new Map<string, RegisteredSkill>();
  private readonly skillsByGeneral = new Map<GeneralId, RegisteredSkill[]>();
  private readonly skillsByEvent = new Map<GameEventType, RegisteredSkill[]>();
  private registrationOrder = 0;

  register(skill: SkillPlugin): void {
    if (this.skillsById.has(skill.id)) {
      throw new Error(`Skill '${skill.id}' is already registered`);
    }

    const registered: RegisteredSkill = {
      skill,
      order: this.registrationOrder++,
    };

    this.skillsById.set(skill.id, registered);
    this.pushToBucket(this.skillsByGeneral, skill.generalId, registered);

    for (const trigger of new Set(skill.triggers)) {
      this.pushToBucket(this.skillsByEvent, trigger, registered);
    }
  }

  getSkillsForGeneral(generalId: GeneralId): SkillPlugin[] {
    return this.sortSkills(this.skillsByGeneral.get(generalId) ?? []);
  }

  getSkillsForEvent(eventType: GameEventType): SkillPlugin[] {
    return this.sortSkills(this.skillsByEvent.get(eventType) ?? []);
  }

  triggerEvent(ctx: SkillContext): void {
    const skills = this.getSkillsForEvent(ctx.event.type).filter(skill =>
      this.skillBelongsToPlayer(skill, ctx.player),
    );

    for (const skill of skills) {
      if (!skill.canActivate(ctx)) continue;
      skill.activate(ctx);
    }
  }

  bindPhaseEvents(emitter: EventEmitter, options: PhaseBindingOptions = {}): () => void {
    const listeners = PHASE_ORDER.map((phase) => {
      const callback: PhaseCallback = ({ game, player, phase: currentPhase }) => {
        this.triggerEvent(
          createSkillContext({
            ...options,
            game,
            player,
            event: {
              type: 'phaseChange',
              player: player.id,
              phase: currentPhase,
            },
          }),
        );
      };

      emitter.on(`phase:${phase}:start`, callback);
      return { phase, callback };
    });

    return () => {
      for (const { phase, callback } of listeners) {
        emitter.off(`phase:${phase}:start`, callback);
      }
    };
  }

  private pushToBucket<Key>(map: Map<Key, RegisteredSkill[]>, key: Key, skill: RegisteredSkill): void {
    const list = map.get(key);
    if (list) {
      list.push(skill);
    } else {
      map.set(key, [skill]);
    }
  }

  private sortSkills(skills: RegisteredSkill[]): SkillPlugin[] {
    return [...skills]
      .sort((left, right) => {
        const priorityDiff = this.getPriority(left.skill) - this.getPriority(right.skill);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return left.order - right.order;
      })
      .map(({ skill }) => skill);
  }

  private getPriority(skill: SkillPlugin): number {
    return skill.priority ?? 0;
  }

  private skillBelongsToPlayer(skill: SkillPlugin, player: SkillContext['player']): boolean {
    const activeSkillIds = new Set<string>(player.skills.map(skillId => skillId as string));
    if (activeSkillIds.has(skill.id)) {
      return true;
    }

    return this.getRevealedGeneralIds(player).has(skill.generalId);
  }

  private getRevealedGeneralIds(player: SkillContext['player']): Set<GeneralId> {
    const generalIds = new Set<GeneralId>();

    if (player.mainGeneral?.revealed) {
      generalIds.add(player.mainGeneral.generalId);
    }

    if (player.deputyGeneral?.revealed) {
      generalIds.add(player.deputyGeneral.generalId);
    }

    return generalIds;
  }
}
