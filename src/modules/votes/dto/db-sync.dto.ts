import { ApiProperty } from '@nestjs/swagger';

export class DbSyncDto {
  @ApiProperty()
  contests: number[];

  @ApiProperty()
  all: boolean;
}
