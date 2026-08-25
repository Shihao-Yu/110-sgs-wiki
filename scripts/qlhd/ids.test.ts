import { describe, it, expect } from 'vitest';
import { generalIdFor } from './ids.js';

describe('generalIdFor', () => {
  it('三位卡号直接小写拼接', () => {
    expect(generalIdFor('WEI', '125', 0)).toBe('general_wei_125');
  });

  it('补齐到三位', () => {
    expect(generalIdFor('SHU', '4', 0)).toBe('general_shu_004');
  });

  it('四位卡号原样保留', () => {
    expect(generalIdFor('QUN', '1000', 0)).toBe('general_qun_1000');
  });

  it('字母后缀小写保留', () => {
    expect(generalIdFor('SHU', '085A', 0)).toBe('general_shu_085a');
  });

  it('同卡号第二张加 _b 后缀', () => {
    expect(generalIdFor('SHU', '004', 0)).toBe('general_shu_004');
    expect(generalIdFor('SHU', '004', 1)).toBe('general_shu_004_b');
    expect(generalIdFor('SHU', '004', 2)).toBe('general_shu_004_c');
  });

  it('AM 野心家卡用 am 前缀', () => {
    expect(generalIdFor('AM', '001', 0)).toBe('general_am_001');
  });

  it('XXX 卡号必须由调用方另行处理', () => {
    expect(() => generalIdFor('WEI', 'XXX', 0)).toThrow(/XXX/);
  });
});
