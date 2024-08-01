import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestIdRequiredException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestIdRequired,
      message: `Contest Id required`,
    });
  }
}
