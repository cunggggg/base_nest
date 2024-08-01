import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, ArrayMinSize } from 'class-validator';

export class UserContentDto {
  @ApiProperty()
  contentId: number;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  username: string;
}

export class CreateContestV2Dto {
  @ApiProperty()
  @MaxLength(10)
  name: string;

  @ApiProperty()
  owner?: string;

  @ApiProperty()
  @MaxLength(50)
  description: string;

  @ApiProperty()
  imageCover: string;

  @ApiProperty()
  contents: UserContentDto[];
}
