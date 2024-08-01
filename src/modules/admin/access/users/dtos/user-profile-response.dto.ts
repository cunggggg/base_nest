import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  personal: string;

  @ApiProperty()
  instagram: string;

  @ApiProperty()
  tiktok: string;

  @ApiProperty()
  videos?: number;

  @ApiProperty()
  votes?: number;

  @ApiProperty()
  winRate: number;

  @ApiProperty()
  appeal: number;

  @ApiProperty()
  votesAndViews: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  xp: number;

  @ApiProperty()
  following?: boolean;

  @ApiProperty()
  claims?: any[];
}
