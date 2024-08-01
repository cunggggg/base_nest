import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@admin/access/users/user.entity';
import { ContestEntity } from '@modules/contests/entities/contest.entity';

@Entity({ schema: 'admin', name: 'contest_claims' })
export class ContestClaimsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'participant_type',
    type: 'integer',
  })
  participantType: number;

  @Column({
    name: 'claimed',
    type: 'boolean',
    default: false,
  })
  claimed: boolean;

  @ManyToOne(() => ContestEntity, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'contest_id' })
  contest: Promise<ContestEntity>;

  @ManyToOne(() => UserEntity, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;

  constructor(contest?: Partial<ContestClaimsEntity>) {
    Object.assign(this, contest);
  }
}
