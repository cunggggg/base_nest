import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentLengthLimitException extends BadRequestException {
  constructor(limit: number) {
    super({
      errorType: ErrorType.ContentLengthLimit,
      message: `Maximum video length is ${limit}s`,
    });
  }
}
