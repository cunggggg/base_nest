import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateContestDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  @MaxLength(2000)
  description: string;

  @ApiProperty()
  imageCover: string;

  @ApiProperty()
  singleUpload: boolean;

  @ApiProperty()
  promote: boolean;

  @ApiProperty()
  owner: string;

  @ApiProperty()
  rules: string[];

  @ApiProperty()
  contents: number[];

  @ApiProperty()
  users?: string[];

  @ApiProperty()
  videoIntro: string;

  @ApiProperty()
  videoIntroImg: string;

  @ApiProperty()
  participantPrize: string[];

  @ApiProperty()
  contestantRewards: string[];

  @ApiProperty()
  voteRewards: number;

  @ApiProperty()
  xpRewards: string[];

  @IsNotEmpty()
  @ApiProperty()
  videoMaxLength: number;

  @IsNotEmpty()
  @ApiProperty()
  minVote: number;

  @IsNotEmpty()
  @ApiProperty()
  minParticipants: number;

  @ApiProperty()
  maxParticipants: number;

  @IsNotEmpty()
  @ApiProperty()
  startTime: number;

  @IsNotEmpty()
  @ApiProperty()
  endTime: number;

  @ApiProperty()
  submissionDeadline: number;

  @IsNotEmpty()
  @ApiProperty()
  expireTime: number;
}
