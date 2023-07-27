import { User } from '@prisma/client';
import { Request } from 'express';

export interface DataStoredInToken {
  id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
}

export interface RequestWithUserAndFile extends RequestWithUser {
  file: Express.Multer.File;
}

export interface TokenState {
  token: string;
  userId: number;
  isValid: boolean;
}
