import { ApiProperty } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  type: string;
}
