import { VaccinationContoller } from '@/controllers/vaccination.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { ObjectIdDto, PaginationDto, VaccinationDTO } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Router } from 'express';

export class VaccinationRoutes implements Routes {
  public path = '/vaccination';
  public router = Router();
  private controller = new VaccinationContoller();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, AuthMiddleware, ValidationMiddleware(PaginationDto, 'query'), this.controller.find);
    this.router.put(this.path, AuthMiddleware, ValidationMiddleware(VaccinationDTO, 'body'), this.controller.add);
    this.router.patch(
      `${this.path}/:id`,
      AuthMiddleware,
      ValidationMiddleware(ObjectIdDto, 'params'),
      ValidationMiddleware(VaccinationDTO, 'body'),

      this.controller.update,
    );
    this.router.delete(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ObjectIdDto, 'params'), this.controller.delete);
  }
}
