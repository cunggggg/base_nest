import { ConflictException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestExistsException extends ConflictException {
  constructor(name: string) {
    super({
      errorType: ErrorType.ContestExists,
      message: `There's a contest with name '${name}'`,
    });
  }
}
