import { Module } from '@nestjs/common';
import { ProductImageController } from './controller';
import { ProductImageService } from './service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import ProductImage from 'src/db/entities/productImage';
import Product from 'src/db/entities/product';
import ProductType from 'src/db/entities/productType';

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
  controllers: [ProductImageController],
  providers: [ProductImageService]
})
export class ProductImageModule {}
