import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn, OneToMany,
} from 'typeorm';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { UserVotesEntity } from '@modules/votes/entities/vote.entity';

@Entity({ schema: 'admin', name: 'contest_battles' })
export class BattleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ContestEntity, (contest) => contest.battles, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'contest_id' })
  contest: Promise<ContestEntity>;

  @ManyToOne(() => ContentEntity, (content) => content.ABattles, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'content_a' })
  contentA: Promise<ContentEntity>;

  @ManyToOne(() => ContentEntity, (content) => content.BBattles, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'content_b' })
  contentB: Promise<ContentEntity>;

  @OneToMany(() => UserVotesEntity, (vote) => vote.battle, {
    lazy: true,
  })
  votes: Promise<UserVotesEntity[]>;

  @Column({
    name: 'winner',
    type: 'integer',
    default: 0,
  })
  winner: number;

  constructor(user?: Partial<BattleEntity>) {
    Object.assign(this, user);
  }
}
