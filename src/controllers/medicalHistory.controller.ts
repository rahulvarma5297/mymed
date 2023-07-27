import { CreateIdListDto, MedicalHistoryDto, PaginationDto } from '@/dtos/users.dto';
import { HttpException } from '@/exceptions/httpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import db from '@/services/db.services';
import { Relation } from '@prisma/client';

import { NextFunction, Response } from 'express';

export class MedicalHistoryController {
  //Get a list of all illnesses paginated based on start, limit and search
  public getIllnesses = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchParams = req.query as unknown as PaginationDto;

      const illnesses = await db.disease.findMany({
        skip: +searchParams.start,
        take: +searchParams.limit,
        where: {
          name: {
            contains: searchParams.search,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      res.status(200).json(illnesses);
    } catch (error) {
      next(error);
    }
  };

  //Method to get the Medical History of a user or user's family member.
  //The query parameter is of type MedicalHistoryDto
  public getMedicalHistory = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const { relation } = req.params as unknown as MedicalHistoryDto;

      const medicalHistory = await db.medicalHistory.findMany({
        where: {
          userId: user.id,
          relation,
        },
        select: {
          disease: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      //Flatten the array of medical history objects to an array of diseases
      const flatMedicalHistory = medicalHistory.map(medHistory => medHistory.disease);

      res.status(200).json(flatMedicalHistory);
    } catch (error) {
      next(error);
    }
  };

  //Method to add illnesses to the user's medical history.
  //The put query contains the diseaseId and the relation of the user to the disease.
  public putMedicalHistory = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      const { relation } = req.params;
      //Get the list of medical conditions from the request body
      const medHistoryUpdate = req.body as CreateIdListDto;

      //Check if the diseases exists in the database
      const diseases = await db.disease.findMany({
        where: {
          id: {
            in: medHistoryUpdate.list,
          },
        },
      });

      //If the number of diseases in the database is not equal to the number of diseases in the request body, throw an error
      if (diseases.length !== medHistoryUpdate.list.length) {
        throw new HttpException(400, 'Invalid disease id');
      }

      //Create an array of medical history objects
      const medicalHistoryData = medHistoryUpdate.list.map(disease => {
        return {
          diseaseId: disease,
          userId: user.id,
          relation: relation as Relation,
        };
      });

      //Delete existing medical history of the user in a transaction
      await db.$transaction([
        db.medicalHistory.deleteMany({
          where: {
            userId: user.id,
            relation: relation as Relation,
          },
        }),
        db.medicalHistory.createMany({
          data: medicalHistoryData,
        }),
      ]);

      res.status(200).json({ message: 'Medical history updated successfully' });
      //Insert the medical history into the database
    } catch (error) {
      next(error);
    }
  };
}
