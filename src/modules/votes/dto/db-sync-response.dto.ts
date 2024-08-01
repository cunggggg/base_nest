import { ApiProperty } from '@nestjs/swagger';

export class DbSyncRespDto {
  @ApiProperty()
  contests: number[];
}
