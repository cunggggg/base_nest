import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserNotFollowException extends BadRequestException {
  constructor(username: string) {
    super({
      errorType: ErrorType.UserNotFollow,
      message: `${username} is not followed before`,
    });
  }
}
