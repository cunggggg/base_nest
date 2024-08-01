import { ApiProperty } from '@nestjs/swagger';

export class AddContestContentDto {
  @ApiProperty()
  content: number;

  @ApiProperty()
  users?: string[];
}
