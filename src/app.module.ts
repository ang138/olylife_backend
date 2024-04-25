import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReviewsModule } from './reviews/module';
import { ProductImageModule } from './product-image/module';
import { AddressModule } from './address/module';

import AuthModule  from './auth/module';
import CartModule from './cart/module';
import ProductModule from './product/module';

const modules = [
  AuthModule,
  ProductModule,
  CartModule,
  ReviewsModule,
  ProductImageModule,
  AddressModule
];
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_DATABASE_HOST'),
        port: parseInt(configService.get('POSTGRES_DATABASE_PORT')),
        username: configService.get('POSTGRES_DATABASE_USER'),
        password: configService.get('POSTGRES_DATABASE_PASS'),
        database: configService.get('POSTGRES_DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ...modules,
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
