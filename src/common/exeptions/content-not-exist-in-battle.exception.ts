import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class ContentNotExistInBattleException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.ContentNotExistInBattle,
      message: `Content not exist on the current voting Battle`,
    });
  }
}
