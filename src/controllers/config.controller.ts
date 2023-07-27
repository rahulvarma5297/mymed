import { HealthParamConfigDto } from '@/dtos/users.dto';
import { RequestWithUser } from '@/interfaces/auth.interface';
import db from '@/services/db.services';
import { getSVToENMapping } from '@/utils/healthParams.utils';
import { NextFunction, Response } from 'express';

export class ConfigController {
  public getHealthParamConfig = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { name } = req.query as unknown as HealthParamConfigDto;

      const svToENMapping = await getSVToENMapping();
      const names = name?.length
        ? name.map(name => svToENMapping[name.toLowerCase()].nameEN)
        : Object.values(svToENMapping).map(param => param.nameEN);

      const healthParamUnit = await db.healthParamUnits.findMany({
        where: { nameEN: { in: names } },
      });

      if (!healthParamUnit) {
        return res.status(404).json({ error: 'Health parameter not found' });
      }

      const healthParamRanges = await db.healthParamUnits.findMany({
        where: {
          id: { in: healthParamUnit.map(unit => unit.id) },
          ranges: {
            some: { id: { not: undefined } },
          },
        },
        select: {
          nameEN: true,
          ranges: {
            select: {
              min: true,
              max: true,
              color: true,
              description: true,
            },
          },
        },
      });

      res.json(healthParamRanges);
    } catch (error) {
      next(error);
    }
  };
}
