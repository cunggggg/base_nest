import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class CannotDownloadExternalException extends BadRequestException {
  constructor(type: string) {
    super({
      errorType: ErrorType.CannotDownloadExt,
      message: `Can not download video from ${type}`,
    });
  }
}
