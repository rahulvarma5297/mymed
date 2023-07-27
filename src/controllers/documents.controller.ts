import { DocumentsDTO, ObjectIdDto, PaginationDto, VaccinationDTO } from '@/dtos/users.dto';
import { HttpException } from '@/exceptions/httpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import fs from 'fs';
import db from '@/services/db.services';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import path from 'path';
dayjs.extend(utc);

import { NextFunction, Response } from 'express';

const folders = ['uploads/excel', 'uploads/images', 'uploads/pdf'];

export class DocumentsController {
  private basePath: string;

  constructor() {
    //Ensure the the uploads folder exists
    folders.forEach(folder => {
      this.basePath = path.resolve(__dirname, '../..');
      const folderPath = path.join(this.basePath, folder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    });
  }

  //Get a list of documents paginated based on start, limit and search
  public find = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchParams = req.query as unknown as PaginationDto;

      const files = await db.documents.findMany({
        skip: +searchParams.start,
        take: +searchParams.limit,
        where: {
          tag: {
            contains: searchParams.search,
          },
          userId: req.user.id,
        },
        select: {
          id: true,
          tag: true,
          name: true,
          path: true,
          date: true,
        },
        orderBy: {
          date: searchParams.sort === 'desc' ? 'desc' : 'asc',
        },
      });

      res.status(200).json(files);
    } catch (error) {
      next(error);
    }
  };

  //Add a new document record
  public add = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const document = req.body as unknown as DocumentsDTO;
      const filePath = req.file.path.replace(this.basePath, '').replace(/\\/g, '/');
      const result = await db.documents.create({
        data: {
          tag: document.tag,
          name: document.name,
          date: dayjs.utc(document.date).toDate(),
          path: filePath,
          userId: user.id,
        },
        select: {
          id: true,
          name: true,
          tag: true,
          date: true,
          path: true,
        },
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  //Delete a vaccination record based on id
  public delete = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params as unknown as ObjectIdDto;

      //Get the file path
      const file = await db.documents.findUnique({
        where: {
          id_userId: {
            id: id,
            userId: user.id,
          },
        },
        select: {
          path: true,
        },
      });

      if (!file) throw new HttpException(403, 'You are not allowed to delete this record.');
      const filePath = this.basePath + file.path;
      const result = await db.documents.delete({
        where: {
          id_userId: {
            id: id,
            userId: user.id,
          },
        },
      });

      fs.unlinkSync(filePath);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public authorize = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    //Get the file path from request uri
    const path = '/uploads' + req.path;

    //Check the database
    const file = await db.documents.findFirst({
      where: {
        path: path,
        userId: req.user.id,
      },
    });

    if (!file) {
      res.status(403).send('You are not allowed to access this file.');
      return;
    }
    next();
  };
}
