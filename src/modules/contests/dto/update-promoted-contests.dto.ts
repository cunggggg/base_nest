import { ApiProperty } from '@nestjs/swagger';

export class PromotedContestDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  promoteOrder: number;
}

export class UpdatePromotedContestsDto {
  @ApiProperty()
  contests: PromotedContestDto[];
}
