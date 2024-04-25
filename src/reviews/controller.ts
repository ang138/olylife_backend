import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}

  // @UseGuards(JwtGuard)
  @Post('comment/:userId/:productId')
  async addReview(
    @Param('productId') productId: number,
    @Param('userId') userId: number,
    @Body('orderId') orderId: number,
    @Body('comment') comment: string,
  ) {
    return this.reviewService.addReview(productId, userId, orderId, comment);
  }

  @Get(':productId')
  async getReview(
    @Param('productId') productId: number,
  ) {
    return this.reviewService.getReview(productId);
  }

  @Get('count/:orderId')
  async countOrderProducts(
    @Param('orderId') orderId: number,
  ) {
    return this.reviewService.countOrderProducts(orderId);
  }
}
