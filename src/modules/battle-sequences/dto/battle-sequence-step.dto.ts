import { ApiProperty } from '@nestjs/swagger';
import { BattleDto } from '@modules/battles/dto/battle.dto';

export class BattleStepDto extends BattleDto {
  @ApiProperty()
  youVoted: number;

  @ApiProperty()
  votes: number;
}

export class BattleSequenceStepDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  step: number;

  @ApiProperty()
  voteFor: number;

  @ApiProperty()
  voteRate: number;

  @ApiProperty()
  battle: BattleDto;

  @ApiProperty()
  xpWatchingBonus?: number;

  @ApiProperty()
  xpReward?: number;
}
