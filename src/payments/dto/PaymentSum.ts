import { IsNumber } from 'class-validator';

export class PaymentSum {
  @IsNumber()
  amount: number;
}
