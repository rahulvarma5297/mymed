//Create a generic email service to send emails using nodemailer
//Path: src\services\email.services.ts
import { Service } from 'typedi';
import nodemailer from 'nodemailer';
import otpTemplate from '@services/templates/otp';
import { HttpException } from '@/exceptions/httpException';
import nodemailerSendgrid from 'nodemailer-sendgrid';

@Service()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    //Create a Sendgrid transporter if process.env.SENDGRID_API key has been set
    //else use sendmail as the transporter.
    this.transporter = process.env.SENDGRID_API_KEY ? this.getSendGridTransporter() : this.getSendmailTransporter();
  }

  private getSendmailTransporter(): nodemailer.Transporter {
    //Use sendmail as the transporter
    return nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail',
    });
  }

  //Create a transporter using Sendgrid
  private getSendGridTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport(
      nodemailerSendgrid({
        apiKey: process.env.SENDGRID_API_KEY,
      }),
    );
  }

  public sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });
  };

  //Use the otp template in templates directory to replace the {{otp}} placeholder with the actual OTP.
  //Then send the email using the sendEmail function
  public sendOTP = async (to: string, otp: string): Promise<void> => {
    try {
      const html = otpTemplate.replace('{{otp}}', otp);
      await this.sendEmail(to, 'OTP', html);
    } catch (error) {
      throw new HttpException(500, 'Error sending OTP');
    }
  };
}

export default new EmailService();
