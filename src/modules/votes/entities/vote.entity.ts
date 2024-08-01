import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { UserEntity } from '@admin/access/users/user.entity';
import { BattleEntity } from '@modules/battles/entities/battle.entity';

@Entity({ schema: 'admin', name: 'user_votes' })
export class UserVotesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, (u) => u.votes, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;

  @ManyToOne(() => BattleEntity, (b) => b.votes, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'battle_id' })
  battle: Promise<BattleEntity>;

  @ManyToOne(() => ContentEntity, (c) => c.votes, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'content_id' })
  content: Promise<ContentEntity>;

  constructor(userVote?: Partial<UserVotesEntity>) {
    Object.assign(this, userVote);
  }
}
