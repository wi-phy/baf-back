/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { AuthRequestDto } from '../dtos';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should call authService signUp method', async () => {
      const dto: AuthRequestDto = {
        email: 'test@test.com',
        password: 'password',
      };

      await controller.signUp(dto);

      expect(authService.signUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should call authService login method', async () => {
      const dto: AuthRequestDto = {
        email: 'test@test.com',
        password: 'password',
      };

      await controller.login(dto);

      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });
});
