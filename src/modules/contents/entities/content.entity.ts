import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@database/entities';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { UserEntity } from '@admin/access/users/user.entity';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { UserVotesEntity } from '@modules/votes/entities/vote.entity';
import { UserContestVoteEntity } from '@modules/contests/entities/user-contest-vote.entity';

@Entity({ schema: 'admin', name: 'contents' })
export class ContentEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'file_original_name',
    type: 'varchar',
    nullable: false,
  })
  fileOriginalName: string;

  @Column({
    name: 'file_name',
    type: 'varchar',
    nullable: false,
  })
  fileName: string;

  @Column({
    name: 'file_url',
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  fileUrl: string;

  @Column({
    name: 'thumbnail_url',
    type: 'varchar',
    unique: true,
    nullable: false,
  })
  thumbnailUrl: string;

  @ManyToMany(() => ContestEntity, (contest) => contest.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'contests_contents',
    joinColumn: {
      name: 'content_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'contest_id',
      referencedColumnName: 'id',
    },
  })
  contests: Promise<ContestEntity[]>;

  @ManyToOne(() => UserEntity, (user) => user.contents, {
    lazy: true,
    cascade: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Promise<UserEntity>;

  @OneToMany(() => BattleEntity, (battle) => battle.contentA, {
    lazy: true,
  })
  ABattles: Promise<BattleEntity[]>;

  @OneToMany(() => BattleEntity, (battle) => battle.contentB, {
    lazy: true,
  })
  BBattles: Promise<BattleEntity[]>;

  @OneToMany(() => UserVotesEntity, (vote) => vote.content, {
    lazy: true,
  })
  votes: Promise<UserVotesEntity[]>;

  @OneToMany(() => UserContestVoteEntity, (vote) => vote.content, {
    lazy: true,
  })
  contestVotes: Promise<UserContestVoteEntity[]>;

  constructor(content?: Partial<ContentEntity>) {
    super();
    Object.assign(this, content);
  }
}
