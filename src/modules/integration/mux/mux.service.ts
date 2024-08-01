import { Injectable } from '@nestjs/common';
import Mux, {
  Assets,
  Uploads,
  Video,
  VideoViews,
  VideoViewsQueryParams,
} from '@mux/mux-node';
import { InjectMux } from 'nestjs-mux';
import * as fs from 'fs';
import * as request from 'request';
import { MuxHelper } from '../../../helpers/mux.helper';
import { CreateUploadParams } from '@mux/mux-node/types/interfaces/CreateUploadParams';

@Injectable()
export class MuxService {
  private readonly video: Video;
  private readonly assets: Assets;
  private readonly uploads: Uploads;
  private readonly videoViews: VideoViews;

  constructor(@InjectMux() private readonly mux: Mux) {
    this.video = mux.Video;
    this.assets = mux.Video.Assets;
    this.uploads = mux.Video.Uploads;
    this.videoViews = mux.Data.VideoViews;
  }

  async getCountViewsByContent(contentId): Promise<number> {
    const params: VideoViewsQueryParams = {
      limit: 1,
      filters: [`video_id:${contentId}`, 'exit_before_video_start:false'],
    };

    const response = await this.videoViews.list(params);
    return response.total_row_count;
  }

  async getCountViewsByUser(contestantId): Promise<number> {
    const params: VideoViewsQueryParams = {
      limit: 1,
      filters: [
        `sub_property_id:${contestantId}`,
        'exit_before_video_start:false',
      ],
    };

    const response = await this.videoViews.list(params);
    return response.total_row_count ? response.total_row_count : 0;
  }

  async upload(filePath, forTest = true, isPublic = false) {
    const data: CreateUploadParams = {
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: [isPublic ? 'public' : 'signed'],
      },
      test: forTest,
    };
    const upload = await this.uploads.create(data);

    return new Promise((resolve, reject) => {
      try {
        fs.createReadStream(filePath)
          .pipe(request.put(upload.url))
          .on('end', async () => {
            try {
              const assetId = await MuxHelper.getUpload(
                this.uploads,
                upload.id,
              );
              const asset = await this.assets.get(assetId);
              resolve(asset.playback_ids[0].id);
            } catch (ex) {
              console.log(ex);
              reject(ex);
            }
          })
          .on('error', (err) => {
            console.log(err);
            reject(err);
          })
          .on('close', function () {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (err) {
              console.log(err);
            }
          });
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }
}
