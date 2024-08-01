import * as fs from 'fs';
import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ContentsService } from './contents.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, PermissionsGuard, TOKEN_NAME } from '@auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserEntity } from '@admin/access/users/user.entity';
import { ConfigService } from '@nestjs/config';
import { FireBaseService } from '@modules/integration/fire-base/fire-base.service';
import { InvalidVideoFileTypeException } from '@common/exeptions/invalid-video-file-type.exception';
import { CreateContentDto } from '@modules/contents/dto/create-content.dto';
import { UploadExternalRequestDto } from '@modules/contents/dto/upload-external-request.dto';
import { InvalidUploadExternalResourceException } from '@common/exeptions/invalid-upload-external-resource.exception';
import { UploadHelper } from '@helpers';
import { CannotDownloadExternalException } from '@common/exeptions/cannot-download-external.exception';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { ContestsService } from '@modules/contests/contests.service';
import { ContentSingleUploadException } from '@common/exeptions/content-single-upload.exception';
import { BattlesService } from '@modules/battles/battles.service';
import { UserContentResponseDto } from '@admin/access/users/dtos/user-contents-response.dto';
import { MuxService } from '@modules/integration/mux/mux.service';
import { MuxHelper } from '@helpers';
import { ContentLengthLimitException } from '@common/exeptions/content-length-limit.exception';
import { ContestStates } from '@common/enums/contest-state.enum';
import { ContentUploadErrorException } from '@common/exeptions/content-upload-error.exception';
import { UnlimitedContestUploadStateException } from '@common/exeptions/unlimited-contest-upload-state.exception';
import { ContestInVotingException } from '@common/exeptions/contest-in-voting.exception';

@ApiTags('Contents')
@ApiBearerAuth(TOKEN_NAME)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('contents')
export class ContentsController {
  constructor(
    private readonly contentsService: ContentsService,
    private readonly contestsService: ContestsService,
    private readonly battlesService: BattlesService,
    private readonly configService: ConfigService,
    private readonly fireBaseService: FireBaseService,
    private readonly muxService: MuxService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
    @Body('contestId') contestId: string,
  ): Promise<UserContentResponseDto> {
    if (!file) {
      throw new InvalidVideoFileTypeException();
    }
    // if (!contestId) {
    //   throw new ContestIdRequiredException();
    // }

    if (!fs.existsSync(file.path)) {
      throw new ContentUploadErrorException();
    }

    if (
      contestId &&
      user.username !== 'admin' &&
      !(await this.contestsService.canUploadMore(user.id, +contestId))
    ) {
      throw new ContentSingleUploadException();
    }

    let contest = null;
    if (contestId) {
      contest = await this.contestsService.getById(+contestId);
      if (contest.state != ContestStates.VOTING) {
        throw new ContestInVotingException();
      }
      await UploadHelper.validateVideoLength(file.path, contest.videoMaxLength);
    } else {
      const maxLength = +this.configService.get('UPLOAD_VIDEO_LENGTH_LIMIT');
      await UploadHelper.validateVideoLength(file.path, maxLength);
    }

    const forTest = this.configService.get('MUX_FOR_TEST') == 'true';
    let playbackId;
    try {
      playbackId = await this.muxService.upload(file.path, forTest);
    } catch (ex) {
      throw new ContentUploadErrorException();
    }

    const { video, thumbnail } = MuxHelper.getUrlsFromPlaybackId(playbackId);

    const createContentDto = new CreateContentDto();
    createContentDto.fileOriginalName = playbackId as string;
    createContentDto.fileName = file.filename;
    createContentDto.fileUrl = video;
    createContentDto.thumbnailUrl = thumbnail;
    createContentDto.userId = user.id;
    const content = await this.contentsService.create(createContentDto);

    // let content;
    // if (contest) {
    //   createContentDto.contestId = +contestId;
    //   content = await this.contentsService.create(createContentDto);
    //   // await this.battlesService.appendBattles(contest, content);
    // } else {
    //
    // }

    MuxHelper.appendSignedToken(content, this.configService);
    return content;
  }

  @Post('upload/ext')
  async uploadFromTiktok(
    @CurrentUser() user: UserEntity,
    @Body(ValidationPipe) bodyDto: UploadExternalRequestDto,
  ): Promise<UserContentResponseDto> {
    if (bodyDto.type !== 'tiktok' && bodyDto.type !== 'instagram') {
      throw new InvalidUploadExternalResourceException();
    }

    if (
      bodyDto.contestId &&
      user.username !== 'admin' &&
      !(await this.contestsService.canUploadMore(user.id, bodyDto.contestId))
    ) {
      throw new ContentSingleUploadException();
    }

    let playbackId;
    const maxVideoLength = +this.configService.get('UPLOAD_VIDEO_LENGTH_LIMIT');
    const forTest = this.configService.get('MUX_FOR_TEST') == 'true';

    if (bodyDto.type === 'tiktok') {
      const result = await UploadHelper.downloadVideoFromTiktok(
        bodyDto.url,
        this.configService.get('UPLOAD_TEMP_FOLDER'),
      );

      if (!result) {
        throw new CannotDownloadExternalException(bodyDto.type);
      }

      const { duration, videoPath } = result;
      if (duration) {
        if (duration > maxVideoLength) {
          throw new ContentLengthLimitException(maxVideoLength);
        }
      } else {
        const maxLength = +this.configService.get('UPLOAD_VIDEO_LENGTH_LIMIT');
        await UploadHelper.validateVideoLength(videoPath, maxLength);
      }

      playbackId = await this.muxService.upload(videoPath, forTest);
    } else {
      playbackId = await UploadHelper.downloadVideoFromInstagram(
        bodyDto.url,
        this.configService,
      );
    }

    if (!playbackId) {
      throw new CannotDownloadExternalException(bodyDto.type);
    }

    const { video, thumbnail } = MuxHelper.getUrlsFromPlaybackId(playbackId);

    const createContentDto = new CreateContentDto();
    createContentDto.fileOriginalName = playbackId;
    createContentDto.fileName = `${bodyDto.type}-${playbackId}.m3u8`;
    createContentDto.fileUrl = video;
    createContentDto.thumbnailUrl = thumbnail;
    createContentDto.userId = user.id;

    let content;
    if (bodyDto.contestId) {
      createContentDto.contestId = bodyDto.contestId;
      // const contest = await this.contestsService.getById(bodyDto.contestId);
      content = await this.contentsService.create(createContentDto);
      // await this.battlesService.appendBattles(contest, content);
    } else {
      content = await this.contentsService.create(createContentDto);
    }

    MuxHelper.appendSignedToken(content, this.configService);
    return content;
  }

  @Post(':id/refresh-token')
  async refreshToken(@Param('id') id: string) {
    const content = await this.contentsService.getContent(+id);
    MuxHelper.appendSignedToken(content, this.configService);
    return content;
  }
}
