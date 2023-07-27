import { RequestWithUser } from '@/interfaces/auth.interface';
import db from '@/services/db.services';
import { User } from '@prisma/client';
import redis from '@/services/redis.services';

import { NextFunction, Response } from 'express';

export class UserController {
  //GET Function to hand the OTP request
  public getProfile = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      res.status(200).json(this.stripUser(user));
    } catch (error) {
      next(error);
    }
  };

  //Route to update the user profile
  public updateProfile = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      const profile = req.body as User;

      //Update the user profile in the database. It is of type User. Not all fields may be present in the request body.
      //So, we need to check if the field is present before updating it.

      Object.keys(profile).forEach(key => {
        if (profile[key] === undefined) {
          delete profile[key];
        }
      });

      const updatedUser = await db.user.update({
        where: {
          id: user.id,
        },
        data: profile,
      });

      res.status(200).json(this.stripUser(updatedUser));
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user.id;

      // Get a list of active access tokens from database.
      const activeTokens = await db.refreshToken.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
        },
      });

      // Delete all cached active refresh and JWT tokens from Redis
      const redisTokens = activeTokens.map(token => token.id);

      // Deleting the user will cascade delete all related data
      await db.user.delete({
        where: {
          id: userId,
        },
      });

      await redis.del(redisTokens);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private stripUser = (user: User): User => {
    delete user.id;
    delete user.createdAt;
    delete user.uuid;
    return user;
  };
}
