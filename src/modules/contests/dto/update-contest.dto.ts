import { ContestStates } from '@common/enums/contest-state.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContestDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  imageCover?: string;

  @ApiProperty()
  promote?: boolean;

  @ApiProperty()
  rules: string[];

  @ApiProperty()
  singleUpload?: boolean;

  @ApiProperty()
  contents?: number[];

  @ApiProperty()
  users?: string[];

  @ApiProperty()
  participantPrize: string[];

  @ApiProperty()
  contestantRewards: string[];

  @ApiProperty()
  voteRewards: number;

  @ApiProperty()
  videoMaxLength: number;

  @ApiProperty()
  minVote: number;

  @ApiProperty()
  minParticipants: number;

  @ApiProperty()
  maxParticipants: number;

  @ApiProperty()
  startTime: number;

  @ApiProperty()
  endTime: number;

  @ApiProperty()
  submissionDeadline: number;

  @ApiProperty()
  expireTime: number;

  @ApiProperty()
  xpRewards: string[];

  @ApiProperty()
  videoIntro: string;

  @ApiProperty()
  videoIntroImg: string;
}
