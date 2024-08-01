import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserEnergyNotEnoughException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.UserEnergyNotEnough,
      message: `Don't have enough energy to vote`,
    });
  }
}
