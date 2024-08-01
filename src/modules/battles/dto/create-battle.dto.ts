import { ApiProperty } from '@nestjs/swagger';

export class CreateBattleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  contestId: number;

  @ApiProperty()
  contentAId: number;

  @ApiProperty()
  contentBId: number;

  @ApiProperty()
  winner: number;
}
