import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { BankIDValidateDTO, JWTRefreshRequestDto, OTPRequestDto, OTPRequestValidationDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '@/middlewares/auth.middleware';

export class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public auth = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/otp`, ValidationMiddleware(OTPRequestDto, 'body'), this.auth.getOTP);
    this.router.post(`${this.path}/otp/verify`, ValidationMiddleware(OTPRequestValidationDto, 'body'), this.auth.validateOTP);
    this.router.post(`${this.path}/refresh`, ValidationMiddleware(JWTRefreshRequestDto, 'body'), this.auth.refreshJWT);
    this.router.get(`${this.path}/bankid/startToken`, this.auth.getBankIDAutoStartToken);
    this.router.post(`${this.path}/bankid/verify`, ValidationMiddleware(BankIDValidateDTO, 'body'), this.auth.validateBankIDAuth);
    this.router.post(`${this.path}/logout`, AuthMiddleware, ValidationMiddleware(JWTRefreshRequestDto, 'body'), this.auth.logout);
  }
}
