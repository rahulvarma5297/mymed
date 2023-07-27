import { ConfigController } from '@/controllers/config.controller';
import { AuthMiddleware, splitNameQueryParam } from '@/middlewares/auth.middleware';
import { HealthParamConfigDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Router } from 'express';

export class ConfigRoutes implements Routes {
  public path = '/config';
  public router = Router();
  public config = new ConfigController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      this.path,
      AuthMiddleware,
      splitNameQueryParam,
      ValidationMiddleware(HealthParamConfigDto, 'query'),
      this.config.getHealthParamConfig,
    );
  }
}
