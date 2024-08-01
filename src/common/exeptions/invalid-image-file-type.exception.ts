import { BadRequestException } from '@nestjs/common';
import { ErrorType } from '../enums';

export class InvalidImageFileTypeException extends BadRequestException {
  constructor() {
    super({
      errorType: ErrorType.InvalidImageFile,
      message: 'File invalid, please upload a image file!',
    });
  }
}
