import { Module } from '@nestjs/common';
import { AddressController } from './controller';
import { AddressService } from './service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import User from 'src/db/entities/user';
import Address from 'src/db/entities/address';

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
    TypeOrmModule.forFeature([User, Address]),
  ],
  controllers: [AddressController],
  providers: [AddressService]
})
export class AddressModule {}
