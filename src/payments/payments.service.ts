import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly stripe: StripeService) {}

  checkoutSession() {
    return this.stripe.updateBalanceSession();
  }

  handleStripeWebhook(signature, body): void {
    let event;
    try {
      event = this.stripe.constructEventFromWebhook(signature, body);
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.message);
    }
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        console.log(paymentIntentSucceeded);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}
