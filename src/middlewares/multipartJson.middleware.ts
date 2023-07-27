import { NextFunction, Request, Response } from 'express';

export const MultipartJSONBody = (field: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = req.body[field];
    if (body) {
      req.body = JSON.parse(body);
    }
    next();
  };
};
