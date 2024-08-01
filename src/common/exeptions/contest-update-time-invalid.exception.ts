import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestUpdateTimeInvalidException extends BadRequestException {
  constructor(time) {
    super({
      errorType: ErrorType.ContestUpdateTimeInvalid,
      message: `Can not update time due to: Current > ` + time,
    });
  }
}
