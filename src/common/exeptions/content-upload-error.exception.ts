import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentUploadErrorException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContentUploadError,
      message: `Fail to process this file, please try again`,
    });
  }
}
