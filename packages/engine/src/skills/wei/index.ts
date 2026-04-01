/**
 * WEI faction skill registry — generals 001 through 030.
 *
 * Registers all WEI skills with the central SkillRegistry.
 */

import type { SkillRegistry } from '../skill-registry.js';
import type { SkillPlugin } from '../types.js';

import { wei001Skills } from './wei001-caocao.js';
import { wei002Skills } from './wei002-simayi.js';
import { wei003Skills } from './wei003-xiahoudun.js';
import { wei004Skills } from './wei004-zhangliao.js';
import { wei005Skills } from './wei005-xuchu.js';
import { wei006Skills } from './wei006-guojia.js';
import { wei007Skills } from './wei007-zhenji.js';
import { wei008Skills } from './wei008-dianwei.js';
import { wei009Skills } from './wei009-xunyu.js';
import { wei010Skills } from './wei010-caoren.js';
import { wei011Skills } from './wei011-xiahouyuan.js';
import { wei012Skills } from './wei012-zhanghe.js';
import { wei013Skills } from './wei013-xuhuang.js';
import { wei014Skills } from './wei014-caozhang.js';
import { wei015Skills } from './wei015-yujin.js';
import { wei016Skills } from './wei016-manchong.js';
import { wei017Skills } from './wei017-xunyou.js';
import { wei018Skills } from './wei018-zhangchunhua.js';
import { wei019Skills } from './wei019-caopi.js';
import { wei020Skills } from './wei020-caozhi.js';
import { wei021Skills } from './wei021-lidian.js';
import { wei022Skills } from './wei022-yufan.js';
import { wei023Skills } from './wei023-chengyu.js';
import { wei024Skills } from './wei024-caohong.js';
import { wei025Skills } from './wei025-wangyi.js';
import { wei026Skills } from './wei026-guohuai.js';
import { wei027Skills } from './wei027-zhonghui.js';
import { wei028Skills } from './wei028-dengai.js';
import { wei029Skills } from './wei029-jiaxu.js';
import { wei030Skills } from './wei030-xushu.js';

/** All WEI skill plugins in general order. */
export const allWeiSkills: SkillPlugin[] = [
  ...wei001Skills,
  ...wei002Skills,
  ...wei003Skills,
  ...wei004Skills,
  ...wei005Skills,
  ...wei006Skills,
  ...wei007Skills,
  ...wei008Skills,
  ...wei009Skills,
  ...wei010Skills,
  ...wei011Skills,
  ...wei012Skills,
  ...wei013Skills,
  ...wei014Skills,
  ...wei015Skills,
  ...wei016Skills,
  ...wei017Skills,
  ...wei018Skills,
  ...wei019Skills,
  ...wei020Skills,
  ...wei021Skills,
  ...wei022Skills,
  ...wei023Skills,
  ...wei024Skills,
  ...wei025Skills,
  ...wei026Skills,
  ...wei027Skills,
  ...wei028Skills,
  ...wei029Skills,
  ...wei030Skills,
];

/** Register all WEI skills into a SkillRegistry instance. */
export function registerWeiSkills(registry: SkillRegistry): void {
  for (const skill of allWeiSkills) {
    registry.register(skill);
  }
}
