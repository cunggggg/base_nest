import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class InvalidTokenProviderException extends BadRequestException {
  constructor(private isToken = true) {
    super({
      errorType: isToken ? ErrorType.InvalidToken : ErrorType.InvalidProvider,
    });
  }
}
