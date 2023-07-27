import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError, ValidatorOptions } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/httpException';

/**
 * @name ValidationMiddleware
 * @description Allows use of decorator and non-decorator based validation
 * @param type dto
 * @param skipMissingProperties When skipping missing properties
 * @param whitelist Even if your object is an instance of a validation class it can contain additional properties that are not defined
 * @param forbidNonWhitelisted If you would rather to have an error thrown when any non-whitelisted properties are present
 */
export const ValidationMiddleware = (type: any, dataObject: ValidationType = 'body', options: ValidatorOptions = {}) => {
  const { skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = true } = options;
  return (req: Request, res: Response, next: NextFunction) => {
    const dto = plainToInstance(type, req[dataObject], {
      enableImplicitConversion: true,
    });
    validateOrReject(dto, { skipMissingProperties, whitelist, forbidNonWhitelisted, stopAtFirstError: true })
      .then(() => {
        req[dataObject] = dto;
        next();
      })
      .catch((errors: ValidationError[]) => {
        const message = errors.map((error: ValidationError) => Object.values(error.constraints)).join(', ');
        next(new HttpException(400, message));
      });
  };
};

//Define a type that holds the values body, query or params.
//This will be used to define the type of the validation middleware.
type ValidationType = 'body' | 'query' | 'params';
