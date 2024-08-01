import { ApiProperty } from '@nestjs/swagger';

export class XpLevelDto {
  @ApiProperty()
  level: number;

  @ApiProperty()
  xp: number;

  @ApiProperty()
  tokenRewards: number;
}
