import { EntityRepository, Repository } from 'typeorm';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { PaginationRequest } from '@common/interfaces';

@EntityRepository(BattleEntity)
export class BattlesRepository extends Repository<BattleEntity> {
  /**
   * Get battles list
   * @param pagination {PaginationRequest}
   * @returns [entities: BattleEntity[], total: number]
   */
  public async getExploringAndCount(
    pagination: PaginationRequest,
  ): Promise<[entities: BattleEntity[], total: number]> {
    const size = pagination.limit || 10;
    const page = pagination.page || 1;
    const skip = (page - 1) * size;

    const query = this.createQueryBuilder('b')
      .innerJoin('b.contest', 'c')
      .innerJoin('b.contentA', 'ca')
      .innerJoin('b.contentB', 'cb')
      .skip(skip)
      .take(size)
      .addOrderBy('b.id', 'DESC');

    return query.getManyAndCount();
  }

  /**
   * Get battles by content
   * @param contentId {number}
   * @returns BattleEntity[]
   */
  public async getByContent(contentId: number): Promise<BattleEntity[]> {
    const query = this.createQueryBuilder('b')
      .innerJoin('b.contest', 'c')
      .innerJoin('b.contentA', 'ca')
      .innerJoin('b.contentB', 'cb')
      .where('ca.id = :id OR cb.id = :id', { id: contentId });

    return query.getMany();
  }

  /**
   * Get battles by content
   * @param contestId {number}
   * @param contentId {number}
   * @returns BattleEntity[]
   */
  public async getByContestAndContent(
    contestId: number,
    contentId: number,
  ): Promise<BattleEntity[]> {
    const query = this.createQueryBuilder('b')
      .innerJoin('b.contest', 'c')
      .innerJoin('b.contentA', 'ca')
      .innerJoin('b.contentB', 'cb')
      .where(
        'c.id = :contestId AND (ca.id = :contentId OR cb.id = :contentId)',
        { contestId, contentId },
      );

    return query.getMany();
  }
}
