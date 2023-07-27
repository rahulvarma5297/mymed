import db from '@/services/db.services';
import { JWT_SECRET, JWT_TTL, OTP_TTL, REFRESH_TOKEN_TTL } from '@config';
import { HttpException } from '@exceptions/httpException';
import { DataStoredInToken, TokenData, TokenState } from '@interfaces/auth.interface';
import { AuthType, User, otp } from '@prisma/client';
import { sign } from 'jsonwebtoken';
import { otpGen } from 'otp-gen-agent';
import { Service } from 'typedi';
import { v4 as uuid } from 'uuid';
import redis from './redis.services';

@Service()
export class AuthService {
  public createJWT(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.uuid };
    const secretKey: string = JWT_SECRET;
    const expiresIn: number = JWT_TTL;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  //Method to create a refresh token using uuid
  public async createRefreshToken(user: User): Promise<string> {
    const refreshToken = uuid();

    //Save the refresh token in MySQL database
    await db.refreshToken.create({
      data: {
        id: refreshToken,
        userId: user.id,
      },
    });
    return redis.setEx(refreshToken, REFRESH_TOKEN_TTL * 24 * 60 * 60, user.id.toString()).then(() => refreshToken);
  }

  //Check if the refresh token is valid
  public async getRefreshTokenStatus(refreshToken: string): Promise<TokenState> {
    return redis.get(refreshToken).then(userId => ({
      isValid: !!userId,
      token: refreshToken,
      userId: +userId,
    }));
  }

  //Method to create a cookie with the JWT token
  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }

  //Function to generate a new OTP and save it in the database
  public generateOTP = async (identifier: string, type: AuthType): Promise<otp> => {
    try {
      //Generate an OTP using otp-gen-agent
      const otp: string = await otpGen();

      //Save the OTP in the database for audit trail
      const otpRecord = await db.otp.create({
        data: {
          identifier,
          type,
          otp,
        },
      });

      await redis.setEx(otpRecord.id, OTP_TTL, otpRecord.otp);

      return otpRecord;
    } catch (error) {
      throw new HttpException(500, 'Unable to generate OTP');
    }
  };

  //Function to validate the OTP based on the id and otp and
  //return the OTP object if it is valid
  public validateOTP = async (id: string, otp: string): Promise<otp> => {
    //Find the OTP in REDIS
    const otpInRedis = await redis.get(id);

    //Throw an HTTP 401 error if the OTP is not found or is invalid
    if (!otpInRedis || otpInRedis !== otp) {
      throw new HttpException(401, 'Invalid OTP');
    }

    //Mark the OTP as used in the database for audit trail
    const otpInfo = await db.otp.update({
      where: {
        id,
      },
      data: {
        validated: true,
      },
    });

    //Delete the OTP from REDIS
    await redis.del(id);

    //Throw an HTTP 401 error if the OTP is not found or is invalid
    if (!otpInfo) {
      throw new HttpException(401, 'Invalid OTP');
    }

    return otpInfo;
  };

  // Delete the refresh token from Redis
  public async deleteRefreshToken(refreshToken: string): Promise<void> {
    const userId = await redis.get(refreshToken);
    const userIdFromDb = await db.refreshToken.findUnique({
      where: {
        id: refreshToken,
      },
      select: {
        userId: true,
      },
    });
    if (userIdFromDb?.userId === +userId) {
      await redis.del(refreshToken);
    } else {
      throw new HttpException(403, 'Forbidden');
    }
  }

  public async setToken(token: string, value: number, ttl: number): Promise<void> {
    await redis.setEx(token, ttl, value.toString());
  }

  // When a JWT refresh request comes in and there is no refresh token in Redis, ensure that you mark the refresh token in the DB for the user as inactive by setting active = 0;
  public async invalidateRefreshToken(refreshToken: string) {
    await db.refreshToken.update({
      where: {
        id: refreshToken,
      },
      data: {
        active: false,
      },
    });
  }
}

export default new AuthService();
