import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import CartService from './service';
import CartController from './controller';
import Cart from '../db/entities/cart';
import Product from 'src/db/entities/product';
import User from 'src/db/entities/user';
import Address from 'src/db/entities/address';
import Order from 'src/db/entities/order';
import OrderProduct from 'src/db/entities/orderProduct';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: '2m',
          },
        };
      },
    }),
    TypeOrmModule.forFeature([Cart, Product, User, Address, Order, OrderProduct])],
  providers: [CartService],
  controllers: [CartController]
})
export default class CartModule {}
