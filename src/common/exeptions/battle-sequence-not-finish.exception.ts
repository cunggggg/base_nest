import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class BattleSequenceNotFinishException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.BattleSequenceNotFinish,
      message: `Battle sequence is still in voting`,
    });
  }
}
