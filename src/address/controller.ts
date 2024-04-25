import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AddressService } from './service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import AddressDto from 'src/db/dto/address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @UseGuards(JwtGuard)
  @Post('add/:userId')
  async addAddress(
    @Body() addressDto: AddressDto,
    @Param('userId') userId: number,
  ) {
    return this.addressService.addAddress(addressDto, userId);
  }

  @UseGuards(JwtGuard)
  @Get('get/:userId')
  async getAddress(
    @Param('userId') userId: number,
  ) {
    return this.addressService.getAddress(userId);
  }
}
