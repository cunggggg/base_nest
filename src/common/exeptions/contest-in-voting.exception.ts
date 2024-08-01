import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestInVotingException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestInVotingState,
      message: `This contest is not in voting state`,
    });
  }
}
