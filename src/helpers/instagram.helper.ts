import axios from 'axios';
import { ConfigService } from '@nestjs/config';

export class InstagramHelper {
  private static apiRoot = 'https://graph.instagram.com';

  /**
   * Verify instagram token
   * @param token {string}
   * @param configService {ConfigService}
   */
  public static async getLongToken(
    token: string,
    configService: ConfigService,
  ): Promise<any> {
    try {
      const response = await axios.get(`${this.apiRoot}/access_token`, {
        params: {
          access_token: token,
          grant_type: configService.get('INSTAGRAM_GRANT_TYPE'),
          client_secret: configService.get('INSTAGRAM_CLIENT_SECRET'),
        },
      });
      return {
        access_token: response.data.access_token,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error.response?.data.error,
      };
    }
  }

  /**
   * verify token
   * @param token {string}
   */
  public static async verifyToken(token: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiRoot}/me`, {
        params: {
          access_token: token,
          fields: 'id,username',
        },
      });
      return {
        ...response.data,
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: error.response?.data.error,
      };
    }
  }
}
