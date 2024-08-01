import { EntityRepository, Repository } from 'typeorm';
import { ContentEntity } from '@modules/contents/entities/content.entity';

@EntityRepository(ContentEntity)
export class ContentsRepository extends Repository<ContentEntity> {
  /**
   * Get users list
   * @returns ContentEntity[]
   * @param contentUrls
   */
  public async getContentsByUrls(
    contentUrls: string[],
  ): Promise<ContentEntity[]> {
    const query = this.createQueryBuilder('c').where('c.file_url IN (:urls)', {
      urls: [...contentUrls],
    });

    return query.getMany();
  }

  /**
   * Get users list
   * @returns ContentEntity[]
   * @param userId
   */
  public async getContentsByUser(userId: string): Promise<ContentEntity[]> {
    const query = this.createQueryBuilder('c')
      .innerJoinAndSelect('c.user', 'u')
      .innerJoinAndSelect('c.contests', 'ct')
      .leftJoinAndSelect('c.votes', 'v')
      .where('u.id = :id', { id: userId });

    return query.getMany();
  }

  public async getByUserAndContest(
    userId: string,
    contestId: number,
  ): Promise<ContentEntity> {
    const query = this.createQueryBuilder('content')
      .innerJoin('content.user', 'user')
      .innerJoin('content.contests', 'contest')
      .where('user.id = :userId AND contest.id = :contestId', {
        userId,
        contestId,
      });

    return query.getOne();
  }
}
