import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestTimeInvalidException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestTimeInvalid,
      message: `Contest Time must be in order [Current] < [Start] < [Join] < [End] < [Expire]`,
    });
  }
}
