import { BANK_ID_API_URL, BANK_ID_CA_CERT, BANK_ID_RP_CERT, BANK_ID_RP_CERT_KEY, BANK_ID_RP_CERT_PASSKEY } from '@/config';
import { HttpException } from '@/exceptions/httpException';
import Axios, { AxiosInstance } from 'axios';
import https from 'https';
import { Service } from 'typedi';
import redis from './redis.services';

@Service()
export class BankIDService {
  private axios: AxiosInstance;

  constructor() {
    const agent = new https.Agent({
      cert: BANK_ID_RP_CERT,
      key: BANK_ID_RP_CERT_KEY,
      passphrase: BANK_ID_RP_CERT_PASSKEY,
      ca: BANK_ID_CA_CERT,
    });

    this.axios = Axios.create({
      httpsAgent: agent,
      baseURL: BANK_ID_API_URL,
    });
  }

  //Get the Auth start token from the BankID API
  async getAuthStartToken(): Promise<BankIDAuthResponse> {
    return this.axios
      .post('/auth', {
        endUserIp: '127.0.0.1',
      })
      .then(response => {
        const data = response.data as BankIDAuthResponse;
        return data;
      });
  }

  //Get the Auth status from the BankID API
  async getAuthStatus(orderRef: string): Promise<BankIDAuthStatusResponse> {
    return this.axios
      .post('/collect', { orderRef })
      .then(response => {
        const data = response.data as BankIDAuthStatusResponse;
        if (data.status === 'pending') {
          return this.getAuthStatus(orderRef);
        } else if (data.status === 'failed' || data.status === 'expired' || data.status === 'userCancel' || data.status === 'cancelled') {
          throw new HttpException(401, 'BankID authentication failed.');
        }
        return data;
      })
      .catch(error => {
        if (error instanceof HttpException) throw error;
        if (error.response.status === 400) throw new HttpException(401, 'BankID authentication failed.');
        throw new HttpException(error.response.status ?? 401, 'BankID authentication failed.');
      });
  }

  //Get the orderRef from Redis
  async getOrderRef(autoStartCode: string): Promise<string> {
    return redis.get(autoStartCode).then(data => {
      if (!data) throw new HttpException(401, 'BankID authentication failed.');
      const orderInfo = JSON.parse(data) as BankIDAuthResponse;
      return orderInfo.orderRef;
    });
  }

  //Save the autoStartCode in Redis with a TTL of 3 minutes
  async saveAutoStartCode(orderInfo: BankIDAuthResponse): Promise<string> {
    return redis.setEx(orderInfo.autoStartToken, 900, JSON.stringify(orderInfo));
  }

  //Save the AuthStatusResponse in Redis with a TTL of 2 minutes if successful
  async saveAuthStatus(authStatus: BankIDAuthStatusResponse): Promise<string> {
    if (authStatus.status === 'complete') {
      return redis.setEx(authStatus.orderRef, 120, JSON.stringify(authStatus));
    }
    return '';
  }

  //Verify the autoStartCode from Redis
  async verifyAutoStartCode(autoStartCode: string): Promise<BankIDAuthStatusResponse> {
    return this.getOrderRef(autoStartCode)
      .then(orderRef => redis.get(orderRef))
      .then(data => {
        if (!data) throw new HttpException(401, 'BankID authentication failed.');
        const authStatus = JSON.parse(data) as BankIDAuthStatusResponse;

        if (authStatus.status !== 'complete') throw new HttpException(401, 'BankID authentication failed.');

        return authStatus;
      });
  }
}

export interface BankIDAuthResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface BankIDAuthStatusResponse {
  orderRef: string;
  status: string;
  hintCode: string;
  completionData: {
    user: {
      personalNumber: string;
      name: string;
      givenName: string;
      surname: string;
    };
    device: {
      ipAddress: string;
    };
    cert: {
      notBefore: string;
      notAfter: string;
    };
    signature: string;
    ocspResponse: string;
  };
}

export default new BankIDService();
