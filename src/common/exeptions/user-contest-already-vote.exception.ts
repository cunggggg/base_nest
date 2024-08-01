import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserContestAlreadyVoteException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.UserContentVoteExists,
      message: `User has voted for this content.`,
    });
  }
}
