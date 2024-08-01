import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentExistInContestException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContentExistInContest,
      message: `Content already exist on this contest`,
    });
  }
}
