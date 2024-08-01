import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { BaseEntity } from '@database/entities';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { UserEntity } from '@admin/access/users/user.entity';

@Entity({ schema: 'admin', name: 'user_contest_votes' })
export class UserContestVoteEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'contest_id' })
  contestId: number;

  @Column({ name: 'content_id' })
  contentId: number;

  @ManyToOne(() => ContentEntity, (c) => c.contestVotes, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'content_id' })
  content: Promise<ContentEntity>;

  @ManyToOne(() => ContestEntity, (c) => c.contestVotes, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'contest_id' })
  contest: Promise<ContestEntity>;

  @ManyToOne(() => UserEntity, (c) => c.contestVotes, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;

  constructor(userVote?: Partial<UserContestVoteEntity>) {
    super();
    Object.assign(this, userVote);
  }
}
