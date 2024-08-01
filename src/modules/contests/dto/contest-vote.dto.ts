import { ApiProperty } from '@nestjs/swagger';

export class ContestVoteDto {
  @ApiProperty()
  contentId: number;
}
