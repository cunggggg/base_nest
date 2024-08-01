import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '@admin/access/users/user.entity';
import { XpLevelEntity } from '@modules/xp-levels/entities/xp-level.entity';

@Entity({ schema: 'admin', name: 'user_xp_levels' })
export class UserXpLevelsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'xp',
    type: 'integer',
  })
  xp: number;

  @Column({
    name: 'rewards_claim',
    type: 'simple-array',
  })
  rewardsClaim: string[];

  @Column({
    name: 'token',
    type: 'integer',
  })
  token: number;

  @Column({
    name: 'energy',
    type: 'integer',
  })
  energy: number;

  @Column({
    name: 'last_time_checked',
    type: 'timestamp with time zone',
  })
  lastTimeChecked: Date;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;

  @ManyToOne(() => XpLevelEntity, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'level' })
  level: Promise<XpLevelEntity>;

  constructor(user?: Partial<UserXpLevelsEntity>) {
    Object.assign(this, user);
  }
}
