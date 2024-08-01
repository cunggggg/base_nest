import { EntityRepository, Repository } from 'typeorm';
import { ContestRankEntity } from '@modules/contests/entities/contest-rank.entity';

@EntityRepository(ContestRankEntity)
export class ContestRanksRepository extends Repository<ContestRankEntity> {
  public async getByUserAndContestId(
    userId: string,
    contestId: number,
  ): Promise<ContestRankEntity> {
    const query = this.createQueryBuilder('c').where(
      'c.user_id = :userId AND c.contest_id = :contestId',
      { userId: userId, contestId: contestId },
    );

    return query.getOne();
  }

  public async getByContestId(contestId: number): Promise<ContestRankEntity[]> {
    const query = this.createQueryBuilder('c').where(
      'c.contest_id = :contestId',
      { contestId: contestId },
    );

    return query.getMany();
  }
}
