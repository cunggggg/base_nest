import { EntityRepository, Repository } from 'typeorm';
import { BattleSequenceEntity } from '@modules/battle-sequences/entities/battle-sequence.entity';
import { BattleSequenceStatus } from '@common/enums/battle-sequence-status.enum';

@EntityRepository(BattleSequenceEntity)
export class BattleSequencesRepository extends Repository<BattleSequenceEntity> {
  /**
   * Get battle sequences by user id
   * @returns []
   */
  public async getByUserAndContestId(
    userId: string,
    contestId: number,
  ): Promise<BattleSequenceEntity[]> {
    const query = this.createQueryBuilder('bs').where(
      'bs.voted_user = :userId AND bs.contest_id = :contestId',
      {
        userId: userId,
        contestId: contestId,
      },
    );

    return query.getMany();
  }

  /**
   * Get battle sequences by user id
   * @returns []
   */
  public async getByContestId(
    contestId: number,
  ): Promise<BattleSequenceEntity[]> {
    const query = this.createQueryBuilder('bs').where(
      'bs.contest_id = :contestId',
      {
        contestId: contestId,
      },
    );

    return query.getMany();
  }

  /**
   * Get battle sequences by id and user
   * @returns []
   */
  public async getByIdAndUser(
    id: number,
    userId: string,
  ): Promise<BattleSequenceEntity> {
    const query = this.createQueryBuilder('bs').where(
      'bs.id = :bsId AND bs.voted_user = :userId AND bs.status = :status',
      {
        userId: userId,
        bsId: id,
        status: BattleSequenceStatus.IN_PROGRESS,
      },
    );

    return query.getOne();
  }
}
