import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BattleSequenceEntity } from '@modules/battle-sequences/entities/battle-sequence.entity';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { ContentEntity } from '@modules/contents/entities/content.entity';

@Entity({ schema: 'admin', name: 'battle_sequence_steps' })
export class BattleSequenceStepEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'step',
    type: 'integer',
  })
  step: number;

  @Column({
    name: 'vote_rate',
    type: 'numeric',
  })
  voteRate: number;

  @Column({
    name: 'xp_watching_bonus',
    type: 'integer',
  })
  xpWatchingBonus: number;

  @ManyToOne(() => ContentEntity, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'vote_for' })
  voteFor: Promise<ContentEntity>;

  @ManyToOne(() => BattleSequenceEntity, {
    lazy: true,
  })
  @JoinColumn({ name: 'battle_sequence_id' })
  battleSequence: Promise<BattleSequenceEntity>;

  @ManyToOne(() => BattleEntity, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'battle_id' })
  battle: Promise<BattleEntity>;

  constructor(entity?: Partial<BattleSequenceStepEntity>) {
    Object.assign(this, entity);
  }
}
