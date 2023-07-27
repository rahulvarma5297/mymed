import { Router } from 'express';
import { UpdateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { UserController } from '@/controllers/user.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';

export class UserRoute implements Routes {
  public path = '/profile';
  public router = Router();
  private user = new UserController();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, AuthMiddleware, this.user.getProfile);
    this.router.put(this.path, AuthMiddleware, ValidationMiddleware(UpdateUserDto, 'body', { skipMissingProperties: true }), this.user.updateProfile);
    // this.router.delete(`${this.path}/:id(\\d+)`, this.user.deleteUser);
    this.router.delete(`${this.path}`, AuthMiddleware, this.user.deleteUser);
  }
}
