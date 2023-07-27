import { HealthParamUnits } from '@prisma/client';
import db from '@/services/db.services';

export const getSVToENMapping = async (): Promise<{ [index: string]: HealthParamUnits }> => {
  const healthParams = await db.healthParamUnits.findMany({
    select: {
      nameEN: true,
      nameSV: true,
      unit: true,
      id: true,
    },
  });

  const mapping = {};
  healthParams.forEach(param => {
    mapping[param.nameSV.toLowerCase()] = param;
    mapping[param.nameEN.toLowerCase()] = param;
  });

  return mapping;
};
