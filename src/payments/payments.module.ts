import { Module } from '@nestjs/common';
import { StripeModule } from 'src/stripe/stripe.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    StripeModule.forRoot(process.env.STRIPE_SECRET, {
      apiVersion: '2022-11-15',
    }),
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
