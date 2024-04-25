import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AddressDto from 'src/db/dto/address.dto';
import Address from 'src/db/entities/address';
import User from 'src/db/entities/user';
import { Repository } from 'typeorm';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async addAddress(addressDto: AddressDto, userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return {
        message: 'User not found',
      };
    }

    await this.addressRepository
      .createQueryBuilder()
      .insert()
      .into(Address)
      .values({ ...addressDto, userId })
      .execute();

    return 'เพิ่มที่อยู่เรียบร้อย';
  }

  async getAddress(userId: number){
      const address = await this.addressRepository
        .createQueryBuilder('address')
        .select('address')
        .where({ userId })
        .getMany();
  
      if (!address) {
        return {
          message: 'Address not found',
        };
      }
      return address;
  }
}
