import { ObjectIdDto, PaginationDto, VaccinationDTO } from '@/dtos/users.dto';
import { HttpException } from '@/exceptions/httpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import db from '@/services/db.services';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { NextFunction, Response } from 'express';

export class VaccinationContoller {
  //Get a list of vaccinations paginated based on start, limit and search
  public find = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchParams = req.query as unknown as PaginationDto;

      const vaccinations = await db.vaccination.findMany({
        skip: +searchParams.start,
        take: +searchParams.limit,
        where: {
          name: {
            contains: searchParams.search,
          },
          userId: req.user.id,
        },
        select: {
          id: true,
          name: true,
          date: true,
        },
      });

      res.status(200).json(vaccinations);
    } catch (error) {
      next(error);
    }
  };

  //Add a new vaccination record
  public add = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const vaccination = req.body as unknown as VaccinationDTO;

      const result = await db.vaccination.create({
        data: {
          name: vaccination.name,
          date: dayjs.utc(vaccination.date).toDate(),
          userId: user.id,
        },
        select: {
          id: true,
          name: true,
          date: true,
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

      const result = await db.vaccination.deleteMany({
        where: {
          id: id,
          userId: user.id,
        },
      });
      if (result.count == 0) throw new HttpException(403, 'You are not allowed to delete this record.');
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  //Update a vaccination record based on id
  public update = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const { id } = req.params as unknown as ObjectIdDto;
      const vaccination = req.body as unknown as VaccinationDTO;

      const result = await db.vaccination.updateMany({
        data: {
          name: vaccination.name,
          date: dayjs.utc(vaccination.date).toDate(),
        },
        where: {
          id: id,
          userId: user.id,
        },
      });

      if (result.count == 0) throw new HttpException(403, 'You are not allowed to update this record');

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
