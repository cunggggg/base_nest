import { ApiProperty } from '@nestjs/swagger';

export class DashboardTopDto {
  @ApiProperty()
  no: number;

  @ApiProperty()
  name: number;

  @ApiProperty()
  info: any;
}

export class DashboardSummaryDto {
  @ApiProperty()
  challenges: number;

  @ApiProperty()
  videos: number;

  @ApiProperty()
  votes: number;

  @ApiProperty()
  topContests: DashboardTopDto[];

  @ApiProperty()
  topUsers: DashboardTopDto[];
}
