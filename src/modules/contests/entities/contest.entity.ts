import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContestStates } from '@common/enums/contest-state.enum';
import { BaseEntity } from '@database/entities';
import { ContentEntity } from '../../contents/entities/content.entity';
import { UserEntity } from '@admin/access/users/user.entity';
import { BattleEntity } from '@modules/battles/entities/battle.entity';
import { ContestRankEntity } from '@modules/contests/entities/contest-rank.entity';
import { UserContestVoteEntity } from '@modules/contests/entities/user-contest-vote.entity';

@Entity({ schema: 'admin', name: 'contests' })
export class ContestEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  name: string;

  @Column({
    name: 'description',
    type: 'varchar',
    length: 2000,
    nullable: false,
  })
  description: string;

  @Column({
    name: 'long_description',
    type: 'varchar',
  })
  longDescription: string;

  @Column({
    name: 'rewards',
    type: 'varchar',
  })
  rewards: string;

  @Column({
    name: 'creator_name',
    type: 'varchar',
  })
  creatorName: string;

  @Column({
    name: 'creator_avatar',
    type: 'varchar',
  })
  creatorAvatar: string;

  @Column({
    name: 'creator_country',
    type: 'varchar',
  })
  creatorCountry: string;

  @Column({
    name: 'image_cover',
    type: 'varchar',
  })
  imageCover: string;

  @Column({
    name: 'single_upload',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  singleUpload: boolean;

  @Column({
    name: 'promote',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  promote: boolean;

  @Column({
    name: 'promote_order',
    type: 'integer',
    nullable: false,
    default: 0,
  })
  promoteOrder: number;

  @Column({
    name: 'rules',
    type: 'simple-array',
  })
  rules: string[];

  @Column({
    name: 'state',
    type: 'integer',
    default: ContestStates.NEW,
  })
  state: ContestStates;

  @Column({
    name: 'video_max_length',
    type: 'integer',
  })
  videoMaxLength: number;

  @Column({
    name: 'participant_prize',
    type: 'simple-array',
  })
  participantPrize: string[];

  @Column({
    name: 'contestant_rewards',
    type: 'simple-array',
  })
  contestantRewards: string[];

  @Column({
    name: 'vote_rewards',
    type: 'integer',
  })
  voteRewards: number;

  @Column({
    name: 'xp_rewards',
    type: 'simple-array',
  })
  xpRewards: string[];

  @Column({
    name: 'min_vote',
    type: 'integer',
  })
  minVote: number;

  @Column({
    name: 'min_participants',
    type: 'integer',
    default: 0,
  })
  minParticipants: number;

  @Column({
    name: 'max_participants',
    type: 'integer',
    default: 0,
  })
  maxParticipants: number;

  @Column({
    name: 'start_time',
    type: 'timestamp with time zone',
  })
  startTime: Date;

  @Column({
    name: 'end_time',
    type: 'timestamp with time zone',
  })
  endTime: Date;

  @Column({
    name: 'submission_deadline',
    type: 'timestamp with time zone',
  })
  submissionDeadline: Date;

  @Column({
    name: 'expire_time',
    type: 'timestamp with time zone',
  })
  expireTime: Date;

  @Column({
    name: 'video_intro',
    type: 'varchar',
  })
  videoIntro: string;

  @Column({
    name: 'video_intro_img',
    type: 'varchar',
  })
  videoIntroImg: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'owner' })
  owner: Promise<UserEntity>;

  @ManyToMany(() => ContentEntity, (content) => content.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'contests_contents',
    joinColumn: {
      name: 'contest_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'content_id',
      referencedColumnName: 'id',
    },
  })
  contents: Promise<ContentEntity[]>;

  @ManyToMany(() => UserEntity, (user) => user.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'users_contests',
    joinColumn: {
      name: 'contest_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  users: Promise<UserEntity[]>;

  @OneToMany(() => BattleEntity, (battle) => battle.contest, {
    lazy: true,
  })
  battles: Promise<BattleEntity[]>;

  @OneToMany(() => ContestRankEntity, (rank) => rank.contest, {
    lazy: true,
  })
  ranks: Promise<ContestRankEntity[]>;

  @OneToMany(() => UserContestVoteEntity, (vote) => vote.contest, {
    lazy: true,
  })
  contestVotes: Promise<UserContestVoteEntity[]>;

  constructor(contest?: Partial<ContestEntity>) {
    super();
    Object.assign(this, contest);
  }
}
