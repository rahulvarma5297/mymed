import { OTPRequestDto, OTPRequestValidationDto } from '@/dtos/users.dto';
import { REFRESH_TOKEN_TTL } from '@config';
import { HttpException } from '@/exceptions/httpException';
import authService from '@/services/auth.service';
import bankidServices from '@/services/bankid.services';
import db from '@/services/db.services';
import emailServices from '@/services/email.services';
import otpServices from '@/services/otp.services';
import redisClient from '@/services/redis.services';
import { User, otp } from '@prisma/client';

import { NextFunction, Request, Response } from 'express';

export class AuthController {
  //GET Function to hand the OTP request
  public getOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const otpData: OTPRequestDto = req.body;

      let token = otpData.value;

      if (otpData.type === 'PHONE') {
        await otpServices.sendOTP(otpData.value);
      } else {
        //Generate an OTP using otp-gen-agent
        const otp = await authService.generateOTP(otpData.value, otpData.type);
        token = otp.id;
        //Send the OTP to the user's email using the Email service
        await emailServices.sendOTP(otpData.value, otp.otp);
      }
      await this.setAuthMode(token, otpData.type);

      res.status(200).json({ message: 'OTP sent', token });
    } catch (error) {
      next(error);
    }
  };

  private setAuthMode = async (identifier: string, type: 'EMAIL' | 'PHONE' | 'BANKID'): Promise<void> => {
    redisClient.setEx(`authMode:${identifier}`, 600, type);
  };

  private getAuthMode = async (identifier: string): Promise<'EMAIL' | 'PHONE' | 'BANKID' | null> => {
    const authMode = await redisClient.get(`authMode:${identifier}`);
    return authMode as 'EMAIL' | 'PHONE' | 'BANKID' | null;
  };

  //POST Function to handle the OTP validation
  public validateOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const otpData: OTPRequestValidationDto = req.body;

      //Get the auth mode from redis
      const authMode = await this.getAuthMode(otpData.token);
      if (!authMode) throw new HttpException(401, 'Invalid token');

      let otp: otp;
      const userIdentifier: Partial<User> = {};
      if (authMode === 'EMAIL') {
        // Validate the OTP
        otp = await authService.validateOTP(otpData.token, otpData.otp);
        userIdentifier.email = otp.identifier;
      } else if (authMode === 'PHONE') {
        otp = await otpServices.validateOTP(otpData.token, otpData.otp);
        userIdentifier.phone = otp.identifier;
      }

      // Get the user from the database
      let user = await db.user.findFirst({
        where: {
          AuthMode: {
            some: {
              identifier: otp.identifier,
              type: authMode,
            },
          },
        },
      });

      // Create a new user if the user does not exist
      if (!user) {
        user = await db.user.create({
          data: {
            ...userIdentifier,
            AuthMode: {
              create: {
                identifier: otp.identifier,
                type: authMode,
              },
            },
          },
        });
      }

      // Generate a JWT token for the user using jsonwebtoken
      const token = await authService.createJWT(user);
      const refreshToken = await authService.createRefreshToken(user);

      res.status(200).json({ jwt: token, refreshToken });
    } catch (error) {
      next(error);
    }
  };

  //POST Function to handle the refresh JWT
  public refreshJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      //Get the refresh token from the request body
      const { refreshToken } = req.body;

      //Get the user id from the refresh token
      const tokenStatus = await authService.getRefreshTokenStatus(refreshToken);

      if (!tokenStatus.isValid) {
        // Invalidate the refresh token in the database
        await authService.invalidateRefreshToken(refreshToken);
        throw new HttpException(401, 'Invalid refresh token');
      }

      //Fetch the user from database.
      const user = await db.user.findUnique({ where: { id: tokenStatus.userId } });

      //Generate a new JWT token for the user
      const token = await authService.createJWT(user);

      //Reset the reset token expiry to 1 month.
      await authService.setToken(refreshToken, tokenStatus.userId, REFRESH_TOKEN_TTL * 24 * 60 * 60);

      res.status(200).json({ jwt: token });
    } catch (error) {
      next(error);
    }
  };

  //GET the autoStartToken from the BankID API
  public getBankIDAutoStartToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orderInfo = await bankidServices.getAuthStartToken();

      await bankidServices.saveAutoStartCode(orderInfo);
      res.status(200).json({ autoStartToken: orderInfo.autoStartToken });
    } catch (error) {
      next(error);
    }
  };

  //POST Function to handle the BankID authentication
  public validateBankIDAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { autoStartToken } = req.body;

      //Get the order info from the database
      const orderRef = await bankidServices.getOrderRef(autoStartToken);
      const authStatus = await bankidServices.getAuthStatus(orderRef);

      if (!authStatus.completionData || authStatus.status !== 'complete') {
        throw new HttpException(401, 'BankID authentication failed.');
      }

      //Get the user from the database
      let user = await db.user.findFirst({
        where: {
          AuthMode: {
            some: {
              identifier: authStatus.completionData.user.personalNumber,
              type: 'BANKID',
            },
          },
        },
      });

      //Create a new user if the user does not exist
      if (!user) {
        user = await db.user.create({
          data: {
            firstName: authStatus.completionData.user.givenName,
            lastName: authStatus.completionData.user.surname,
            AuthMode: {
              create: {
                identifier: authStatus.completionData.user.personalNumber,
                type: 'BANKID',
              },
            },
          },
        });
      }

      //Generate a JWT token for the user using jsonwebtoken
      const token = await authService.createJWT(user);
      const refreshToken = await authService.createRefreshToken(user);

      res.status(200).json({ jwt: token, refreshToken });
    } catch (error) {
      next(error);
    }
  };

  // Logout the user
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      // Delete the refresh token from the Redis database
      await authService.deleteRefreshToken(refreshToken);

      const jwtToken = req.headers.authorization.split(' ')[1];

      // Add the JWT token to redis with value = 0 and TTL of 1 hour
      await authService.setToken(jwtToken, 0, 60 * 60);

      res.status(200).json({ message: 'User logged out' });
    } catch (error) {
      next(error);
    }
  };
}
