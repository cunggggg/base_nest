import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@database/entities';

@Entity({ schema: 'admin', name: 'xp_levels' })
export class XpLevelEntity extends BaseEntity {
  @PrimaryColumn({
    name: 'level',
    type: 'integer',
  })
  level: number;

  @Column({
    name: 'xp',
    type: 'integer',
    nullable: false,
  })
  xp: number;

  @Column({
    name: 'token_rewards',
    type: 'integer',
    nullable: false,
  })
  tokenRewards: number;

  constructor(entity?: Partial<XpLevelEntity>) {
    super();
    Object.assign(this, entity);
  }
}
