import { MedicalHistoryController } from '@/controllers/medicalHistory.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { CreateIdListDto, MedicalHistoryDto, PaginationDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Router } from 'express';

export class MedicalHistoryRoutes implements Routes {
  public path = '/medical-conditions';
  public router = Router();
  private medHistory = new MedicalHistoryController();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, AuthMiddleware, ValidationMiddleware(PaginationDto, 'query'), this.medHistory.getIllnesses);

    this.router.get(`${this.path}/:relation`, AuthMiddleware, ValidationMiddleware(MedicalHistoryDto, 'params'), this.medHistory.getMedicalHistory);
    this.router.put(
      `${this.path}/:relation`,
      AuthMiddleware,
      ValidationMiddleware(MedicalHistoryDto, 'params'),
      ValidationMiddleware(CreateIdListDto, 'body'),
      this.medHistory.putMedicalHistory,
    );
  }
}
