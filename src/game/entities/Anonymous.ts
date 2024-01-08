export class Anonymous {
  userId: number;
  name = 'Anonymous';
  tempToken: string;
  exp: string;

  constructor(tempToken: string, exp: string) {
    this.tempToken = tempToken;
    this.exp = exp;
  }
}
