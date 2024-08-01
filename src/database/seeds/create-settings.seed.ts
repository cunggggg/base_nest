import { SettingEntity } from '@modules/settings/entities/setting.entity';
import { SettingType } from '@modules/settings/type.enum';
import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';

const totalSettingRecord = 3;
const settingNames = ['max_energy', 'refill_time', 'refill_levelup'];
const settingValues = ['5', '120', '1'];

export default class CreateSettingsSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const settings: SettingEntity[] = [];
    for (let i = 0; i < totalSettingRecord; i++) {
      settings.push(
        new SettingEntity({
          name: settingNames[i],
          type: SettingType.ENERGY,
          value: settingValues[i],
        }),
      );
    }

    settings.push(
      new SettingEntity({
        name: 'video',
        type: SettingType.ON_BOARDING,
        value: 'https://sample.com',
      }),
    );

    await connection.manager.save(settings);
  }
}
