import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { UserResponseDto } from './dtos';
import { ApiGlobalResponse, ApiPaginatedResponse, PaginationParams } from '@common/decorators';
import { PaginationRequest } from '@common/interfaces';
import { PaginationResponseDto } from '@common/dtos';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';
import { UserMapper } from '@admin/access/users/users.mapper';
import { UserProfileResponseDto } from '@admin/access/users/dtos/user-profile-response.dto';
import { UserProfileRequestDto } from '@admin/access/users/dtos/user-profile-request.dto';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';
import { ContentsService } from '@modules/contents/contents.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageHelper } from '../../../../helpers/storage.helper';
import { InvalidImageFileTypeException } from '@common/exeptions/invalid-image-file-type.exception';
import { ConfigService } from '@nestjs/config';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { MuxHelper } from '@helpers';
import { MuxService } from '@modules/integration/mux/mux.service';
import { DeviceTokenRequiredException } from '@common/exeptions/device-token-required.exception';
import { ContestsService } from '@modules/contests/contests.service';
import { UserEnergyDto } from '@admin/access/users/dtos/user-energy.dto';

@ApiTags('Users')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private contentsService: ContentsService,
    private muxService: MuxService,
    private readonly configService: ConfigService,
    private readonly fireBaseService: FireBaseService,
    private readonly contestsService: ContestsService,
  ) {}

  @ApiOperation({ description: 'Search users by name, username' })
  @ApiPaginatedResponse(UserProfileResponseDto)
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    example: 'abc',
  })
  @Get()
  public getUsers(
    @PaginationParams() pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<UserResponseDto>> {
    return this.usersService.getUsers(pagination);
  }

  @ApiOperation({ description: 'Search Users by username' })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    example: 'abc',
  })
  @Get('/search')
  public searchUsers(
    @Query('keyword') keyword: string,
  ): Promise<UserResponseDto[]> {
    return this.usersService.searchUsers(keyword);
  }

  @ApiOperation({ description: 'Get current user profile' })
  @ApiGlobalResponse(UserProfileResponseDto)
  @Get('/me')
  public async getMe(
    @CurrentUser() user: UserEntity,
  ): Promise<UserProfileResponseDto> {
    const profile = await UserMapper.toProfileDto(user);
    profile.votes = await this.usersService.getUserVideoCount(user.id);
    await this.appendAppeal(profile);
    await this.appendClaims(profile);
    return profile;
  }

  @ApiOperation({ description: 'Update user profile' })
  @ApiGlobalResponse(UserProfileResponseDto)
  @ApiConflictResponse({ description: 'Username already exists' })
  @Put('/me')
  public updateUserProfile(
    @CurrentUser() user: UserEntity,
    @Body(ValidationPipe) userProfileDto: UserProfileRequestDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateUserProfile(user.id, userProfileDto);
  }

  @Post('/me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    if (!file) {
      throw new InvalidImageFileTypeException();
    }
    const fileRemotePath = StorageHelper.getUserFilePath(
      user.id,
      file.filename,
      this.configService,
    );
    const url = await this.fireBaseService.uploadAvatar(
      file.path,
      fileRemotePath,
      +this.configService.get('UPLOAD_AVATAR_IMAGE_SIZE'),
    );
    await this.usersService.updateAvatar(user.id, url);
    return { avatar: url };
  }

  @Post('/me/devices')
  async updateUserDevice(
    @CurrentUser() user: UserEntity,
    @Body('deviceToken') deviceToken: string,
  ): Promise<any> {
    if (!deviceToken) {
      throw new DeviceTokenRequiredException();
    }
    return this.usersService.appendDevice(user.id, deviceToken);
  }

  @ApiOperation({ description: 'Get user xp and energy' })
  @ApiGlobalResponse(UserResponseDto)
  @Get('/me/xp-energy')
  getXpAndEnergy(@CurrentUser() user: UserEntity): Promise<UserResponseDto> {
    return this.usersService.getXpEnergy(user.id);
  }

  @ApiOperation({ description: 'Get user energy' })
  @ApiGlobalResponse(UserResponseDto)
  @Get('/me/energy')
  getEnergy(@CurrentUser() user: UserEntity): Promise<UserEnergyDto> {
    return this.usersService.getEnergy(user.id);
  }

  @Post('/me/claim')
  async claim(
    @CurrentUser() user: UserEntity,
    @Body('contestId') contestId: string,
  ) {
    await this.contestsService.claim(user.id, +contestId);
  }

  @ApiOperation({ description: 'Get user profile' })
  @ApiGlobalResponse(UserProfileResponseDto)
  @Get('/:id')
  public async getUserProfile(
    @CurrentUser() user: UserEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserProfileResponseDto> {
    const profile = await this.usersService.getUserProfile(id, user.id);
    profile.votes = await this.usersService.getUserVideoCount(id);
    await this.appendAppeal(profile);
    return profile;
  }

  private async appendAppeal(profile: UserProfileResponseDto): Promise<void> {
    const totalViews = await this.muxService.getCountViewsByUser(profile.id);
    const totalVotes = await this.usersService.getUserVideoCount(profile.id);
    if (totalViews === 0) {
      profile.appeal = totalVotes > 0 ? 100 : 0;
    } else {
      profile.appeal = Math.round((totalVotes / totalViews) * 1000) / 10;
    }
    profile.votesAndViews = `${totalVotes}/${totalViews}`;
  }

  private async appendClaims(profile: UserProfileResponseDto): Promise<void> {
    profile.claims = await this.contestsService.getClaims(profile.id);
  }

  @ApiOperation({ description: 'Get user videos' })
  @ApiGlobalResponse(UserProfileResponseDto)
  @Get('/:id/video-contests')
  public async getUploadedVideos(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserContentResponseDto[]> {
    const result = await this.contentsService.getContentsByUser(id);
    result.forEach((content) => {
      MuxHelper.appendSignedToken(content, this.configService);
    });
    return result;
  }

  @ApiOperation({ description: 'Get user voted videos' })
  @ApiGlobalResponse(UserProfileResponseDto)
  @Get('/:id/voted-videos')
  public async getVotedVideos(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserContentResponseDto[]> {
    const result = await this.usersService.getUserVotedContents(id);
    result.forEach((content) => {
      MuxHelper.appendSignedToken(content, this.configService);
    });
    return result;
  }

  @ApiOperation({ description: 'Delete user content' })
  @ApiGlobalResponse(UserProfileResponseDto)
  @Delete('/me/video-contests/:cId')
  public deleteUploadedVideo(
    @CurrentUser() user: UserEntity,
    @Param('cId') cId: number,
  ): Promise<number> {
    return this.contentsService.deleteContent(cId, user.id);
  }

  @ApiOperation({ description: 'follow an user' })
  @Post('/:id/follow')
  public follow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<void> {
    return this.usersService.follow(user.id, id);
  }

  @ApiOperation({ description: 'unfollow an user' })
  @Post('/:id/unfollow')
  public unfollow(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<void> {
    return this.usersService.unfollow(user.id, id);
  }

  // @ApiOperation({ description: 'get user rank' })
  // @Get('/rank')
  // public userRank(@CurrentUser() user: UserEntity): Promise<any> {
  //   return this.usersService.getUserRank(user.id);
  // }

  // @ApiOperation({ description: 'Get user by id' })
  // @ApiGlobalResponse(UserResponseDto)
  // @Permissions(
  //   'admin.access.users.read',
  //   'admin.access.users.create',
  //   'admin.access.users.update',
  // )
  // @Get('/:id')
  // public getUserById(
  //   @Param('id', ParseUUIDPipe) id: string,
  // ): Promise<UserResponseDto> {
  //   return this.usersService.getUserById(id);
  // }

  // @ApiOperation({ description: 'Create new user' })
  // @ApiGlobalResponse(UserResponseDto)
  // @ApiConflictResponse({ description: 'User already exists' })
  // @ApiGlobalResponse(UserResponseDto)
  // @Permissions('admin.access.users.create')
  // @Post()
  // public createUser(
  //   @Body(ValidationPipe) UserDto: CreateUserRequestDto,
  // ): Promise<UserResponseDto> {
  //   return this.usersService.createUser(UserDto);
  // }
  //
  // @ApiOperation({ description: 'Update user by id' })
  // @ApiGlobalResponse(UserResponseDto)
  // @ApiConflictResponse({ description: 'User already exists' })
  // @Permissions('admin.access.users.update')
  // @Put('/:id')
  // public updateUser(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body(ValidationPipe) UserDto: UpdateUserRequestDto,
  // ): Promise<UserResponseDto> {
  //   return this.usersService.updateUser(id, UserDto);
  // }

  // @ApiOperation({ description: 'Change user password' })
  // @ApiGlobalResponse(UserResponseDto)
  // @Post('/change/password')
  // changePassword(
  //   @Body(ValidationPipe) changePassword: ChangePasswordRequestDto,
  //   @CurrentUser() user: UserEntity,
  // ): Promise<UserResponseDto> {
  //   return this.usersService.changePassword(changePassword, user.id);
  // }
}
