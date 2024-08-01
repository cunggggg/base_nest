import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JwtTokenRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly provider: string;
}
