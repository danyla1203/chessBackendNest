import { Client } from './Client';

export type Player = Client & {
  side: 'w' | 'b';
  time: number;
  intervalLabel?: NodeJS.Timeout;
  turningPlayer?: boolean;
};
