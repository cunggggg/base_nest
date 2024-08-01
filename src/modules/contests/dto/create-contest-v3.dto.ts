import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class UserContentDto {
  @ApiProperty()
  contentId: number;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  username: string;
}

export class CreateContestV3Dto {
  @ApiProperty()
  @MaxLength(30)
  name: string;

  @ApiProperty()
  owner?: string;

  @ApiProperty()
  videoMaxLength: number;

  @ApiProperty()
  creatorName: string;

  @ApiProperty()
  creatorAvatar: string;

  @ApiProperty()
  creatorCountry: string;

  @ApiProperty()
  @MaxLength(100)
  description: string;

  @ApiProperty()
  @MaxLength(2000)
  longDescription: string;

  @ApiProperty()
  @MaxLength(50)
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

  @ApiProperty()
  contents: UserContentDto[];
}
