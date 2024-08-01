import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentNotExistInContestException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContentNotExistInContest,
      message: `Content not exist on this contest`,
    });
  }
}
