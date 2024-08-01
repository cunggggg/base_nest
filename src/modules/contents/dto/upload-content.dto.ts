import { ApiProperty } from '@nestjs/swagger';

export class UploadContentDto {
  @ApiProperty()
  url: string;
}
