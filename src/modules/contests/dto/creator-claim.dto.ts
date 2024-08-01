import { ApiProperty } from '@nestjs/swagger';
import { ClaimDto } from '@modules/contests/dto/claim.dto';

export class CreatorClaimDto extends ClaimDto {
  @ApiProperty()
  votes: number;

  @ApiProperty()
  rank: number;

  @ApiProperty()
  winRatio: number;
}
