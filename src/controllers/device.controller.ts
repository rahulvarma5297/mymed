import { CreateIdListDto, ObjectIdDto, PaginationDto } from '@/dtos/users.dto';
import { HttpException } from '@/exceptions/httpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import db from '@/services/db.services';
import { Relation } from '@prisma/client';

import { NextFunction, Response } from 'express';

export class MedicalDeviceContoller {
  //Get a list of medical devices paginated based on start, limit and search
  public getAllMedicalDevices = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const searchParams = req.query as unknown as PaginationDto;
      const { type } = searchParams;

      const categoryCondition = type
        ? {
            description: {
              in: this.getDeviceDescriptionsByType(type),
            },
          }
        : {};

      const devices = await db.medicalDevice.findMany({
        skip: +searchParams.start,
        take: +searchParams.limit,
        where: {
          name: {
            contains: searchParams.search,
          },
          ...categoryCondition,
        },
        select: {
          id: true,
          name: true,
        },
      });

      res.status(200).json(devices);
    } catch (error) {
      next(error);
    }
  };

  //Link a list of medical devices to the user
  public addDevices = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const { list: medicalDevices } = req.body as unknown as CreateIdListDto;

      const userMedicalDevices = medicalDevices.map(medicalDevice => ({
        userId: user.id,
        deviceId: medicalDevice,
      }));

      //Delete existing medical devices of the user in a transaction
      await db.$transaction([
        db.userMedicalDevice.deleteMany({
          where: {
            userId: user.id,
          },
        }),
        db.userMedicalDevice.createMany({
          data: userMedicalDevices,
        }),
      ]);

      const userDevices = await db.userMedicalDevice.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          deviceId: true,
        },
      });

      res.status(200).json(userDevices);
    } catch (error) {
      next(error);
    }
  };

  //Add a single medical device to the user
  public addDevice = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const { id: medicalDevice } = req.params as unknown as ObjectIdDto;

      const userMedicalDevice = {
        userId: user.id,
        deviceId: medicalDevice,
      };

      //Add the medical device to the user if it does not exist
      const device = await db.userMedicalDevice.upsert({
        where: {
          user_device: {
            userId: user.id,
            deviceId: medicalDevice,
          },
        },
        create: userMedicalDevice,
        update: userMedicalDevice,
        select: {
          id: true,
          deviceId: true,
        },
      });

      res.status(200).json(device);
    } catch (error) {
      next(error);
    }
  };

  //Get a list of medical devices added by the user
  public getUserMedicalDevices = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const medicalDevices = await db.userMedicalDevice.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          deviceId: true,
          device: {
            select: {
              name: true,
            },
          },
        },
      });

      const response = medicalDevices.map(medicalDevice => ({
        id: medicalDevice.id,
        deviceId: medicalDevice.deviceId,
        name: medicalDevice.device.name,
      }));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  //Method to delete a medical device from the user
  public deleteMedicalDevice = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const { id: medicalDevice } = req.params as unknown as ObjectIdDto;

      //Delete the medical device from the user
      await db.userMedicalDevice.deleteMany({
        where: {
          id: medicalDevice,
          deviceId: user.id,
        },
      });

      res.status(200).json({ message: 'Medical device deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  private getDeviceDescriptionsByType(type: string): string[] {
    const categoryMap = {
      heartRateMachine: ['Pulse Oximeter', 'Heart Rate Monitor'],
      bpMachine: ['Blood Pressure Monitor'],
      glucoseMachine: ['Blood Glucose Meter'],
      weightMachine: ['Smart Scale'],
    };
    return categoryMap[type] || [];
  }
}
