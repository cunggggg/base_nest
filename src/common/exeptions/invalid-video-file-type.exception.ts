import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class InvalidVideoFileTypeException extends BadRequestException {
  constructor(type = null) {
    super({
      errorType: ErrorType.InvalidVideoFile,
      message: type
        ? `File invalid, please upload a ${type} video file!`
        : 'File invalid, please upload a video file!',
    });
  }
}
