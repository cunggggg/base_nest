import { XpLevelEntity } from './entities/xp-level.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(XpLevelEntity)
export class XpLevelsRepository extends Repository<XpLevelEntity> {
  /**
   * Get setting with xp levels
   * @returns []
   */
  public async getExploreXpLevels(): Promise<XpLevelEntity[]> {
    const query = this.createQueryBuilder('x')
      .select(['level', 'xp', 'token_rewards'])
      .where('x.level != 0')
      .orderBy('level');

    return query.getRawMany();
  }

  public async getXpLevelsFrom(level: number): Promise<XpLevelEntity[]> {
    const query = this.createQueryBuilder('x')
      .orderBy('level', 'ASC')
      .where('x.level > :level', { level });

    return query.getMany();
  }

  public async getXpLevels(): Promise<any> {
    const xpLevels = await this.find();
    const xpLevelDict = {};

    xpLevels.forEach((lv) => {
      xpLevelDict[lv.level] = lv;
    });
    return xpLevelDict;
  }
}
