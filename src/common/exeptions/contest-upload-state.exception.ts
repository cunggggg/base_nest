import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestUploadStateException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestUploadState,
      message: `Can not upload video for this contest, contest state must be OPEN`,
    });
  }
}
