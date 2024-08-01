import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestStateInvalidException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestStateInvalid,
      message: `The state of contest is invalid`,
    });
  }
}
