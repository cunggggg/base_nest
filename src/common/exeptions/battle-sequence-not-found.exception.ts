import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class BattleGenerationNotFoundException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.BattleSequenceNotFound,
      message: `Battle sequence is not for current user or it already finished`,
    });
  }
}
