import { Inject, Injectable } from '@nestjs/common';
import { Stripe } from 'stripe';

@Injectable()
export class StripeService {
  constructor(@Inject('STRIPE_CLIENT') private stripe: Stripe) {}

  updateBalanceSession() {
    return this.stripe.checkout.sessions.create({
      line_items: [
        {
          price: 'price_1NZzaUEmpALKGC8P2iLihLrD',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000?success=true`,
      cancel_url: `http://localhost:3000?canceled=true`,
    });
  }
  constructEventFromWebhook(signature, body) {
    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      'whsec_f97106ffe8db00357492c87d965361f98d7217c83e80536ce4ed9bf6fe59ac5e',
    );
  }
}
