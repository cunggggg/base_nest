import { EntityRepository, Repository } from 'typeorm';
import { UserXpLevelsEntity } from '@admin/access/users/user-xp-levels.entity';

@EntityRepository(UserXpLevelsEntity)
export class UserXpLevelsRepository extends Repository<UserXpLevelsEntity> {
  /**
   * Get setting with xp levels
   * @returns []
   */
  public async getByUser(userId: string): Promise<UserXpLevelsEntity> {
    const query = this.createQueryBuilder('ux').where('ux.user_id = :userId', {
      userId,
    });

    return query.getOne();
  }

  public async updateEnergyAll(maxEnergy: number): Promise<void> {
    await this.createQueryBuilder()
      .update(UserXpLevelsEntity)
      .set({ energy: maxEnergy, lastTimeChecked: new Date() })
      .execute();
  }
}
