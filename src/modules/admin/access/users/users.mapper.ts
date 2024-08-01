import { PermissionEntity } from '../permissions/permission.entity';
import { PermissionMapper } from '../permissions/permission.mapper';
import { RoleEntity } from '../roles/role.entity';
import { RoleMapper } from '../roles/role.mapper';
import { CreateUserRequestDto, UpdateUserRequestDto, UserResponseDto } from './dtos';
import { UserStatus } from './user-status.enum';
import { UserEntity } from './user.entity';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';
import { UserProfileRequestDto } from '@admin/access/users/dtos/user-profile-request.dto';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';
import { UserDevicesDto } from '@admin/access/users/dtos/user-devices.dto';

export class UserMapper {
  public static toDtoShort(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.avatar = entity.avatar;
    dto.name = entity.name;
    return dto;
  }

  public static toDto(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.provider = entity.provider;
    dto.status = entity.status;
    dto.isSuperUser = entity.isSuperUser;
    return dto;
  }

  public static toDtoBasic(entity: UserEntity): UserProfileResponseDto {
    const dto = new UserProfileResponseDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.name = entity.name;
    dto.avatar = entity.avatar;
    dto.bio = entity.bio;
    dto.personal = entity.personalLink;
    dto.instagram = entity.instagramLink;
    dto.tiktok = entity.tiktokLink;
    return dto;
  }

  public static async toDtoDetail(
    entity: UserEntity,
  ): Promise<UserProfileResponseDto> {
    const dto = new UserProfileResponseDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.name = entity.name;
    dto.avatar = entity.avatar;
    dto.bio = entity.bio;
    dto.personal = entity.personalLink;
    dto.instagram = entity.instagramLink;
    dto.tiktok = entity.tiktokLink;
    dto.videos = (await entity.contents).length;
    dto.votes = 0;
    dto.points = 0;
    dto.winRate = 0;

    return dto;
  }

  public static async toDtoWithRelations(
    entity: UserEntity,
  ): Promise<UserResponseDto> {
    const dto = new UserResponseDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.provider = entity.provider;
    dto.permissions = await Promise.all(
      (await entity.permissions).map(PermissionMapper.toDto),
    );
    dto.roles = await Promise.all(
      (await entity.roles).map(RoleMapper.toDtoWithRelations),
    );
    dto.isSuperUser = entity.isSuperUser;
    dto.status = entity.status;
    return dto;
  }

  public static async toDtoWithContents(
    entity: UserEntity,
  ): Promise<UserContentResponseDto[]> {
    const dict = {};
    const dtos = [];
    const votes = await entity.contestVotes;
    for (let i = 0; i < votes.length; i++) {
      const vote = votes[i];
      const content = await vote.content;
      if (dict[content.id]) {
        continue;
      }

      const dto = new UserContentResponseDto();
      dto.id = content.id;
      dto.url = content.fileUrl;
      dto.fileOriginalName = content.fileOriginalName;
      dto.thumbnailUrl = content.thumbnailUrl;
      dto.votes = (await content.contestVotes).length;
      dto.contests = [];

      const contestEntities = await content.contests;
      if (contestEntities && contestEntities.length > 0) {
        for (let i = 0; i < contestEntities.length; i++) {
          const contestEntity = contestEntities[i];
          dto.contests.push({
            id: contestEntity.id,
            name: contestEntity.name,
          });
        }
      }
      dict[content.id] = true;
      dtos.push(dto);
    }
    return Promise.all(dtos);
  }

  public static async toProfileDto(
    entity: UserEntity,
    userFollowing = null,
  ): Promise<UserProfileResponseDto> {
    const dto = new UserProfileResponseDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.name = entity.name;
    dto.avatar = entity.avatar;
    dto.country = entity.country;
    dto.bio = entity.bio;
    dto.personal = entity.personalLink;
    dto.instagram = entity.instagramLink;
    dto.tiktok = entity.tiktokLink;
    dto.winRate = 0;
    dto.votes = 0;
    // dto.votes = (await entity.contestVotes).length;
    const level = await entity.userXpLevel;
    dto.xp = level ? level.xp : 0;
    if (userFollowing) {
      dto.following = (await entity.followers).some(
        (user) => user.id === userFollowing,
      );
    }
    return dto;
  }

  public static async toUserDevicesDto(
    entity: UserEntity,
  ): Promise<UserDevicesDto> {
    const dto = new UserDevicesDto();

    dto.id = entity.id;
    dto.username = entity.username;
    dto.name = entity.name;
    dto.devices = entity.devices;
    return dto;
  }

  public static toCreateEntity(dto: CreateUserRequestDto): UserEntity {
    const entity = new UserEntity();
    entity.username = dto.username;
    entity.name = dto.name;
    entity.providerId = dto.providerId;
    entity.provider = dto.provider;
    entity.password = dto.password;
    entity.instagramLink = dto.instagram;
    entity.avatar = dto.avatar;
    entity.permissions = Promise.resolve(
      dto.permissions.map((id) => new PermissionEntity({ id })),
    );
    entity.roles = Promise.resolve(
      dto.roles.map((id) => new RoleEntity({ id })),
    );
    entity.status = UserStatus.Active;
    entity.isSuperUser = false;
    return entity;
  }

  public static toUpdateEntity(
    entity: UserEntity,
    dto: UpdateUserRequestDto,
  ): UserEntity {
    entity.username = dto.username;
    entity.provider = dto.provider;
    entity.permissions = Promise.resolve(
      dto.permissions.map((id) => new PermissionEntity({ id })),
    );
    entity.roles = Promise.resolve(
      dto.roles.map((id) => new RoleEntity({ id })),
    );
    entity.status = dto.status;
    return entity;
  }

  public static toUpdateProfileEntity(
    entity: UserEntity,
    dto: UserProfileRequestDto,
  ): UserEntity {
    entity.username = dto.username || entity.username;
    entity.name = dto.name || entity.name;
    entity.bio = dto.bio || entity.bio;
    entity.personalLink = dto.personal || entity.personalLink;
    entity.instagramLink = dto.instagram || entity.instagramLink;
    entity.tiktokLink = dto.tiktok || entity.tiktokLink;
    return entity;
  }
}
