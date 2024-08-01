import { SettingType } from './type.enum';
import { SettingEntity } from './entities/setting.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(SettingEntity)
export class SettingsRepository extends Repository<SettingEntity> {
  /**
   * Get setting with xp levels
   * @returns []
   */
  public async getSettings(type = SettingType.ENERGY): Promise<any> {
    const query = this.createQueryBuilder('s').where('s.type = :type', {
      type,
    });

    const settings = await query.getMany();
    const settingDict = {};
    settings.forEach((s) => {
      settingDict[s.name] = s.value;
    });

    return settingDict;
  }
}
