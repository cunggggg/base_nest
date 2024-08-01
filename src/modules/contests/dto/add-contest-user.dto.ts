import { ApiProperty } from '@nestjs/swagger';

export class AddContestUserDto {
  @ApiProperty()
  username: string;
}
