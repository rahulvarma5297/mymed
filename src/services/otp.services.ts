//Create a generic email service to send emails using nodemailer
//Path: src\services\email.services.ts
import { TWILIO_AUTH_TOKEN, TWILIO_SERVICE_ID, TWILIO_SID } from '@/config';
import { HttpException } from '@/exceptions/httpException';
import { Twilio } from 'twilio';
import { Service } from 'typedi';
import { otp } from '@prisma/client';

@Service()
export class OTPService {
  private twilio: Twilio;
  private serviceId = TWILIO_SERVICE_ID;

  constructor() {
    this.twilio = new Twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
  }

  public sendOTP = async (to: string): Promise<void> => {
    try {
      const verification = await this.twilio.verify.v2
        .services(this.serviceId)
        .verifications.create({ to, channel: 'sms' })
        .then(verification => console.log(verification.sid));
      console.log(verification);
    } catch (error) {
      throw new HttpException(500, 'Error sending OTP');
    }
  };

  public validateOTP = async (to: string, otp: string): Promise<otp> => {
    const isWhitelisted = process.env.NODE_ENV !== 'production' && process.env.WHITELISTED_NUMBERS?.split(',').includes(to);
    if (!isWhitelisted) {
      const verification = await this.twilio.verify.v2.services(this.serviceId).verificationChecks.create({ to, code: otp });

      if (verification?.status !== 'approved' && !isWhitelisted) throw new HttpException(401, 'Invalid OTP');
    }

    const otpInfo: otp = {
      id: to, //Just a placeholder
      identifier: to,
      otp: otp,
      type: 'PHONE',
      validated: true,
      createdAt: new Date(),
    };

    return otpInfo;
  };
}

export default new OTPService();
