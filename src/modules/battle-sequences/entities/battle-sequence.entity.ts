import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@admin/access/users/user.entity';
import { BattleSequenceStatus } from '@common/enums/battle-sequence-status.enum';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { BattleSequenceStepEntity } from '@modules/battle-sequences/entities/battle-sequence-step.entity';

@Entity({ schema: 'admin', name: 'battle_sequences' })
export class BattleSequenceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'current_step',
    type: 'integer',
  })
  currentStep: number;

  @Column({
    name: 'status',
    type: 'integer',
    default: BattleSequenceStatus.IN_PROGRESS,
  })
  status: BattleSequenceStatus;

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
  @JoinColumn({ name: 'voted_user' })
  votedUser: Promise<UserEntity>;

  @OneToMany(() => BattleSequenceStepEntity, (b) => b.battleSequence, {
    lazy: true,
    cascade: true,
  })
  battleSequenceSteps: Promise<BattleSequenceStepEntity[]>;

  constructor(entity?: Partial<BattleSequenceEntity>) {
    Object.assign(this, entity);
  }
}
