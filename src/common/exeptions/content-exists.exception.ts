import { ConflictException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentExistsException extends ConflictException {
  constructor(url: string) {
    super({
      errorType: ErrorType.UserExists,
      message: `There's a content with url '${url}'`,
    });
  }
}
