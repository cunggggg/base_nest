import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestOverMaxParticipantException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContestOverMaxParticipant,
      message:
        'Can not join this contest, the number of participants has reached the limit',
    });
  }
}
