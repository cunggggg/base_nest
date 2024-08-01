import { EntityRepository, Repository } from 'typeorm';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { PaginationRequest } from '@common/interfaces';
import { ContestStates } from '@common/enums/contest-state.enum';

@EntityRepository(ContestEntity)
export class ContestsRepository extends Repository<ContestEntity> {
  /**
   * Get top users
   * @returns []
   */
  public async getTopContests(): Promise<any[]> {
    const query = this.createQueryBuilder('c')
      .select('c.name')
      .addSelect('COUNT(c.name)', 'votes')
      .innerJoin('c.battles', 'b')
      .innerJoin('b.votes', 'v')
      .groupBy('c.name')
      .orderBy('votes', 'DESC')
      .take(5);

    return query.getRawMany();
  }

  /**
   * Get top users
   * @returns []
   */
  public async getTopContestsWithoutBattle(): Promise<any[]> {
    const query = this.createQueryBuilder('c')
      .select('c.name')
      .addSelect('COUNT(c.name)', 'votes')
      .innerJoin('c.contestVotes', 'v')
      .groupBy('c.name')
      .orderBy('votes', 'DESC')
      .take(5);

    return query.getRawMany();
  }

  /**
   * Get contest list
   * @param pagination {PaginationRequest}
   * @returns [entities: ContestEntity[], total: number]
   */
  public async getContestsAndCount(
    pagination: PaginationRequest,
  ): Promise<[entities: ContestEntity[], total: number]> {
    const {
      params: { keyword },
    } = pagination;

    const size = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * size;

    const query = this.createQueryBuilder('c')
      .leftJoinAndSelect('c.users', 'user')
      .leftJoinAndSelect('c.contents', 'content')
      .innerJoinAndSelect('c.owner', 'owner')
      .skip(skip)
      .take(size)
      .orderBy('c.createdAt', 'DESC');

    if (keyword) {
      query.where(
        `
            c.name ILIKE :keyword
            OR owner.username ILIKE :keyword
            `,
        { keyword: `%${keyword}%` },
      );
    }

    return query.getManyAndCount();
  }

  /**
   * Get contests feeds
   * @returns ContestEntity[]
   */
  public async getContestsFeeds(): Promise<ContestEntity[]> {
    const states = [
      ContestStates.UPCOMING,
      // ContestStates.OPEN,
      ContestStates.VOTING,
      // ContestStates.END,
      // ContestStates.EXPIRED,
      // ContestStates.VOID,
    ];
    const query = this.createQueryBuilder('c')
      .orderBy('c.state', 'ASC')
      .addOrderBy('c.promote', 'DESC')
      .addOrderBy(
        `
          CASE 
          WHEN state = '1' THEN start_time
          WHEN state = '2' THEN submission_deadline 
          WHEN state = '3' THEN end_time 
          WHEN state = '3' THEN expire_time 
          WHEN state = '6' THEN expire_time
          END
        `,
        'DESC',
      )
      .where('c.state IN (:...states)', { states: states });

    return query.getMany();
  }

  /**
   * Get contest list
   * @param pagination {PaginationRequest}
   * @returns [entities: ContestEntity[], total: number]
   */
  public async getExploringContestsAndCount(
    pagination: PaginationRequest,
  ): Promise<[entities: ContestEntity[], total: number]> {
    const size = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * size;

    const query = this.createQueryBuilder('c')
      .leftJoinAndSelect('c.users', 'user')
      .leftJoinAndSelect('c.contents', 'content')
      .innerJoinAndSelect('c.owner', 'owner')
      .skip(skip)
      .take(size)
      .addOrderBy('c.promote', 'DESC')
      .addOrderBy('c.promoteOrder', 'ASC');

    return query.getManyAndCount();
  }

  /**
   * Get contest detail
   * @param contestId {number}
   * @returns [entities: ContestEntity[], total: number]
   */
  public async getContestDetail(contestId: number): Promise<ContestEntity> {
    const query = this.createQueryBuilder('c')
      .leftJoinAndSelect('c.contents', 'content')
      .leftJoinAndSelect('content.user', 'user')
      .where('c.id = :id', { id: contestId });

    return query.getOne();
  }

  /**
   * Get contests by name
   * @returns ContestEntity[]
   * @param name
   */
  public async searchByName(name: string): Promise<ContestEntity[]> {
    const query = this.createQueryBuilder('c')
      .take(10)
      .addOrderBy('c.name', 'ASC');
    if (name) {
      query.where('c.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    return query.getMany();
  }

  /**
   * Get contests by name
   * @returns ContestEntity[]
   * @param states
   */
  public async getContestsForCronJob(
    states: ContestStates[],
  ): Promise<ContestEntity[]> {
    const query = this.createQueryBuilder('c')
      .addOrderBy('c.state', 'ASC')
      .where('c.state IN (:...states)', { states: states });

    return query.getMany();
  }
}
