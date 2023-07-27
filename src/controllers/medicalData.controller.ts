import { AddHealthDataDto, HealthDataRequestDto, HealthParamDto, ObjectIdDto, getHealthParams } from '@/dtos/users.dto';
import { HttpException } from '@/exceptions/httpException';
import { RequestWithUser, RequestWithUserAndFile } from '@/interfaces/auth.interface';
import db from '@/services/db.services';
import { HealthParamUnits } from '@prisma/client';
import dayjs from 'dayjs';
//Extends dayjs with timezone and utc plugins
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/sv';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Europe/Stockholm');

import ExcelJS from 'exceljs';
import { NextFunction, Response } from 'express';
import { aggregate, backfillData } from '@/utils/aggregate';
import { getSVToENMapping } from '@/utils/healthParams.utils';

export class MedicalDataController {
  // Add a medical data entry. The data is in the format MedicalDataDto
  public addHealthData = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { id } = req.user;
      const { body } = req.body as { body: AddHealthDataDto[] };
      const { name } = req.params as unknown as HealthParamDto;

      const svToENMapping = await getSVToENMapping();

      const medicalData = body.map(data => ({
        value: data.value,
        name: svToENMapping[name.toLowerCase()].nameEN,
        date: dayjs.utc(data.date).toDate(),
        userId: id,
        unitsId: svToENMapping[name.toLowerCase()].id,
      }));

      await db.medicalData.createMany({
        data: medicalData,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // Delete a medical data entry by id
  public async deleteHealthData(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as unknown as ObjectIdDto;

      const result = await db.medicalData.deleteMany({
        where: {
          id: id,
          userId: req.user.id,
        },
      });

      if (result.count === 0) {
        throw new HttpException(404, 'Medical Data not found');
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Update a medical data entry by id and user id
  public async updateHealthData(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as unknown as ObjectIdDto;
      const data = req.body as unknown as AddHealthDataDto;

      const result = await db.medicalData.update({
        where: {
          user_id: {
            id: id,
            userId: req.user.id,
          },
        },
        data: {
          ...data,
          date: dayjs.utc(data.date).toDate(),
        },
        select: {
          id: true,
          name: true,
          value: true,
          date: true,
          units: {
            select: {
              unit: true,
            },
          },
        },
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  //Get timeseries data for a user by name and date range
  public getHealthDataTS = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { id } = req.user;
      const { name } = req.params as unknown as HealthParamDto;
      const { from, to, group } = req.query as unknown as HealthDataRequestDto;

      let result = await db.medicalData.findMany({
        where: {
          userId: id,
          name: name,
          date: {
            gte: dayjs.utc(from, 'YYYYMMDD').toISOString(),
            lte: (to ? dayjs.utc(to, 'YYYYMMDD') : dayjs.utc()).endOf('day').toISOString(),
          },
        },
        select: {
          date: true,
          value: true,
          units: {
            select: {
              unit: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      const unit = result.length ? result[0].units.unit : (await getSVToENMapping())[name.toLowerCase()].unit;

      //If the averaging is day or month, we need to average the data over the day or month respectively
      result = backfillData(aggregate(result, group), req.query as unknown as HealthDataRequestDto, unit);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  //Get health snapshot data for a user by name and date range
  public getHealthSnapshot = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { id } = req.user;
      const { name } = req.query;
      let names = name?.length
        ? (name as string[])
        : ['weight', 'systolic', 'diastolic', 'bloodsugarshortterm', 'bloodsugarlongterm', 'pulse', 'sleep', 'steps', 'bmi'];

      const svToENMapping = await getSVToENMapping();

      names = names.map(name => svToENMapping[name.toLowerCase()].nameEN);
      //Get the last entry for each of the given health parameters in the array names
      const result = await db.medicalData.findMany({
        where: {
          userId: id,
          name: {
            in: names,
          },
        },
        select: {
          id: true,
          date: true,
          value: true,
          name: true,
          units: {
            select: {
              unit: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        distinct: ['name'],
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  //Accept an Excel file upload.
  //The file is parsed and the data is stored in the database.
  public uploadMedicalData = async (req: RequestWithUserAndFile, res: Response, next: NextFunction) => {
    try {
      const { id } = req.user;

      //Open the file and parse the data using exceljs
      const workbook = new ExcelJS.Workbook();
      //Load the file based on path in request.file.path
      await workbook.xlsx.readFile(req.file.path);

      const worksheet = workbook.worksheets[0];

      //Get the data from the worksheet.
      //The data is in the format:
      // The first column is the date
      // The remaining columns contain the names of the medical data
      // The rows contain the values for the medical data
      const data = worksheet.getSheetValues().slice(1) as Array<Array<any>>;

      //Get the names of the medical data from the first row
      const indices = {
        date: data[0].findIndex(header => header === 'Datum' || header === 'Date'),
        time: data[0].findIndex(header => header === 'Tid' || header === 'Time'),
      };

      //Throw an error if the date is missing.
      //If both date and time are present, we need to combine the too. Else assume that date includes time.
      if (indices.date === -1) {
        throw new HttpException(400, 'Invalid file format');
      }

      const healthParams = await getHealthParams();

      //Iterate over the first row and store the index of each name that is in heatlhParams
      const healthParamsToAdd = data[0].filter((name, index) => {
        if (healthParams.includes(name.toLowerCase())) {
          indices[name] = index;
          return true;
        }
      });

      //Throw an error if indices does not contain any names
      if (Object.keys(indices).length === 2) {
        throw new HttpException(400, 'Invalid file format');
      }

      //Create an array of objects containing the data for each medical data
      const heatlhData = [];
      const healthParamsSVtoEN = await getSVToENMapping();
      //The data is in the format:
      // The first column is the date
      // The second column is the time
      // The remaining columns contain the values for the medical data
      data.slice(1).forEach(row => {
        const date = row[indices.date];
        const time = row[indices.time];

        const parsedDate = parseDate(date, time);

        healthParamsToAdd.forEach(name => {
          const value = row[indices[name]];
          if (value === undefined || value === null || value === '') return;
          const unitMap = healthParamsSVtoEN[name.toLowerCase()];
          heatlhData.push({
            date: parsedDate,
            name: unitMap.nameEN || name,
            value: value,
            userId: id,
            unitsId: unitMap.id,
          });
        });
      });

      const insertedData = await db.$transaction(
        heatlhData.map(dataPoint =>
          db.medicalData.create({
            data: dataPoint,
            select: {
              id: true,
              name: true,
              value: true,
              date: true,
              units: {
                select: {
                  unit: true,
                },
              },
            },
          }),
        ),
      );
      res.status(200).json(insertedData);
    } catch (error) {
      next(error);
    }
  };
}

//Utility function to concat to columns:
//1. The date like 21 jan 2021
//2. The time like 12:00
//Parse the combination as a date and return it
function parseDate(date: string, time: string) {
  const rawDateTime = time?.length ? `${date} ${time}` : date;
  const parsedDate = time?.length ? dayjs.utc(rawDateTime, 'D MMM YYYY HH:mm', 'sv') : dayjs.utc(date);

  //Parse the date and time and return the result as a date
  if (!parsedDate.isValid()) throw new HttpException(400, `Invalid date value provided -  ${rawDateTime}`);
  return parsedDate.tz('CET', true).toDate();
}
