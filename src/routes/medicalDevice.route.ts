import { MedicalDeviceContoller } from '@/controllers/device.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { CreateIdListDto, ObjectIdDto, PaginationDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Router } from 'express';

export class MedicalDevicesRoutes implements Routes {
  public path = '/devices';
  public router = Router();
  private devices = new MedicalDeviceContoller();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, AuthMiddleware, ValidationMiddleware(PaginationDto, 'query'), this.devices.getAllMedicalDevices);
    this.router.get(`/profile${this.path}`, AuthMiddleware, this.devices.getUserMedicalDevices);
    this.router.put(`/profile${this.path}`, AuthMiddleware, ValidationMiddleware(CreateIdListDto, 'body'), this.devices.addDevices);
    this.router.put(`/profile${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ObjectIdDto, 'params'), this.devices.addDevice);
    this.router.get(`/profile${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ObjectIdDto, 'params'), this.devices.addDevice);
    this.router.delete(`/profile${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ObjectIdDto, 'params'), this.devices.deleteMedicalDevice);
  }
}
