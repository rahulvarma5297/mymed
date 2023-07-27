import { DocumentsController } from '@/controllers/documents.controller';
import { AuthMiddleware } from '@/middlewares/auth.middleware';
import { excelMimes, imageMimes, pdfMimes, uploaderMiddleware } from '@/middlewares/uploader.middleware';
import { MultipartJSONBody } from '@/middlewares/multipartJson.middleware';
import { DocumentsDTO, ObjectIdDto, PaginationDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Router } from 'express';
import express from 'express';

export class DocumentsRoutes implements Routes {
  public path = '/documents';
  public router = Router();
  private controller = new DocumentsController();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(this.path, AuthMiddleware, ValidationMiddleware(PaginationDto, 'query'), this.controller.find);
    this.router.post(
      this.path,
      AuthMiddleware,
      uploaderMiddleware(pdfMimes.concat(imageMimes, excelMimes), '/uploads'),
      MultipartJSONBody('payload'),
      ValidationMiddleware(DocumentsDTO, 'body'),
      this.controller.add,
    );
    this.router.delete(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(ObjectIdDto, 'params'), this.controller.delete);
    this.router.use('/uploads', AuthMiddleware, this.controller.authorize, express.static('uploads'));
  }
}
