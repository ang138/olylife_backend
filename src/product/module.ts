import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';

import ProductService from './service';
import ProductController from './controller';
import CartModule from 'src/cart/module';
import Product from '../db/entities/product';
import ProductImage from '../db/entities/productImage';
import ProductType from '../db/entities/productType';

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
    TypeOrmModule.forFeature([Product, ProductType, ProductImage]),
    CartModule,
    MulterModule.register({
      // dest: 'D:/BA/olylife/file/images',
      storage: diskStorage({
        destination: 'D:/BA/olylife/file/images',
        filename: (req, file, callback) => {
          callback(null, file.originalname);
        },
      }),
    }),
    
  ],
  providers: [ProductService],
  controllers: [ProductController],
})
export default class ProductModule {}
