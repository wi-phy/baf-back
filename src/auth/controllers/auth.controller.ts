import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { AuthRequestDto, AuthResponseDto } from '../dtos';

@Controller('auth') // /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up') // /auth/sign-up
  signUp(@Body() dto: AuthRequestDto): Promise<AuthResponseDto> {
    return this.authService.signUp(dto);
  }

  @Post('login') // /auth/login
  login(@Body() dto: AuthRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }
}
