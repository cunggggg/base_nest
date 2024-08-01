import { ApiProperty } from '@nestjs/swagger';

export class VoteBattleSequenceDto {
  @ApiProperty()
  battleSequenceId: number;

  @ApiProperty()
  contentId: number;

  @ApiProperty()
  xpWatchingBonus?: number;
}
