import prisma from '@/services/db.services';
import redisClient from '@/services/redis.services';
import { Relation, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import {
  ArrayUnique,
  IsArray,
  IsAscii,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

//Get a list of unique health parameters from the database
export async function getHealthParams() {
  //Get the list of valid health parameters from Redis key 'healthParams'
  const rawHealthParams = await redisClient.get('healthParams');
  let healthParams: string[] = rawHealthParams ? JSON.parse(rawHealthParams) : [];
  if (healthParams.length === 0) {
    //Get the list of health parameters from the database
    const healthParamsFromDb = await prisma.healthParamUnits.findMany({
      select: {
        nameEN: true,
        nameSV: true,
      },
    });

    const healthParamsEN = healthParamsFromDb.map(hp => hp.nameEN.toLowerCase());
    const healthParamsSV = healthParamsFromDb.map(hp => hp.nameSV.toLowerCase());
    const uniqueParams = [...new Set(healthParamsEN.concat(healthParamsSV))];
    if (uniqueParams.length !== 0) {
      await redisClient.setEx('healthParams', 600, JSON.stringify(uniqueParams));
    }
    healthParams = uniqueParams;
  }
  return healthParams;
}

export function IsValidHealthParam(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsValidHealthParam',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        async validate(value: any) {
          const healthParams = await getHealthParams();
          return healthParams.indexOf(value.toLowerCase()) !== -1;
        },
      },
    });
  };
}

//Create a class to validate the request body to update the user profile
export class UpdateUserDto implements Partial<User> {
  @IsString()
  @MaxLength(128)
  public firstName: string;

  @IsString()
  @MaxLength(128)
  public lastName: string;

  @IsNumberString()
  @MaxLength(128)
  public phone: string;

  @IsEnum(['M', 'F', 'O', 'U'], { message: 'Type must be either M or F or O or U' })
  @IsNotEmpty()
  public gender: string;

  @IsNumber()
  @Max(500)
  @Min(0)
  public height: Decimal;
}

//Create a class to validate the request body for the OTP request
//consisting of a type field which is an enum of either 'EMAIL' or 'PHONE'
//and a value field which is a string
export class OTPRequestDto {
  @IsEnum(['EMAIL', 'PHONE'], { message: 'Type must be either EMAIL or PHONE' })
  @IsNotEmpty()
  public type: 'EMAIL' | 'PHONE';

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public value: string;
}

export class OTPRequestValidationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  public otp: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public token: string;
}

export class JWTRefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public refreshToken: string;
}

//Ignore eslint errors for this class
//Ignore prettier errors for this class

// prettier-ignore
export class PaginationDto {
  @Min(0)
  @IsNumber()
  public start:number;

  @Min(0)
  @Max(100)
  @IsNumber()
  public limit: number;

  @IsString()
  @IsAscii()
  @Length(0, 32)
  @IsOptional()
  public search: string;

  @IsEnum(['heartRateMachine', 'bpMachine', 'glucoseMachine', 'weightMachine'], { each: true, message: 'Invalid type. Accepted values are: heartRateMachine, bpMachine, glucoseMachine, weightMachine' })
  @IsOptional()
  public type?: string;

  @IsEnum(['asc', 'desc'], { message: 'Invalid sort value. Accepted values are: asc, desc' })
  @IsOptional()
  public sort?: string = 'asc';
}

export class MedicalHistoryDto {
  @IsEnum(['self', 'family'], { message: 'Relation must be either SELF or FAMILY' })
  @IsNotEmpty()
  public relation: Relation = 'self';
}

export class CreateIdListDto {
  @IsNotEmpty()
  @ArrayUnique()
  @IsArray()
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  public list: number[];
}

export class ObjectIdDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  public id: number;
}

export class HealthParamDto {
  @IsValidHealthParam('name', { each: true, message: 'Invalid parameter name.' })
  @IsNotEmpty()
  name: string;
}

export class HealthParamNameDto {
  @IsValidHealthParam('name', { each: true, message: 'Invalid parameter name.' })
  @IsOptional()
  name?: string[];
}

export class AddHealthDataDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsNumber()
  @IsOptional()
  deviceId: number = null;
}

export class AddHealthDataDtoArray {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  data: AddHealthDataDto[];
}

export class HealthDataRequestDto extends HealthParamDto {
  @IsDateString()
  @IsNotEmpty()
  @Length(8, 8)
  from: string;

  @IsDateString()
  @IsNotEmpty()
  @Length(8, 8)
  @IsOptional()
  to: string;

  @IsString()
  @IsEnum(['none', 'day', 'month', 'year'], { message: 'Aggregate must be either none, day, month, or year' })
  group: group = 'none';
}

export class BankIDValidateDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public autoStartToken: string;
}

export type group = 'day' | 'month' | 'year' | 'none';

export class VaccinationDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public name: string;

  @IsDateString({}, { message: 'Invalid date format.' })
  @IsNotEmpty()
  public date: string;
}

export class DocumentsDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public tag: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  public name: string;

  @IsDateString({}, { message: 'Invalid date format.' })
  @IsNotEmpty()
  public date: string;
}

export class HealthParamConfigDto {
  @IsArray()
  @IsOptional()
  @IsValidHealthParam('name', { each: true, message: 'Invalid parameter name.' })
  name: string[];
}
