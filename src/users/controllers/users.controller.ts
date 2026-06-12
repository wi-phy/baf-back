import { Controller } from '@nestjs/common';
import { UsersService } from '../services';

@Controller('users') // /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
}
