import { ApiProperty } from '@nestjs/swagger';

export class UserEnergyDto {
  @ApiProperty()
  energy: number;

  @ApiProperty()
  max: number;

  @ApiProperty()
  nextRefill: number;
}
