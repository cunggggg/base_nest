import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class InvalidUploadExternalResourceException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.InvalidUploadExt,
      message: 'Type must be tiktok or instagram',
    });
  }
}
