import { ApiProperty } from '@nestjs/swagger';

export class VoteResponseDto {
  @ApiProperty()
  battleId: number;

  @ApiProperty()
  contentId: number;
}
