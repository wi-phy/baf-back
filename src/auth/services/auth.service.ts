import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/services';
import { AuthRequestDto, AuthResponseDto } from '../dtos';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user.
   *
   * This method takes user credentials (email and password), hashes the password using bcrypt,
   * and creates a new user record in the database.  It returns the user data without the password hash.
   *
   * @param {AuthDto} dto - The DTO containing the user's email and password.
   * @returns {Promise<AuthResponseDto>} - A promise that resolves to the newly created user object (without the hash).
   */
  async signUp(dto: AuthRequestDto): Promise<AuthResponseDto> {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(dto.password, salt);

    try {
      const { id, email } = await this.usersService.createUser(dto.email, hash);

      const token = await this.signToken(id, email);
      return {
        email,
        access_token: token,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Authenticates a user and returns a JWT token if the credentials are valid.
   *
   * @param {AuthDto} dto - The DTO containing the user's email and password.
   * @returns {Promise<AuthResponseDto>} - A promise that resolves with an object containing the JWT token (`access_token`).
   */
  async login(dto: AuthRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.getUserByEmail(dto.email);
    if (!user || !user.hash)
      throw new ForbiddenException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.hash);
    if (!isPasswordValid) throw new ForbiddenException('Invalid credentials');

    const token = await this.signToken(user.id, user.email);
    return {
      email: user.email,
      access_token: token,
    };
  }

  /**
   * Sign a JWT token with the user id and email
   *
   * @param {number} userId - The ID of the user.
   * @param {string} email - The email address of the user.
   * @returns {Promise<string>} - A promise that resolves with the JWT (`access_token`).
   */
  private async signToken(userId: number, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
      secret: this.configService.get('JWT_SECRET'),
    });

    return token;
  }
}
