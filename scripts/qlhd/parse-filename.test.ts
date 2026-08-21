import { describe, it, expect } from 'vitest';
import { parseCardFilename } from './parse-filename.js';

describe('parseCardFilename', () => {
  it('解析标准单势力卡', () => {
    expect(parseCardFilename('国战UI.WEI125.惟几成务.司马师.png')).toEqual({
      faction: 'WEI', cardNo: '125', title: '惟几成务', name: '司马师',
    });
  });

  it('解析双势力卡，& 前后分别是主副势力', () => {
    expect(parseCardFilename('国战UI.WEI&WU072.绘船制图.唐咨.png')).toEqual({
      faction: 'WEI', subfaction: 'WU', cardNo: '072', title: '绘船制图', name: '唐咨',
    });
  });

  it('姓名里的 & 不被误判为副势力分隔符', () => {
    expect(parseCardFilename('国战UI.SHU071.逐驾迎尘.糜芳&傅士仁.png')).toEqual({
      faction: 'SHU', cardNo: '071', title: '逐驾迎尘', name: '糜芳&傅士仁',
    });
  });

  it('吃掉可选的 G. 前缀', () => {
    expect(parseCardFilename('国战UI.G.SHU091.狷狭激愤.杨仪.png')).toEqual({
      faction: 'SHU', cardNo: '091', title: '狷狭激愤', name: '杨仪',
    });
  });

  it('接受带字母后缀的卡号', () => {
    expect(parseCardFilename('国战UI.SHU085A.凌然奋战.傅肜.png')).toEqual({
      faction: 'SHU', cardNo: '085A', title: '凌然奋战', name: '傅肜',
    });
  });

  it('接受四位卡号', () => {
    expect(parseCardFilename('国战UI.QUN1000.湖海散人.罗贯中.png')).toEqual({
      faction: 'QUN', cardNo: '1000', title: '湖海散人', name: '罗贯中',
    });
  });

  it('接受 XXX 无卡号', () => {
    expect(parseCardFilename('国战UI.WEIXXX.趁浪逐波.魏讽.png')).toEqual({
      faction: 'WEI', cardNo: 'XXX', title: '趁浪逐波', name: '魏讽',
    });
  });

  it('修正 WEl 小写 L 拼写错误', () => {
    expect(parseCardFilename('国战UI.WEl174.清介有守.国渊.png')).toEqual({
      faction: 'WEI', cardNo: '174', title: '清介有守', name: '国渊',
    });
  });

  it('十常侍子卡称号为空', () => {
    expect(parseCardFilename('国战UI.QUNXXX..夏恽.png')).toEqual({
      faction: 'QUN', cardNo: 'XXX', title: '', name: '夏恽',
    });
  });

  it('AM 野心家卡', () => {
    expect(parseCardFilename('国战UI.AM001.堕节肇业.司马昭.png')).toEqual({
      faction: 'AM', cardNo: '001', title: '堕节肇业', name: '司马昭',
    });
  });

  it('非武将卡文件名返回 null', () => {
    expect(parseCardFilename('休整.png')).toBeNull();
    expect(parseCardFilename('ab539b47-7fa1-4918-af21-6114c3aa9067.png')).toBeNull();
  });
});
