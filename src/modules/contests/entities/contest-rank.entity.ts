import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@database/entities';
import { UserEntity } from '@admin/access/users/user.entity';
import { ContestEntity } from '@modules/contests/entities/contest.entity';

@Entity({ schema: 'admin', name: 'contest_ranks' })
export class ContestRankEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'rank',
    type: 'integer',
  })
  rank: number;

  @Column({ name: 'total_votes' })
  totalVotes: number;

  @ManyToOne(() => ContestEntity, (contest) => contest.ranks, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'contest_id' })
  contest: Promise<ContestEntity>;

  @ManyToOne(() => UserEntity, (user) => user.ranks, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;

  constructor(contest?: Partial<ContestRankEntity>) {
    super();
    Object.assign(this, contest);
  }
}
