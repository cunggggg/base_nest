import { XpLevelDto } from '@modules/xp-levels/dto/xp-level.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { SettingDto } from './setting.dto';

export class UpdateSettingDto {
  @ApiProperty({ type: () => [XpLevelDto] })
  @Type(() => XpLevelDto)
  @IsArray()
  xpLevels: XpLevelDto[];

  @ApiProperty({ type: () => [SettingDto] })
  @Type(() => XpLevelDto)
  @IsArray()
  settings: SettingDto[];
}
