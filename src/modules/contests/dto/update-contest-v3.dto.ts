import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateContestV3Dto {
  @ApiProperty()
  @MaxLength(10)
  name: string;

  @ApiProperty()
  videoMaxLength: number;

  @ApiProperty()
  creatorName: string;

  @ApiProperty()
  creatorAvatar: string;

  @ApiProperty()
  creatorCountry: string;

  @ApiProperty()
  @MaxLength(50)
  description: string;

  @ApiProperty()
  @MaxLength(2000)
  longDescription: string;

  @ApiProperty()
  @MaxLength(1000)
  rewards: string;

  @ApiProperty()
  rules: string[];

  @ApiProperty()
  videoIntro: string;

  @ApiProperty()
  videoIntroImg: string;

  @IsNotEmpty()
  @ApiProperty()
  minParticipants: number;

  @IsNotEmpty()
  @ApiProperty()
  startTime: number;

  @ApiProperty()
  xpRewards: string[];
}
