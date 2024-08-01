import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestPromoteLimitException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestPromoteLimit,
      message: 'The number of promoted contests has reached the limit of 10',
    });
  }
}
