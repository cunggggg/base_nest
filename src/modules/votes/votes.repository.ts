import { EntityRepository, Repository } from 'typeorm';
import { UserVotesEntity } from '@modules/votes/entities/vote.entity';

@EntityRepository(UserVotesEntity)
export class VotesRepository extends Repository<UserVotesEntity> {
  /**
   * Get vote by battle and content
   * @param userId
   * @param battleId
   * @returns UserVotesEntity
   */
  public async getByUserAndBattle(
    userId: string,
    battleId: number,
  ): Promise<UserVotesEntity> {
    const query = this.createQueryBuilder('v')
      .innerJoinAndSelect('v.user', 'u')
      .innerJoinAndSelect('v.battle', 'b')
      .leftJoinAndSelect('v.content', 'c')
      .where('u.id = :uId AND b.id = :bId', { uId: userId, bId: battleId });

    return query.getOne();
  }

  /**
   * Get vote by user and contestId
   * @param userId
   * @param contestId
   * @returns UserVotesEntity
   */
  public async getByUserAndContest(
    userId: string,
    contestId: number,
  ): Promise<UserVotesEntity[]> {
    const query = this.createQueryBuilder('v')
      .innerJoin('v.user', 'u')
      .innerJoin('v.battle', 'b')
      .innerJoin('b.contest', 'c')
      .where('u.id = :uId AND c.id = :cId', { uId: userId, cId: contestId });

    return query.getMany();
  }

  /**
   * Get vote by battle and content
   * @param battleId
   * @returns UserVotesEntity
   */
  public async getByBattle(battleId: number): Promise<UserVotesEntity[]> {
    const query = this.createQueryBuilder('v')
      .innerJoin('v.battle', 'b')
      .where('b.id = :bId', { bId: battleId });

    return query.getMany();
  }

  /**
   * Get vote by battle and content
   * @param battleIds
   * @returns UserVotesEntity
   */
  public async getByBattles(battleIds: number[]): Promise<UserVotesEntity[]> {
    if (!battleIds || battleIds.length === 0) {
      return [];
    }

    const query = this.createQueryBuilder('v')
      .innerJoin('v.battle', 'b')
      .where('b.id IN (:...bIds)', { bIds: battleIds });

    return query.getMany();
  }
}
