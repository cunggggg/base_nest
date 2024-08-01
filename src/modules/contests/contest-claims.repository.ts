import { EntityRepository, Repository } from 'typeorm';
import { ContestClaimsEntity } from '@modules/contests/entities/contest-claims.entity';

@EntityRepository(ContestClaimsEntity)
export class ContestClaimsRepository extends Repository<ContestClaimsEntity> {
  public async getByUserAndContestId(
    userId: string,
    contestId: number,
  ): Promise<ContestClaimsEntity[]> {
    const query = this.createQueryBuilder('c').where(
      'c.user_id = :userId AND c.contest_id = :contestId',
      { userId: userId, contestId: contestId },
    );

    return query.getMany();
  }

  public async getByUser(userId: string): Promise<ContestClaimsEntity[]> {
    const query = this.createQueryBuilder('c').where(
      'c.user_id = :userId AND c.claimed = false',
      { userId: userId },
    );

    return query.getMany();
  }

  public async getByContestId(
    contestId: number,
  ): Promise<ContestClaimsEntity[]> {
    const query = this.createQueryBuilder('c').where(
      'c.contest_id = :contestId',
      { contestId: contestId },
    );

    return query.getMany();
  }
}
