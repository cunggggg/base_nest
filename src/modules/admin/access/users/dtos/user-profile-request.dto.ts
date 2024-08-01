import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

// const urlRegex = /(https?:\/\/)?(?:www\.|(?!www))?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}$/;

export class UserProfileRequestDto {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  username?: string;

  @ApiProperty()
  bio?: string;

  @ApiProperty()
  personal?: string;

  @ApiProperty()
  instagram?: string;

  @ApiProperty()
  tiktok?: string;
}
