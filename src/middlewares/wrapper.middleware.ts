import { NextFunction, Request, Response } from 'express';

export const BodyArrayWrapper = (req: Request, res: Response, next: NextFunction) => {
  req.body = { body: req.body };
  next();
};
