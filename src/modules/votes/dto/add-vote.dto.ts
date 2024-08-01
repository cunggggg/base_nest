import { ApiProperty } from '@nestjs/swagger';

export class AddVoteDto {
  @ApiProperty()
  battleId: number;

  @ApiProperty()
  contentId: number;

  userId?: string;
}
