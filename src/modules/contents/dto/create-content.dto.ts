import { ApiProperty } from '@nestjs/swagger';

export class CreateContentDto {
  @ApiProperty()
  fileOriginalName: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  contestId?: number;
}
