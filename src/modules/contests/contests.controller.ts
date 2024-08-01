import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';

import { ContestsService } from './contests.service';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '@admin/access/users/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadContentDto } from '@modules/contents/dto/upload-content.dto';
import { StorageHelper } from '../../helpers/storage.helper';
import { InvalidVideoFileTypeException } from '@common/exeptions/invalid-video-file-type.exception';
import { ConfigService } from '@nestjs/config';
import { UpdateContestDto } from '@modules/contests/dto/update-contest.dto';
import { ContentsService } from '@modules/contents/contents.service';
import { ApiPaginatedResponse, PaginationParams } from '@common/decorators';
import { PaginationRequest } from '@common/interfaces';
import { PaginationResponseDto } from '@common/dtos';
import { ContestResponseDto } from '@modules/contests/dto/contest-response.dto';
import { UpdatePromotedContestsDto } from '@modules/contests/dto/update-promoted-contests.dto';
import { BattlesService } from '@modules/battles/battles.service';
import { AddContestContentDto } from '@modules/contests/dto/add-contest-content.dto';
import { ContentSingleUploadException } from '@common/exeptions/content-single-upload.exception';
import { ContestTimeInvalidException } from '@common/exeptions/contest-time-invalid.exception';
import { FFmpegHelper, MuxHelper } from '@helpers';
import { ContestMinParticipantsException } from '@common/exeptions/contest-min-participants.exception';
import { CreateContestV2Dto } from '@modules/contests/dto/create-contest-v2.dto';
import { ContestMapper } from '@modules/contests/contests.mapper';
import { InvalidImageFileTypeException } from '@common/exeptions/invalid-image-file-type.exception';
import { CreateContestV3Dto } from '@modules/contests/dto/create-contest-v3.dto';
import { UpdateContestV3Dto } from '@modules/contests/dto/update-contest-v3.dto';
import { ContestVoteDto } from '@modules/contests/dto/contest-vote.dto';
import { UsersService } from '@admin/access/users/users.service';

@ApiTags('Contests')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contests')
export class ContestsController {
  constructor(
    private readonly contestsService: ContestsService,
    private readonly contentsService: ContentsService,
    private readonly configService: ConfigService,
    private readonly fireBaseService: FireBaseService,
    private readonly battlesService: BattlesService,
    private readonly usersService: UsersService,
  ) {}

  // @Post()
  // async create(
  //   @CurrentUser() user: UserEntity,
  //   @Body(ValidationPipe) createContestDto: CreateContestDto,
  // ) {
  //   createContestDto.owner = user.id;
  //   const { startTime, endTime, submissionDeadline, expireTime } =
  //     createContestDto;
  //
  //   const minParticipants = +this.configService.get('CONTEST_MIN_PARTICIPANTS');
  //   if (createContestDto.minParticipants < minParticipants) {
  //     throw new ContestMinParticipantsException(minParticipants);
  //   }
  //
  //   this.validateContestTime(
  //     startTime,
  //     submissionDeadline,
  //     endTime,
  //     expireTime,
  //   );
  //   return await this.contestsService.create(createContestDto);
  // }

  @Post('/generate')
  async createV2(
    @CurrentUser() user: UserEntity,
    @Body(ValidationPipe) createContestDto: CreateContestV2Dto,
  ) {
    createContestDto.owner = user.id;

    const minParticipants = +this.configService.get('CONTEST_MIN_PARTICIPANTS');
    if (
      !createContestDto.contents ||
      createContestDto.contents.length < minParticipants
    ) {
      throw new ContestMinParticipantsException(minParticipants);
    }

    const contest = await this.contestsService.createNew(createContestDto, 2);
    await this.battlesService.createBattles(contest);
    return ContestMapper.toDto(contest);
  }

  @Post()
  async createV3(
    @CurrentUser() user: UserEntity,
    @Body(ValidationPipe) createContestDto: CreateContestV3Dto,
  ) {
    createContestDto.owner = user.id;

    const minParticipants = +this.configService.get('CONTEST_MIN_PARTICIPANTS');
    if (createContestDto.minParticipants < minParticipants) {
      throw new ContestMinParticipantsException(minParticipants);
    }

    const current = new Date().getTime();
    if (current >= createContestDto.startTime) {
      throw new ContestTimeInvalidException();
    }

    const contest = await this.contestsService.createNew(createContestDto, 3);
    return ContestMapper.toDto(contest);
  }

  @Post('/user-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUserAvatar(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    if (!file || !file.mimetype.startsWith('image')) {
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
    return { url };
  }

  @Post('cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadContentDto> {
    if (!file || !file.mimetype.startsWith('image')) {
      throw new InvalidVideoFileTypeException();
    }
    const fileRemotePath = StorageHelper.getAssetPath(
      user.id,
      file.filename,
      this.configService,
    );
    const url = await this.fireBaseService.upload(file.path, fileRemotePath);

    return { url };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    if (!file || !file.mimetype.startsWith('video')) {
      throw new InvalidVideoFileTypeException();
    }
    const thumbnailPath = await FFmpegHelper.captureScreenshot(file.path);

    const { media, thumbnail } = StorageHelper.getMediaPath(
      user.id,
      file.filename,
      this.configService,
    );
    const url = await this.fireBaseService.upload(file.path, media);
    const thumbnailUrl = await this.fireBaseService.upload(
      thumbnailPath,
      thumbnail,
    );

    return { url, thumbnail: thumbnailUrl };
  }

  @Get()
  @ApiPaginatedResponse(ContestResponseDto)
  discovery(
    @CurrentUser() user: UserEntity,
    @PaginationParams() pagination: PaginationRequest,
  ) {
    return this.contestsService.explore(user.id, pagination);
  }

  @Get('/feeds')
  async getContestsFeeds(@CurrentUser() user: UserEntity) {
    return await this.contestsService.getContestsFeeds();
  }

  @Post('/:id/vote')
  async vote(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: ContestVoteDto,
  ) {
    return await this.contestsService.vote(user.id, +id, dto.contentId);
  }

  @Get('/find')
  searchByName(@Query('name') name: string): Promise<ContestResponseDto[]> {
    return this.contestsService.searchByName(name);
  }

  @Get('/search')
  search(
    @PaginationParams() pagination: PaginationRequest,
  ): Promise<PaginationResponseDto<ContestResponseDto>> {
    return this.contestsService.search(pagination);
  }

  @Get('/promotes')
  getPromotedContests(@CurrentUser() user: UserEntity) {
    return this.contestsService.findPromotedContests(user.id);
  }

  @Post('/promotes')
  updatePromotedContests(@Body() dto: UpdatePromotedContestsDto) {
    return this.contestsService.updatePromotedContests(dto.contests);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    const contest = await this.contestsService.getDetail(user.id, +id);
    if (contest.contents) {
      contest.contents.forEach((content) => {
        MuxHelper.appendSignedToken(content, this.configService);
      });
    }
    return contest;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContestV3Dto) {
    const minParticipants = +this.configService.get('CONTEST_MIN_PARTICIPANTS');
    if (dto.minParticipants < minParticipants) {
      throw new ContestMinParticipantsException(minParticipants);
    }
    return this.contestsService.updateV3(+id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    // const contest = await this.contestsService.getById(+id);
    // const contentIds = contest.contents.map((content) => content.id);
    // await this.contentsService.clearContest(contentIds);
    return this.contestsService.remove(+id);
  }

  @Post(':id/users')
  async addUserToContest(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body('username') username: string,
  ) {
    return this.contestsService.addContestUser(+id, username);
  }

  @Get(':id/battles')
  async getContestBattles(@Param('id') id: string) {
    const battles = await this.contestsService.getContestBattles(+id);
    battles.forEach((battle) => {
      MuxHelper.appendSignedToken(battle.contentA, this.configService);
      MuxHelper.appendSignedToken(battle.contentB, this.configService);
    });
    return battles;
  }

  @Post(':id/contents')
  async addContent(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: AddContestContentDto,
  ) {
    if (!(await this.contestsService.canUploadMore(user.id, +id))) {
      throw new ContentSingleUploadException();
    }

    await this.contentsService.verifyContent(user.id, dto.content);
    return await this.contestsService.addContentToSimpleVotingContest(
      +id,
      dto.content,
    );
  }

  @Delete(':id/contents/:contentId')
  async deleteContent(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Param('contentId') contentId: string,
  ) {
    const content = await this.contentsService.getUserContentById(
      user.id,
      +contentId,
    );

    await this.contestsService.removeContent(+id, +contentId);
    await this.battlesService.removeBattles(+id, content);
  }

  @Post('/:id/claim')
  async claim(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    await this.contestsService.claim(user.id, +id);
  }

  @Post('/refresh-winners')
  async makeTopWinner() {
    try {
      const result = await this.contestsService.makeTopWinners();
      await this.contestsService.pushNotificationsContestEnd(result);
    } catch (ex) {
      console.log(ex);
      throw ex;
    }
  }

  private validateContestTime(start, join, end, expire) {
    const current = new Date().getTime();
    if (join) {
      if (current >= start || start >= join || join >= end || end >= expire) {
        throw new ContestTimeInvalidException();
      }
    } else {
      if (current >= start || start >= end || end >= expire) {
        throw new ContestTimeInvalidException();
      }
    }
  }

  private validateContestTimeInUpdate(start, join, end, expire) {
    if (join) {
      if (start >= join || join >= end || end >= expire) {
        throw new ContestTimeInvalidException();
      }
    } else {
      if (start >= end || end >= expire) {
        throw new ContestTimeInvalidException();
      }
    }
  }
}
