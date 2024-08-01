import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestClaimException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestClaimInvalid,
      message: `Dont have any rewards to claim`,
    });
  }
}
