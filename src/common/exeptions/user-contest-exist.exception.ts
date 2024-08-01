import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserContestExistsException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.UserContestExists,
      message: `Contest already have this user`,
    });
  }
}
