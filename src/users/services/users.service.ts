import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new user in the database.
   *
   * @param {string} email - The email address of the new user.
   * @param {string} hash - The hashed password of the new user.
   * @returns {Promise<Omit<User, 'hash'>>} A Promise that resolves to the user object without hash.
   */
  async createUser(email: string, hash: string): Promise<Omit<User, 'hash'>> {
    return await this.prismaService.user.create({
      data: { email, hash },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Retrieves a user by their email.
   *
   * @param {string} email - The email of the user to retrieve.
   * @returns {Promise<User>} - A promise that resolves to the user object.
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) throw new NotFoundException('No user match this id');

    return user;
  }
}
