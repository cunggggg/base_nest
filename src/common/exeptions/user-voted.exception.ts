import { BadRequestException, ConflictException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class UserVotedException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.UserVoted,
      message: `Battle has been voted by this user`,
    });
  }
}
