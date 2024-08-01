import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { ChangePasswordRequestDto, CreateUserRequestDto, UpdateUserRequestDto, UserResponseDto } from './dtos';
import { ForeignKeyConflictException, InvalidCurrentPasswordException, UserExistsException } from '@common/exeptions';
import { PaginationRequest } from '@common/interfaces';
import { PaginationResponseDto } from '@common/dtos';
import { UsersRepository } from './users.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { HashHelper, Pagination } from '@helpers';
import { DBErrorCode } from '@common/enums';
import { UserMapper } from './users.mapper';
import { TimeoutError } from 'rxjs';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';
import { UserProfileRequestDto } from '@admin/access/users/dtos/user-profile-request.dto';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';
import { UserAlreadyFollowException } from '@common/exeptions/user-already-follow.exception';
import { UserEntity } from '@admin/access/users/user.entity';
import { UserNotFollowException } from '@common/exeptions/user-not-follow.exception';
import { XpLevelsRepository } from '@modules/xp-levels/xp-levels.repository';
import { SettingsRepository } from '@modules/settings/settings.repository';
import { EnergyType, SettingType } from '@modules/settings/type.enum';
import { UserXpLevelsRepository } from '@admin/access/users/user-xp-levels.repository';
import { UserXpLevelsEntity } from '@admin/access/users/user-xp-levels.entity';
import { XpLevelEntity } from '@modules/xp-levels/entities/xp-level.entity';
import { generateUsername } from 'username-generator';
import { UserDevicesDto } from '@admin/access/users/dtos/user-devices.dto';
import { ConfigService } from '@nestjs/config';
import { CronjobHelper } from '../../../../helpers/cronjob.helper';
import { UserEnergyDto } from '@admin/access/users/dtos/user-energy.dto';
import { UserEnergyNotEnoughException } from '@common/exeptions/user-energy-not-enough.exception';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    @InjectRepository(UserXpLevelsRepository)
    private userXpLevelsRepository: UserXpLevelsRepository,
    @InjectRepository(XpLevelsRepository)
    private xpLevelsRepository: XpLevelsRepository,
    @InjectRepository(SettingsRepository)
    private settingsRepository: SettingsRepository,
    private configService: ConfigService,
  ) {}

  /**
   * Get a paginated user list
   * @param pagination {PaginationRequest}
   * @returns {Promise<PaginationResponseDto<UserProfileResponseDto>>}
   */
  public async getUsers(
    pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<UserProfileResponseDto>> {
    try {
      const [userEntities, totalUsers] =
        await this.usersRepository.getUsersAndCount(pagination);

      const UserDtos = await Promise.all(
        userEntities.map(UserMapper.toDtoDetail),
      );
      return Pagination.of(pagination, totalUsers, UserDtos);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get a paginated user list
   * @returns {Promise<PaginationResponseDto<UserProfileResponseDto>>}
   * @param userId
   */
  public async getUserVideoCount(userId: string): Promise<number> {
    try {
      return this.usersRepository.getUserVideoCount(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  public async generateUsername(): Promise<string> {
    const proposedName = generateUsername('', 20);
    return this.generateUniqueUsername(proposedName);
  }

  public async generateUniqueUsername(proposedName): Promise<string> {
    const user = await this.usersRepository.getByUsername(proposedName);
    if (!user) {
      return proposedName;
    }
    proposedName += Math.floor(Math.random() * 100 + 1);
    return await this.generateUniqueUsername(proposedName);
  }

  /**
   * Get a paginated user list
   * @returns {Promise<PaginationResponseDto<UserResponseDto>>}
   * @param keyword
   */
  public async searchUsers(keyword: string): Promise<UserResponseDto[]> {
    try {
      const userEntities = await this.usersRepository.searchUsers(keyword);
      return Promise.all(userEntities.map(UserMapper.toDto));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Update User Avatar
   * @returns {Promise<UserProfileResponseDto>}
   * @param userId
   * @param avatar
   */
  public async updateAvatar(
    userId: string,
    avatar: string,
  ): Promise<UserProfileResponseDto> {
    try {
      const userEntity = await this.usersRepository.findOne(userId);
      if (!userEntity) {
        throw new NotFoundException();
      }

      userEntity.avatar = avatar;
      await this.usersRepository.save(userEntity);
      return UserMapper.toProfileDto(userEntity);
    } catch (error) {
      console.log(error);

      if (error instanceof NotFoundException) {
        throw new NotFoundException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get user by id
   * @param id {string}
   * @returns {Promise<UserResponseDto>}
   */
  public async getUserById(id: string): Promise<UserResponseDto> {
    const userEntity = await this.usersRepository.findOne(id, {
      relations: ['permissions', 'roles'],
    });
    if (!userEntity) {
      throw new NotFoundException();
    }

    return UserMapper.toDtoWithRelations(userEntity);
  }

  /**
   * append device to user
   * @param id {string}
   * @param deviceToken
   * @returns {Promise<UserDevicesDto>}
   */
  public async appendDevice(
    id: string,
    deviceToken: string,
  ): Promise<UserDevicesDto> {
    const userEntity = await this.usersRepository.findOne(id);
    if (!userEntity) {
      throw new NotFoundException();
    }
    console.log('<<<<<<<<<<<<<<<<<appendToken: ' + deviceToken);
    console.log('<<<<<<<<<<<<<<<<<User: ' + userEntity.username);
    const devices = userEntity.devices ? userEntity.devices : [];
    if (!devices.some((d) => d === deviceToken)) {
      devices.push(deviceToken);
    }

    userEntity.devices = devices;
    console.log(devices);
    await this.usersRepository.save(userEntity);
    return UserMapper.toUserDevicesDto(userEntity);
  }

  /**
   * remove device from user
   * @param userId {string}
   * @param deviceToken
   * @returns {Promise<UserDevicesDto>}
   */
  public async removeDevice(
    userId: string,
    deviceToken: string,
  ): Promise<void> {
    const userEntity = await this.usersRepository.findOne(userId);
    if (!userEntity) {
      throw new NotFoundException();
    }
    const devices = userEntity.devices ? userEntity.devices : [];

    userEntity.devices = devices.filter((token) => token !== deviceToken);
    await this.usersRepository.save(userEntity);
  }

  /**
   * Get user profile
   * @param id {string}
   * @param userFollowing
   * @returns {Promise<UserProfileResponseDto>}
   */
  public async getUserProfile(
    id: string,
    userFollowing = null,
  ): Promise<UserProfileResponseDto> {
    const userEntity = await this.usersRepository.findOne(id, {
      relations: ['followers'],
    });
    if (!userEntity) {
      throw new NotFoundException();
    }

    return UserMapper.toProfileDto(userEntity, userFollowing);
  }

  /**
   * Get voted contents
   * @returns {Promise<UserProfileResponseDto[]>}
   */
  public async getUserVotedContents(
    id: string,
  ): Promise<UserContentResponseDto[]> {
    const userEntity = await this.usersRepository.findOne(id);
    if (!userEntity) {
      throw new NotFoundException();
    }

    return await UserMapper.toDtoWithContents(userEntity);
  }

  /**
   * Get user profile
   * @param id {string}
   * @param userDto
   * @returns {Promise<UserProfileResponseDto>}
   */
  public async updateUserProfile(
    id: string,
    userDto: UserProfileRequestDto,
  ): Promise<UserProfileResponseDto> {
    let userEntity = await this.usersRepository.findOne(id);
    if (!userEntity) {
      throw new NotFoundException();
    }

    try {
      userEntity = UserMapper.toUpdateProfileEntity(userEntity, userDto);
      userEntity = await this.usersRepository.save(userEntity);
      return UserMapper.toProfileDto(userEntity);
    } catch (error) {
      console.log(error);
      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new UserExistsException(userDto.username);
      }
      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * follow user
   * @returns {Promise<void>}
   * @param following
   * @param follower
   */
  public async follow(following: string, follower: string): Promise<void> {
    const userEntity = await this.usersRepository.findOne(following, {
      relations: ['followings'],
    });

    const followerEntity = await this.usersRepository.findOne(follower);

    if (!userEntity || !followerEntity) {
      throw new NotFoundException();
    }

    const followingList = await userEntity.followings;
    const alreadyFollow = followingList.some((user) => {
      return user.id === follower;
    });

    if (alreadyFollow) {
      throw new UserAlreadyFollowException(followerEntity.username);
    }

    followingList.push(new UserEntity({ id: follower }));
    userEntity.followings = Promise.resolve(followingList);
    try {
      await this.usersRepository.save(userEntity);
    } catch (error) {
      console.log(error);

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * unfollow user
   * @returns {Promise<void>}
   * @param following
   * @param follower
   */
  public async unfollow(following: string, follower: string): Promise<void> {
    const userEntity = await this.usersRepository.findOne(following, {
      relations: ['followings'],
    });

    const followerEntity = await this.usersRepository.findOne(follower);

    if (!userEntity || !followerEntity) {
      throw new NotFoundException();
    }

    let followingList = await userEntity.followings;
    const alreadyFollow = followingList.some((user) => {
      return user.id === follower;
    });

    if (!alreadyFollow) {
      throw new UserNotFollowException(followerEntity.username);
    }

    followingList = followingList.filter((user) => {
      return user.id !== follower;
    });
    userEntity.followings = Promise.resolve(followingList);

    try {
      await this.usersRepository.save(userEntity);
    } catch (error) {
      console.log(error);

      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Get user by provider
   * @param providerId {string}
   * @param provider {string}
   * @returns {Promise<UserResponseDto>}
   */
  public async getUserByProvider(
    providerId: string,
    provider: string,
  ): Promise<UserResponseDto> {
    const userEntity = await this.usersRepository.findUserByProvider(
      providerId,
      provider,
    );
    if (!userEntity) {
      return null;
    }

    return UserMapper.toDtoWithRelations(userEntity);
  }

  /**
   * Create new user
   * @param userDto {CreateUserRequestDto}
   * @returns {Promise<UserResponseDto>}
   */
  public async createUser(
    userDto: CreateUserRequestDto,
  ): Promise<UserResponseDto> {
    try {
      let userEntity = UserMapper.toCreateEntity(userDto);
      userEntity.password = await HashHelper.encrypt(userEntity.password);
      userEntity = await this.usersRepository.save(userEntity);
      return UserMapper.toDto(userEntity);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new UserExistsException(userDto.username);
      }
      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Update User by id
   * @param id {string}
   * @param userDto {UpdateUserRequestDto}
   * @returns {Promise<UserResponseDto>}
   */
  public async updateUser(
    id: string,
    userDto: UpdateUserRequestDto,
  ): Promise<UserResponseDto> {
    let userEntity = await this.usersRepository.findOne(id);
    if (!userEntity) {
      throw new NotFoundException();
    }

    try {
      userEntity = UserMapper.toUpdateEntity(userEntity, userDto);
      userEntity = await this.usersRepository.save(userEntity);
      return UserMapper.toDto(userEntity);
    } catch (error) {
      if (error.code == DBErrorCode.PgUniqueConstraintViolation) {
        throw new UserExistsException(userDto.username);
      }
      if (
        error.code == DBErrorCode.PgForeignKeyConstraintViolation ||
        error.code == DBErrorCode.PgNotNullConstraintViolation
      ) {
        throw new ForeignKeyConflictException();
      }
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Change user password
   * @param changePassword {ChangePasswordRequestDto}
   * @param user {string}
   * @returns {Promise<UserResponseDto>}
   */
  public async changePassword(
    changePassword: ChangePasswordRequestDto,
    userId: string,
  ): Promise<UserResponseDto> {
    const { currentPassword, newPassword } = changePassword;

    const userEntity = await this.usersRepository.findOne({ id: userId });

    if (!userEntity) {
      throw new NotFoundException();
    }

    const passwordMatch = await HashHelper.compare(
      currentPassword,
      userEntity.password,
    );

    if (!passwordMatch) {
      throw new InvalidCurrentPasswordException();
    }

    try {
      userEntity.password = await HashHelper.encrypt(newPassword);
      await this.usersRepository.save(userEntity);
      return UserMapper.toDto(userEntity);
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Recharge all users
   * @returns {Promise<void>}
   */
  async rechargeAll(): Promise<void> {
    try {
      const maxEnergy = +this.configService.get('ENERGY_MAXIMUM');
      await this.userXpLevelsRepository.updateEnergyAll(maxEnergy);
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * get User Energy
   * @returns {Promise<void>}
   */
  async getEnergy(userId: string): Promise<UserEnergyDto> {
    try {
      const userLevel = await this.getOrCreateUserEnergy(userId);
      const dto = new UserEnergyDto();
      dto.energy = userLevel.energy;
      dto.max = +this.configService.get('ENERGY_MAXIMUM');
      dto.nextRefill = CronjobHelper.getEnergyRechargeNextTime(
        this.configService,
      );
      return dto;
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * get User Energy
   * @returns {Promise<void>}
   */
  async checkEnergy(userId): Promise<UserXpLevelsEntity> {
    try {
      const userLevel = await this.getOrCreateUserEnergy(userId);
      if (userLevel.energy <= 0) {
        throw new UserEnergyNotEnoughException();
      }
      return userLevel;
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof UserEnergyNotEnoughException) {
        throw error;
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * get User Energy
   * @returns {Promise<void>}
   */
  async useEnergy(userLevel: UserXpLevelsEntity): Promise<UserEnergyDto> {
    try {
      userLevel.energy = userLevel.energy - 1;
      await this.userXpLevelsRepository.save(userLevel);

      const dto = new UserEnergyDto();
      dto.energy = userLevel.energy;
      dto.max = +this.configService.get('ENERGY_MAXIMUM');
      dto.nextRefill = CronjobHelper.getEnergyRechargeNextTime(
        this.configService,
      );
      return dto;
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof UserEnergyNotEnoughException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  /**
   * Check user is creator
   * @returns {Promise<void>}
   */
  async getXpEnergy(userId: string): Promise<any> {
    try {
      const userLevel = await this.getOrCreateUserXpLevel(userId);
      const xpLevels = await this.xpLevelsRepository.getXpLevels();
      const settings = await this.settingsRepository.getSettings(
        SettingType.ENERGY,
      );

      const level = await userLevel.level;
      const levelRewardsClaim = {
        tokenReward: 0,
        energyRefill: 0,
      };
      if (userLevel.rewardsClaim && userLevel.rewardsClaim.length > 0) {
        userLevel.rewardsClaim.forEach((l) => {
          const level = xpLevels[l] as XpLevelEntity;
          levelRewardsClaim.tokenReward += level.tokenRewards;
          levelRewardsClaim.energyRefill +=
            +settings[EnergyType.REFILL_LEVEL_UP];
        });
      }
      let checkTime = userLevel.lastTimeChecked.getTime();
      const currentTime = new Date().getTime();
      const timeStep = +settings[EnergyType.REFILL_TIME] * 60 * 1000;
      let energyToAdd = Math.floor((currentTime - checkTime) / timeStep);
      if (energyToAdd < 0) {
        energyToAdd = 0;
      }

      userLevel.energy += energyToAdd;

      const maxEnergy = +settings[EnergyType.MAX_ENERGY];
      if (userLevel.energy > maxEnergy) {
        userLevel.energy = maxEnergy;
      }

      checkTime = checkTime + energyToAdd * timeStep;
      const refillTime = timeStep - (currentTime - checkTime);

      return {
        level: {
          value: level.level,
          currentXps: userLevel.xp,
          nextLevelXps: xpLevels[level.level + 1]
            ? xpLevels[level.level + 1].xp
            : 0,
          levelRewardsClaim: levelRewardsClaim,
        },
        energy: {
          value: userLevel.energy,
          max: maxEnergy,
          refillTime: +settings[EnergyType.REFILL_TIME],
          timeToGetEnergy: Math.floor(refillTime / 1000),
        },
      };
    } catch (error) {
      this.logger.error(error.stack.toString());

      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof TimeoutError) {
        throw new RequestTimeoutException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getOrCreateUserEnergy(userId: string) {
    const maxEnergy = +this.configService.get('ENERGY_MAXIMUM');
    let userLevel = await this.userXpLevelsRepository.getByUser(userId);
    if (!userLevel) {
      const newEntity = new UserXpLevelsEntity();
      newEntity.user = Promise.resolve(new UserEntity({ id: userId }));
      newEntity.level = Promise.resolve(new XpLevelEntity({ level: 0 }));
      newEntity.xp = 0;
      newEntity.energy = maxEnergy;
      newEntity.token = 0;
      newEntity.lastTimeChecked = new Date();
      userLevel = await this.userXpLevelsRepository.save(newEntity);
    }
    return userLevel;
  }

  async getOrCreateUserXpLevel(userId: string) {
    const settings = await this.settingsRepository.getSettings(
      SettingType.ENERGY,
    );
    const maxEnergy = +settings[EnergyType.MAX_ENERGY];
    let userLevel = await this.userXpLevelsRepository.getByUser(userId);
    if (!userLevel) {
      const newEntity = new UserXpLevelsEntity();
      newEntity.user = Promise.resolve(new UserEntity({ id: userId }));
      newEntity.level = Promise.resolve(new XpLevelEntity({ level: 0 }));
      newEntity.xp = 0;
      newEntity.energy = maxEnergy;
      newEntity.token = 0;
      newEntity.lastTimeChecked = new Date();
      userLevel = await this.userXpLevelsRepository.save(newEntity);
    }
    return userLevel;
  }

  async addUserXp(userId: string, xp: number, token: number, energy: number) {
    const settings = await this.settingsRepository.getSettings(
      SettingType.ENERGY,
    );
    const maxEnergy = +settings[EnergyType.MAX_ENERGY];
    const userLevel = await this.getOrCreateUserXpLevel(userId);
    let currentLevel = (await userLevel.level).level;

    const xpLevels = await this.xpLevelsRepository.getXpLevelsFrom(
      currentLevel,
    );
    let remainingRewards = userLevel.rewardsClaim;
    if (!remainingRewards) {
      remainingRewards = [];
    }

    const totalXp = userLevel.xp + xp;
    let totalEnergy = userLevel.energy + energy;
    for (let i = 0; i < xpLevels.length; i += 1) {
      const xpLevel = xpLevels[i];
      if (totalXp < xpLevel.xp) {
        break;
      } else {
        //level-up
        currentLevel = xpLevel.level;
        totalEnergy += +settings[EnergyType.REFILL_LEVEL_UP];
        remainingRewards.push(`${xpLevel.level}`);
      }
    }

    userLevel.xp = totalXp;
    userLevel.rewardsClaim = remainingRewards;
    userLevel.level = Promise.resolve(
      new XpLevelEntity({ level: currentLevel }),
    );
    userLevel.energy = totalEnergy > maxEnergy ? maxEnergy : totalEnergy;
    userLevel.token += token;
    userLevel.lastTimeChecked = new Date();

    await this.userXpLevelsRepository.save(userLevel);
  }

  /**
   * Get user by id
   * @param id {string}
   * @returns {Promise<UserResponseDto>}
   */
  public async getUserRank(id: string): Promise<UserResponseDto> {
    const userEntity = await this.usersRepository.findOne(id, {
      relations: ['permissions', 'roles'],
    });
    if (!userEntity) {
      throw new NotFoundException();
    }

    return UserMapper.toDtoWithRelations(userEntity);
  }
}
