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

  it('点数按 A/J/Q/K 显示，不是 1/11/12/13', () => {
    // 七星宝刀卡面印的是 ♠K，此前副标题错显示成「♠13」。
    const hit = search('七星宝刀').find((h) => h.type === 'card');
    expect(hit?.subtitle).toContain('♠K');
    expect(hit?.subtitle).not.toContain('13');
  });

  it('专属牌搜索结果直接指向其武将页', () => {
    const hit = search('七星宝刀').find((h) => h.type === 'card');
    expect(hit?.href).toBe('/generals/general_qlhd_shu_061');
    expect(hit?.subtitle).toContain('诸葛果专属');
    // 通用牌仍然去卡牌页
    const generic = search('调虎离山').find((h) => h.type === 'card');
    expect(generic?.href).toBe('/cards');
  });

  it('十常侍子卡可搜且指向父卡详情页', () => {
    const hits = search('高望');
    const hit = hits.find((h) => h.type === 'general' && h.title === '高望');
    expect(hit).toBeDefined();
    expect(hit!.href).toBe('/generals/general_qlhd_qun_000');
  });

  it('武将副标题就是称号', () => {
    const hits = search('曹丕');
    const hit = hits.find((h) => h.type === 'general' && h.id === 'general_qlhd_wei_014');
    expect(hit?.subtitle).toBe('荡然由心');
  });

  it('索引里没有已移除的国战包武将', () => {
    const guozhan = searchEntries.filter(
      (e) => e.type === 'general' && !e.id.startsWith('general_qlhd_'),
    );
    expect(guozhan).toHaveLength(0);
  });

  it('搜「张奋」同时命中武将与其 14 张大攻车牌', () => {
    const hits = search('张奋', 100);
    expect(hits.some((h) => h.type === 'general' && h.title === '张奋')).toBe(true);
    // 大攻车牌的副标题是拥有者姓名，因此按「张奋」可以搜到整套零件
    expect(hits.filter((h) => h.type === 'token' && h.subtitle === '张奋')).toHaveLength(14);
  });
});
