import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UnlimitedContestUploadStateException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.UnlimitedContestUploadState,
      message: `Can not upload video for this contest, contest state must be OPEN or VOTING`,
    });
  }
}
