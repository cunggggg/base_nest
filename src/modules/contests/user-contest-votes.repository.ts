import { EntityRepository, Repository } from 'typeorm';
import { UserContestVoteEntity } from '@modules/contests/entities/user-contest-vote.entity';

@EntityRepository(UserContestVoteEntity)
export class UserContestVotesRepository extends Repository<UserContestVoteEntity> {
  public async getByContestId(
    contestId: number,
  ): Promise<UserContestVoteEntity[]> {
    const query = this.createQueryBuilder('u').where(
      'u.contest_id = :contestId',
      { contestId: contestId },
    );

    return query.getMany();
  }

  public async getByContestIdAndActivate(
    contestId: number,
  ): Promise<UserContestVoteEntity[]> {
    const query = this.createQueryBuilder('u').where(
      'u.contest_id = :contestId',
      { contestId: contestId },
    );

    return query.getMany();
  }

  public async getByUserAndContestId(
    userId: string,
    contestId: number,
  ): Promise<UserContestVoteEntity[]> {
    const query = this.createQueryBuilder('u').where(
      'u.user_id = :userId AND u.contest_id = :contestId',
      { userId: userId, contestId: contestId },
    );

    return query.getMany();
  }

  public async getByUserAndContestIdAndContentId(
    userId: string,
    contestId: number,
    contentId: number,
  ): Promise<UserContestVoteEntity> {
    const query = this.createQueryBuilder('u').where(
      'u.user_id = :userId AND u.contest_id = :contestId AND u.content_id = :contentId',
      { userId: userId, contestId: contestId, contentId: contentId },
    );

    return query.getOne();
  }

  public async getByContestIdAndContentIds(
    contestId: number,
    contentIds: number[],
  ): Promise<UserContestVoteEntity[]> {
    if (!contentIds || contentIds.length === 0) {
      return [];
    }

    const query = this.createQueryBuilder('u').where(
      'u.contest_id = :contestId AND u.content_id IN (:...contentIds)',
      { contestId: contestId, contentIds: contentIds },
    );

    return query.getMany();
  }

  /**
   * Get top users
   * @returns []
   */
  public async getTopWinners(contestId: number, total = 3): Promise<any[]> {
    const query = this.createQueryBuilder('u')
      .select('u.content_id')
      .addSelect('COUNT(u.content_id)', 'votes')
      .where('u.contest_id = :contestId', { contestId: contestId })
      .groupBy('u.content_id')
      .orderBy('votes', 'DESC')
      .take(total);

    return query.getRawMany();
  }
}
