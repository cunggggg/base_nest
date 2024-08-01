import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';

export class BattleSequenceResultDto {
  @ApiProperty()
  totalXps: number;

  @ApiProperty()
  userXps: number;

  @ApiProperty()
  voteForWinners: UserProfileResponseDto[];
}
