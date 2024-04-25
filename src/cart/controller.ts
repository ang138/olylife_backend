import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import CartService from './service';
import CartDto from '../db/dto/cart.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('cart')
export default class controller {
  constructor(private readonly cartService: CartService) {}

  @UseGuards(JwtGuard)
  @Get('showcart/:userId')
  async showCart(@Param('userId') userId: number) {
    return this.cartService.showCart(userId);
  }

  @UseGuards(JwtGuard)
  @Get('getcount/:userId')
  async getCountInCart(@Param('userId') userId: number) {
    return this.cartService.getCountInCart(userId);
  }

  @UseGuards(JwtGuard)
  @Get('showcart')
  async getUserProfile(@Req() request: any) {
    // ดึง token จาก headers ของ request
    const token = request.headers.authorization.split(' ')[1];

    try {
      // เรียกใช้เมธอด findById ที่ถูกปรับปรุงด้วย token ที่ให้มา
      const cart = await this.cartService.getCart(token);

      // ดำเนินการต่อตามตรรกะต่าง ๆ หรือคืนค่าผู้ใช้ตามที่ต้องการ
      return cart;
    } catch (error) {
      // จัดการ UnauthorizedException หรือข้อผิดพลาดอื่น ๆ
      console.error(error.message);
      // คืนค่าผลลัพธ์ที่เหมาะสมหรือโยนข้อผิดพลาดต่อไปตามความต้องการ
      throw error;
    }
  }

  @Post('add-to-cart/:userId/:productId')
  async addProductToCart(
    @Param('productId') productId: number,
    @Param('userId') userId: number,
    @Body() cartDto: CartDto,
  ) {
    return this.cartService.addProductToCart(productId, userId, cartDto);
  }

  @Post('addamount/:cartId/:productId/:userId')
  async addAmount(
    @Param('cartId') cartId: number,
    @Param('productId') productId: number,
    @Param('userId') userId: number,
  ) {
    return this.cartService.addAmount(cartId, productId, userId);
  }

  @Post('reduceamount/:cartId/:productId/:userId')
  async reduceAmount(
    @Param('cartId') cartId: number,
    @Param('productId') productId: number,
    @Param('userId') userId: number,
  ) {
    return this.cartService.reduceAmount(cartId, productId, userId);
  }

  @Delete('removecart/:cartId/:productId/:userId')
  async removeCart(
    @Param('cartId') cartId: number,
    @Param('productId') productId: number,
    @Param('userId') userId: number,
  ) {
    return this.cartService.removeCart(cartId, productId, userId);
  }

  // @Post('order-product/:cartId/:userId')
  // async orderProduct(
  //   @Param('cartId') cartId: number,
  //   @Param('userId') userId: number,
  //   @Body('addressId') addressId: number,
  //   @Body('buyType') buyType: string,
  // ) {
  //   return this.cartService.orderProduct(cartId, userId, addressId, buyType);
  // }

  @Post('order-product/:userId')
  async orderProduct(
    @Param('userId') userId: number,
    @Body('cartId') cartId: number[],
    @Body('addressId') addressId: number,
    @Body('buyType') buyType: string,
  ) {
    return this.cartService.orderProduct(cartId, userId, addressId, buyType);
  }

  @Get('orderall')
  async getOrderAll() {
    return this.cartService.getOrderAll();
  }

  @Get('my-order/:userId')
  async getOrderById(@Param('userId') userId: number) {
    return this.cartService.getOrderById(userId);
  }

  @Patch('takingOrder/:orderId')
  async takingOrders(@Param('orderId') orderId: number) {
    return this.cartService.takingOrders(orderId);
  }

  @Patch('ordersSuccess/:orderId')
  async ordersSuccess(@Param('orderId') orderId: number) {
    return this.cartService.ordersSuccess(orderId);
  }

  @Patch('confirmOrders/:orderId')
  async confirmOrders(@Param('orderId') orderId: number) {
    return this.cartService.confirmOrder(orderId);
  }

  @Get('reviewOrder/:orderId')
  async getReviewOrder(@Param('orderId') orderId: number) {
    return this.cartService.getReviewOrder(orderId);
  }
}
