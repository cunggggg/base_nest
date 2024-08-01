import {
  ArrayNotEmpty,
  IsAlphanumeric,
  IsArray,
  IsInt,
  IsNotEmpty,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const passwordRegex = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

export class CreateUserRequestDto {
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    example: 'instagram',
  })
  provider: string;

  @ApiProperty()
  providerId?: string;

  @ApiProperty()
  instagram?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  avatar?: string;

  @IsNotEmpty()
  @IsAlphanumeric()
  @ApiProperty({
    example: 'admin',
  })
  username?: string;

  @Matches(passwordRegex, { message: 'Password too weak' })
  @IsNotEmpty()
  @IsAlphanumeric()
  @Length(6, 20)
  @ApiProperty({
    example: 'Hello123',
  })
  password: string;

  @ApiProperty({ example: [1, 2] })
  @ArrayNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  permissions: number[];

  @ApiProperty({ example: [1, 2] })
  @ArrayNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  roles: number[];
}
