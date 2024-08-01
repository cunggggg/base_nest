import { ConflictException, NotFoundException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserNotFoundException extends NotFoundException {
  constructor(username: string) {
    super({
      errorType: ErrorType.UserNotFound,
      message: `Can not find user with username '${username}'`,
    });
  }
}
