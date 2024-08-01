import { ConfigService } from '@nestjs/config';
import * as path from 'path';

export class StorageHelper {
  /**
   * Get media path
   * @param domain
   * @param fileName
   * @param configService {ConfigService}
   */
  public static getMediaPath(
    domain: string,
    fileName: string,
    configService: ConfigService,
  ): any {
    const root = configService.get('FIREBASE_STORAGE_CONTENT_ROOT');
    return {
      media: `${root}/${domain}/${fileName}`,
      thumbnail: `${root}/${domain}/${path.parse(fileName).name}.png`,
    };
  }

  /**
   * Get user storage path
   * @param domain
   * @param fileName
   * @param configService {ConfigService}
   */
  public static getUserFilePath(
    domain: string,
    fileName: string,
    configService: ConfigService,
  ): any {
    const root = configService.get('FIREBASE_STORAGE_USER_ROOT');
    return `${root}/${domain}/${fileName}`;
  }

  /**
   * Get asset path
   * @param domain
   * @param fileName
   * @param configService {ConfigService}
   */
  public static getAssetPath(
    domain: string,
    fileName: string,
    configService: ConfigService,
  ): any {
    const root = configService.get('FIREBASE_STORAGE_ASSET_ROOT');
    return `${root}/${domain}/${fileName}`;
  }
}
