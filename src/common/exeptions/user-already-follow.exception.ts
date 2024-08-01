import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserAlreadyFollowException extends BadRequestException {
  constructor(username: string) {
    super({
      errorType: ErrorType.UserAlreadyFollow,
      message: `${username} already followed`,
    });
  }
}
