import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class BattleGenerationException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.BattleSequenceGenerateError,
      message: `Can not generate battle sequence`,
    });
  }
}
