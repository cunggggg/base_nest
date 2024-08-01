import { SettingDto } from './dto/setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { SettingType } from '@modules/settings/type.enum';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(SettingsRepository)
    private settingsRepository: SettingsRepository,
  ) {}

  public async getSettings() {
    const settings = await this.settingsRepository.find();

    return settings.reduce((preVal, curVal) => {
      (preVal[curVal.type] = preVal[curVal.type] || {})[curVal.name] =
        curVal.value;

      return preVal;
    }, {});
  }

  public async getSettingValue(type: SettingType, key) {
    const settings = await this.settingsRepository.getSettings(type);
    return settings[key];
  }

  async update(settings: SettingDto[]) {
    const currentSettings = await this.settingsRepository.find();

    const payloadSettings = currentSettings.map((item) => {
      return {
        ...item,
        ...settings.find((i) => i.type === item.type && i.name === item.name),
      };
    });

    return await this.settingsRepository.save(payloadSettings);
  }
}
