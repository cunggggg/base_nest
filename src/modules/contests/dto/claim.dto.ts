import { ApiProperty } from '@nestjs/swagger';

export class ClaimDto {
  @ApiProperty()
  token: number;

  @ApiProperty()
  energy: number;

  @ApiProperty()
  xpBonus: number;
}
