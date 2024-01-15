export class Anonymous {
  userId: number;
  name = 'Anonymous';
  tempToken: string;
  exp: string;

  constructor(id: number, tempToken: string, exp: string) {
    this.userId = id;
    this.tempToken = tempToken;
    this.exp = exp;
  }
}
