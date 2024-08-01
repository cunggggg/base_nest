import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserNotCreatorException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.UserIsNotCreator,
      message: `User is not a creator`,
    });
  }
}
