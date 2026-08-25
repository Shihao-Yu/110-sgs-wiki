import { describe, it, expect } from 'vitest';
import { search, searchEntries } from './search-data';

describe('search index', () => {
  it('索引里不再有技能条目', () => {
    expect(searchEntries.filter((e) => e.type === 'skill')).toHaveLength(0);
  });

  it('不再有名为「未知」的条目', () => {
    expect(searchEntries.filter((e) => e.title === '未知')).toHaveLength(0);
  });

  it('武将按名字可搜', () => {
    const hits = search('司马师');
    expect(hits.some((h) => h.type === 'general' && h.title === '司马师')).toBe(true);
  });

  it('武将按称号可搜', () => {
    const hits = search('惟几成务');
    expect(hits.some((h) => h.type === 'general')).toBe(true);
  });

  it('标记牌按名字可搜', () => {
    const hits = search('上上签');
    expect(hits.some((h) => h.type === 'token' && h.title === '上上签')).toBe(true);
  });

  it('搜「羊祜」同时命中武将与其标记牌', () => {
    const hits = search('羊祜');
    expect(hits.some((h) => h.type === 'general')).toBe(true);
    expect(hits.some((h) => h.type === 'token')).toBe(true);
  });

  it('群狼环鼎新增牌按名字可搜', () => {
    const hits = search('七星宝刀');
    expect(hits.some((h) => h.type === 'card' && h.title === '七星宝刀')).toBe(true);
  });

  it('十常侍子卡可搜且指向父卡详情页', () => {
    const hits = search('高望');
    const hit = hits.find((h) => h.type === 'general' && h.title === '高望');
    expect(hit).toBeDefined();
    expect(hit!.href).toBe('/generals/general_qlhd_qun_000');
  });

  it('副标题带版本前缀，用于区分两版同名武将（如曹丕）', () => {
    const hits = search('曹丕');
    const guozhanHit = hits.find((h) => h.type === 'general' && h.id === 'general_wei_014');
    const qlhdHit = hits.find((h) => h.type === 'general' && h.id === 'general_qlhd_wei_014');
    expect(guozhanHit?.subtitle).toBe('国战 · 魏文帝');
    expect(qlhdHit?.subtitle).toBe('群狼环鼎 · 荡然由心');
  });
});
