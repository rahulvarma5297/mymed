import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from '@config';
import { HttpException } from '@exceptions/httpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import redis from '@services/redis.services';
import prisma from '@/services/db.services';

const getAuthorization = (req: RequestWithUser) => {
  const cookie = req.cookies['Authorization'];
  if (cookie) return cookie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { id } = (await verify(Authorization, JWT_SECRET)) as DataStoredInToken;
      const users = prisma.user;
      const findUser = await users.findUnique({ where: { uuid: id } });

      if (findUser) {
        // Check if the JWT token has been blocked
        const isBlocked = (await redis.get(Authorization)) === '0';
        if (isBlocked) {
          next(new HttpException(401, 'You are not authorized to access this resource.'));
        }
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'You are not authorized to access this resource.'));
      }
    } else {
      next(new HttpException(401, 'You are not authorized to access this resource.'));
    }
  } catch (error) {
    next(new HttpException(401, 'You are not authorized to access this resource.'));
  }
};

export function splitNameQueryParam(req: RequestWithUser, res: Response, next: NextFunction) {
  const { name } = req.query;
  if (name) {
    req.query.name = name.split(',').map((param: string) => param.trim());
  }
  next();
}
