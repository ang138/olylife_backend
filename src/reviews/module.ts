import { Module } from '@nestjs/common';
import { ReviewsController } from './controller';
import { ReviewsService } from './service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Review } from 'src/db/entities/review';
import Product from 'src/db/entities/product';
import User from 'src/db/entities/user';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Order from 'src/db/entities/order';
import OrderProduct from 'src/db/entities/orderProduct';

@Module({
  imports:[
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
    TypeOrmModule.forFeature([Review, Product, User, Order, OrderProduct]),],
  controllers: [ReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule {}
