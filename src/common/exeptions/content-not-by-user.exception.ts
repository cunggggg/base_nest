import { ConflictException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentNotByUserException extends ConflictException {
  constructor() {
    super({
      errorType: ErrorType.ContentNotByUser,
      message: `Content was not upload by this user`,
    });
  }
}
