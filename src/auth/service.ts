import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Client, TextMessage } from '@line/bot-sdk';
import * as bcrypt from 'bcryptjs';

import User from '../db/entities/user';
import SignUpDto from '../db/dto/signup.dto';
import SignInDto from '../db/dto/signin.dto';

@Injectable()
export default class Service {
  private readonly client: Client;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {
    this.client = new Client({
      channelAccessToken:
        'xc+48GwtvCGwhhSiNXqQvUXc8glct4ThzIBeGZhBvfEZ+x8Zyu/y8FJR2ATFlILw+cZHNeVEIj9aLnMZoIz+XvFvwtksDXHvEdCs2Ox3E5akx5Sh+BZHVvIUES5Sahw89akLZyCjSDgpC6dVJFb7uQdB04t89/1O/w1cDnyilFU=',
      channelSecret: '82a86f11139f7a0d0eb77ec592be685e',
    });
  }

  async createAdmin(signUpDto: SignUpDto): Promise<{ token: string }> {
    const { name, email, password } = signUpDto;

    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = 1;

    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(newUser);

    const token = this.jwtService.sign({ id: newUser.id, email });

    console.log(`token: ${token}`);

    return { token };
  }

  // register
  async signUp(signUpDto: SignUpDto): Promise<{ token: string }> {
    const { name, email, password } = signUpDto;

    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = 2;

    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await this.userRepository.save(newUser);

    // เรียกใช้ฟังก์ชั่น ส่งการแจ้งเตือนไปที่ LINE
    const userLineId = 'U25646899d34e99f090133b6bae2052b5';

    const welcomeMessage = `คุณ ${name} ได้ทำการสมัครสมาชิก`;
    await this.sendMessage(userLineId, welcomeMessage);

    const token = this.jwtService.sign({ id: newUser.id, email, role });

    console.log(`token: ${token}`);

    return { token };
  }

  // login
  async signIn(signInDto: SignInDto): Promise<{ token: string }> {
    const { name, email, password } = signInDto;

    const user = await this.userRepository.findOne({
      where: [{ name }, { email }],
    });

    if (!user) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const token = this.jwtService.sign({ id: user.id, role: user.role, email });

    // console.log(token);

    return { token };
  }

  async getProfile(id: number) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      // .select(['user.name', 'user.email', 'user.role'])
      .select(['user'])
      .where('user.id = :uid', { uid: id })
      .getOne();
      if (!user) {
        // If user is not found, send a 404 Not Found response with a message
        throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งาน');
    }
    return user;
  }

  async getUser() {
    const user = await this.userRepository.find()
      if (!user) {
        // If user is not found, send a 404 Not Found response with a message
        throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งาน');
    }
    return user;
  }

  // ส่งการแจ้งเตือนไปที่ LINE
  async sendMessage(userId: string, message: string): Promise<any> {
    const textMessage: TextMessage = {
      type: 'text',
      text: message,
    };

    return this.client.pushMessage(userId, textMessage);
  }

  async logOut() {}
}
