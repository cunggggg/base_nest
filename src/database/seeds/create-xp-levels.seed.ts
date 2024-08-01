import { XpLevelEntity } from './../../modules/xp-levels/entities/xp-level.entity';
import { Factory, Seeder } from 'typeorm-seeding';
import { Connection, In } from 'typeorm';
import * as _ from 'lodash';

const totalXpLevels = 10;

const levels: number[] = [],
  xps: number[] = [];
const tokenRewards = 5;

export default class CreateXpLevelsSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    for (let i = 1; i <= 10; i++) {
      levels.push(i);
    }

    for (let i = 100; i <= 1000; i += 100) {
      xps.push(i);
    }

    const xpLevels: XpLevelEntity[] = [];
    for (let i = 0; i < totalXpLevels; i++) {
      xpLevels.push(
        new XpLevelEntity({ level: levels[i], xp: xps[i], tokenRewards }),
      );
    }

    xpLevels.push(new XpLevelEntity({ level: 0, xp: 0, tokenRewards }));
    await connection.manager.save(xpLevels);
  }
}
