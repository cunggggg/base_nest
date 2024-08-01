import { ApiProperty } from '@nestjs/swagger';

export class UserContentContestResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  votes?: number;
}

export class UserContentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fileOriginalName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  votes: number;

  @ApiProperty()
  contests: UserContentContestResponseDto[];

  @ApiProperty()
  userId?: string;
}
