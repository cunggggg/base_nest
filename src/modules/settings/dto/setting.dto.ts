import { ApiProperty } from '@nestjs/swagger';
import { SettingType } from '@modules/settings/type.enum';

export class SettingDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  type: SettingType;
}
