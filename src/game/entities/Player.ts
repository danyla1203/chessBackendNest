import { Client } from './Client';

export type Player = Client & {
  side: 'w' | 'b';
};
