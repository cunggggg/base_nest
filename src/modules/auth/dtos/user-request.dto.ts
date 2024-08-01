import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    example: 'jon',
  })
  readonly username: string;

  @IsNotEmpty()
  @ApiProperty({
    example: 'instagram',
  })
  readonly provider: string;
}
