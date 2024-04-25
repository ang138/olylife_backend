import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from './guards/jwt.guard';
import { Request } from 'express';

import AuthService from './service';
import SignUpDto from '../db/dto/signup.dto';
import SignInDto from '../db/dto/signin.dto';

@Controller('auth')
export default class controller {
  constructor(private readonly authService: AuthService) {}

  @Post('admin')
  createAdmin(@Body() signUpDto: SignUpDto): Promise<{ token: string }> {
    return this.authService.createAdmin(signUpDto);
  }

  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto): Promise<{ token: string }> {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  async login(@Body() signInDto: SignInDto): Promise<{ token: string }> {
    return this.authService.signIn(signInDto);
  }

  // @UseGuards(JwtGuard)
  // @Get('profile')
  // async getUserProfile(@Req() request: any) {
  //   // ดึง token จาก headers ของ request
  //   const token = request.headers.authorization.split(' ')[1];

  //   try {
  //     // เรียกใช้เมธอด findById ที่ถูกปรับปรุงด้วย token ที่ให้มา
  //     const user = await this.authService.getUserProfile(token);

  //     // ดำเนินการต่อตามตรรกะต่าง ๆ หรือคืนค่าผู้ใช้ตามที่ต้องการ
  //     return user;
  //   } catch (error) {
  //     // จัดการ UnauthorizedException หรือข้อผิดพลาดอื่น ๆ
  //     console.error(error.message);
  //     // คืนค่าผลลัพธ์ที่เหมาะสมหรือโยนข้อผิดพลาดต่อไปตามความต้องการ
  //     throw error;
  //   }
  // }

  @UseGuards(JwtGuard)
  @Get('user/:id')
  async getProfile(@Param('id') id: number) {
    const user = await this.authService.getProfile(id);
    return user;
  }

  @UseGuards(JwtGuard)
  @Get('getuser')
  async getUser() {
    const user = await this.authService.getUser();
    return user;
  }
  
}
