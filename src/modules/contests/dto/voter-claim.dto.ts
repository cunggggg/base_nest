import { ApiProperty } from '@nestjs/swagger';
import { ClaimDto } from '@modules/contests/dto/claim.dto';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';

export class VoterClaimDto extends ClaimDto {
  @ApiProperty()
  top1Winner: UserProfileResponseDto;

  @ApiProperty()
  top2Winner: UserProfileResponseDto;

  @ApiProperty()
  top3Winner: UserProfileResponseDto;
}
