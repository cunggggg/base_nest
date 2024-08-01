import { ContestStates } from '@common/enums/contest-state.enum';
import { ApiProperty } from '@nestjs/swagger';
import { ContentResponseDto } from '@modules/contents/dto/content-response.dto';

export class ContestantTopDto {
  @ApiProperty()
  top: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  votes: number;
}

export class ContestResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  longDescription: string;

  @ApiProperty()
  creatorName: string;

  @ApiProperty()
  creatorAvatar: string;

  @ApiProperty()
  creatorCountry: string;

  @ApiProperty()
  rewards: string;

  @ApiProperty()
  canUpload: boolean;

  @ApiProperty()
  canVoteMore: boolean;

  @ApiProperty()
  contents: ContentResponseDto[];

  @ApiProperty()
  videoMaxLength: number;

  @ApiProperty()
  minParticipants: number;

  @ApiProperty()
  totalParticipants: number;

  @ApiProperty()
  totalVotes: number;

  @ApiProperty()
  startTime: number;

  @ApiProperty()
  state: ContestStates;

  @ApiProperty()
  xpRewards: string[];

  @ApiProperty()
  rules: string[];

  @ApiProperty()
  videoIntro: string;

  @ApiProperty()
  videoIntroImg: string;

  @ApiProperty()
  weeklyWinners?: ContestantTopDto[];
}
