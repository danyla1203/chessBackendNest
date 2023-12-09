import {
  Controller,
  Get,
  Post,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Redirect()
  @Get('/checkout-session')
  async checkoutSession() {
    const session = await this.service.checkoutSession();
    return { url: session.url };
  }

  @Post('/webhook')
  async stripeWebhook(@Req() request, @Res() response) {
    const sig = request.headers['stripe-signature'];
    this.service.handleStripeWebhook(sig, request.rawBody);
    response.send();
  }
}
