import { PaginationRequest } from '@common/interfaces';
import { EntityRepository, Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@EntityRepository(UserEntity)
export class UsersRepository extends Repository<UserEntity> {
  /**
   * Get top users
   * @returns []
   */
  public async getTopUsers(): Promise<any[]> {
    const query = this.createQueryBuilder('u')
      .select('u.username')
      .addSelect('COUNT(u.username)', 'votes')
      .innerJoin('u.contents', 'c')
      .innerJoin('c.votes', 'v')
      .groupBy('u.username')
      .orderBy('votes', 'DESC')
      .take(5);

    return query.getRawMany();
  }

  /**
   * Get users video count
   * @returns []
   */
  public async getUserVideoCount(userId: string): Promise<number> {
    const query = this.createQueryBuilder('u')
      .select('u.id')
      .addSelect('COUNT(u.id)', 'votes')
      .innerJoin('u.contents', 'c')
      .innerJoin('c.contestVotes', 'v')
      .groupBy('u.id')
      .where('u.id=:userId', { userId: userId });

    const user = await query.getRawOne();
    return user ? user.votes : 0;
  }

  /**
   * Get top users
   * @returns []
   */
  public async getTopUsersWithoutBattle(): Promise<any[]> {
    const query = this.createQueryBuilder('u')
      .select('u.username')
      .addSelect('COUNT(u.username)', 'votes')
      .innerJoin('u.contents', 'c')
      .innerJoin('c.contestVotes', 'v')
      .groupBy('u.username')
      .orderBy('votes', 'DESC')
      .take(5);

    return query.getRawMany();
  }

  /**
   * Get users list
   * @param pagination {PaginationRequest}
   * @returns [userEntities: UserEntity[], totalUsers: number]
   */
  public async getUsersAndCount(
    pagination: PaginationRequest,
  ): Promise<[userEntities: UserEntity[], totalUsers: number]> {
    const size = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * size;
    const {
      params: { search },
    } = pagination;
    const query = this.createQueryBuilder('u')
      .skip(skip)
      .take(size)
      .addOrderBy('u.username', 'ASC');

    if (search) {
      query.where(
        `
            (u.username ILIKE :search
            OR u.name ILIKE :search)
            AND u.isSuperUser != true
            `,
        {
          search: `%${search}%`,
        },
      );
    } else {
      query.where('u.isSuperUser != true');
    }

    return query.getManyAndCount();
  }

  /**
   * Get users list
   * @returns [userEntities: UserEntity[], totalUsers: number]
   * @param keyword
   */
  public async searchUsers(keyword: string): Promise<UserEntity[]> {
    const query = this.createQueryBuilder('u')
      .take(10)
      .addOrderBy('u.username', 'ASC');
    if (keyword) {
      query.where('u.username ILIKE :search AND u.isSuperUser != true', {
        search: `${keyword}%`,
      });
    } else {
      query.where('u.isSuperUser != true');
    }

    return query.getMany();
  }

  /**
   * find user by username
   * @param username {string}
   * @returns Promise<string>
   */
  async findUserByUsername(username: string): Promise<UserEntity> {
    return await this.createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r', 'r.active = true')
      .leftJoinAndSelect('r.permissions', 'rp', 'rp.active = true')
      .leftJoinAndSelect('u.permissions', 'p', 'p.active = true')
      .where('u.username = :username', { username })
      .getOne();
  }

  /**
   * find user by username with contests
   * @param username {string}
   * @returns Promise<string>
   */
  async getByUsername(username: string): Promise<UserEntity> {
    return await this.createQueryBuilder('u')
      .where('u.username = :username', { username })
      .getOne();
  }

  /**
   * find user by provider
   * @param providerId {string}
   * @param provider {string}
   * @returns Promise<UserEntity>
   */
  async findUserByProvider(
    providerId: string,
    provider: string,
  ): Promise<UserEntity> {
    return await this.createQueryBuilder('u')
      .where('u.provider_id = :providerId AND u.provider = :provider', {
        providerId,
        provider,
      })
      .getOne();
  }
}
