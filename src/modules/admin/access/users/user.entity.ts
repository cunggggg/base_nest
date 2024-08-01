import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
  OneToMany, OneToOne, JoinColumn,
} from 'typeorm';
import { BaseEntity } from '@database/entities';
import { PermissionEntity } from '../permissions/permission.entity';
import { RoleEntity } from '../roles/role.entity';
import { UserStatus } from './user-status.enum';
import { ContentEntity } from '@modules/contents/entities/content.entity';
import { ContestEntity } from '@modules/contests/entities/contest.entity';
import { UserVotesEntity } from '@modules/votes/entities/vote.entity';
import { ContestRankEntity } from '@modules/contests/entities/contest-rank.entity';
import { UserXpLevelsEntity } from '@admin/access/users/user-xp-levels.entity';
import { UserContestVoteEntity } from '@modules/contests/entities/user-contest-vote.entity';

@Entity({ schema: 'admin', name: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryColumn({ name: 'id', type: 'uuid', generated: 'uuid' })
  id?: string;

  @Column({
    name: 'username',
    type: 'varchar',
    unique: true,
  })
  username: string;

  @Column({
    name: 'name',
    type: 'varchar',
  })
  name: string;

  @Column({
    name: 'provider',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  provider: string;

  @Column({
    name: 'provider_id',
    type: 'varchar',
    length: 255,
  })
  providerId: string;

  @Column({
    name: 'password',
    type: 'varchar',
    nullable: false,
  })
  password: string;

  @Column({
    name: 'avatar',
    type: 'varchar',
  })
  avatar: string;

  @Column({
    name: 'country',
    type: 'varchar',
  })
  country: string;

  @Column({
    name: 'bio',
    type: 'varchar',
  })
  bio: string;

  @Column({
    name: 'personal_link',
    type: 'varchar',
  })
  personalLink: string;

  @Column({
    name: 'instagram_link',
    type: 'varchar',
  })
  instagramLink: string;

  @Column({
    name: 'tiktok_link',
    type: 'varchar',
  })
  tiktokLink: string;

  @Column({
    name: 'is_super_user',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isSuperUser: boolean;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    nullable: false,
  })
  status: UserStatus;

  @Column({
    name: 'devices',
    type: 'simple-array',
  })
  devices: string[];

  @ManyToMany(() => RoleEntity, (role) => role.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'users_roles',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: Promise<RoleEntity[]>;

  @ManyToMany(() => PermissionEntity, (permission) => permission.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'users_permissions',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions: Promise<PermissionEntity[]>;

  @ManyToMany(() => ContestEntity, (contest) => contest.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'users_contests',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'contest_id',
      referencedColumnName: 'id',
    },
  })
  contests: Promise<ContestEntity[]>;

  @OneToMany(() => ContentEntity, (content) => content.user, {
    lazy: true,
  })
  contents: Promise<ContentEntity[]>;

  @ManyToMany(() => UserEntity, (user) => user.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'user_follow',
    joinColumn: {
      name: 'follower_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'followed_id',
      referencedColumnName: 'id',
    },
  })
  followings: Promise<UserEntity[]>;

  @ManyToMany(() => UserEntity, (user) => user.id, {
    lazy: true,
    cascade: true,
  })
  @JoinTable({
    name: 'user_follow',
    joinColumn: {
      name: 'followed_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'follower_id',
      referencedColumnName: 'id',
    },
  })
  followers: Promise<UserEntity[]>;

  @OneToMany(() => UserVotesEntity, (vote) => vote.user, {
    lazy: true,
  })
  votes: Promise<UserVotesEntity[]>;

  @OneToMany(() => UserContestVoteEntity, (vote) => vote.user, {
    lazy: true,
  })
  contestVotes: Promise<UserContestVoteEntity[]>;

  @OneToMany(() => ContestRankEntity, (rank) => rank.user, {
    lazy: true,
  })
  ranks: Promise<ContestRankEntity[]>;

  @OneToOne(() => UserXpLevelsEntity, (entity) => entity.user)
  userXpLevel: Promise<UserXpLevelsEntity>;

  constructor(user?: Partial<UserEntity>) {
    super();
    Object.assign(this, user);
  }
}
