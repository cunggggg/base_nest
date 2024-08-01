import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@admin/access/users/dtos';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';

export class ContentResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url?: string;

  @ApiProperty()
  fileOriginalName?: string;

  @ApiProperty()
  thumbnailUrl?: string;

  @ApiProperty()
  user?: UserResponseDto | UserProfileResponseDto;

  @ApiProperty()
  votes?: number;

  @ApiProperty()
  voted?: boolean;
}
