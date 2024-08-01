import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentSingleUploadException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContentSingleUpload,
      message: `User can upload only one video for this contest`,
    });
  }
}
