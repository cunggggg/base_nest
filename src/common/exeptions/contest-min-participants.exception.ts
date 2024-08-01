import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContestMinParticipantsException extends BadRequestException {
  constructor(min) {
    super({
      errorType: ErrorType.ContestMinParticipants,
      message: `Total contestants must be greater or equal ` + min,
    });
  }
}
