export type Faction = 'WEI' | 'SHU' | 'WU' | 'QUN' | 'JIN';

export interface FactionInfo {
  id: Faction;
  name: string;
  color: string;
  generalCount: number;
  description: string;
}
