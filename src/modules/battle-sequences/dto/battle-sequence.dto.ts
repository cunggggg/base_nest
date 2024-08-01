import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';
import { BattleSequenceStatus } from '@common/enums/battle-sequence-status.enum';
import { BattleSequenceStepDto } from '@modules/battle-sequences/dto/battle-sequence-step.dto';

export class BattleSequenceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  contestId: number;

  @ApiProperty()
  status: BattleSequenceStatus;

  @ApiProperty()
  votedUser: UserProfileResponseDto;

  @ApiProperty()
  currentStep: number;

  @ApiProperty()
  totalSteps: number;

  @ApiProperty()
  battles: BattleSequenceStepDto[];
}
