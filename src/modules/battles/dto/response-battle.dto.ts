import { ApiProperty } from '@nestjs/swagger';
import { ContestResponseDto } from '@modules/contests/dto/contest-response.dto';
import { ContentResponseDto } from '@modules/contents/dto/content-response.dto';
import { BattleDto } from '@modules/battles/dto/battle.dto';

export class BattleResponseDto extends BattleDto {
  @ApiProperty()
  winner: number;

  @ApiProperty()
  status: number;

  @ApiProperty()
  youVoted: number;

  @ApiProperty()
  youWin: boolean;

  @ApiProperty()
  votes: number;
}
