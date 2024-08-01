import { Uploads, JWT } from '@mux/mux-node';
import { delay } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

const STREAM_ROOT = 'https://stream.mux.com';
const IMAGE_ROOT = 'https://image.mux.com';

export class MuxHelper {
  /**
   * Get get mux urls from playback id
   * @param playbackId
   */
  public static getUrlsFromPlaybackId(playbackId) {
    return {
      video: `${STREAM_ROOT}/${playbackId}.m3u8`,
      thumbnail: `${IMAGE_ROOT}/${playbackId}/thumbnail.jpg`,
    };
  }

  /**
   * get upload with retry
   * @param uploads
   * @param id
   * @param retry
   */
  public static async getUpload(uploads: Uploads, id, retry = 5) {
    let count = 0;
    let found = false;
    let uploaded;

    while (!found && count < retry) {
      uploaded = await uploads.get(id);
      if (uploaded.status === 'asset_created') {
        found = true;
        count += 1;
      } else {
        count += 1;
        await delay(1000);
      }
    }

    console.log('retry: ' + count);
    return found ? uploaded.asset_id : null;
  }

  public static delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static appendSignedToken(content, config: ConfigService) {
    if (!content.fileOriginalName) {
      return;
    }

    const signedKey = MuxHelper.generateSignedToken(
      content.fileOriginalName,
      config,
    );

    content.url = `${content.url}?token=${signedKey.video}`;
    content.thumbnailUrl = `${content.thumbnailUrl}?token=${signedKey.thumbnail}`;
  }

  public static generateSignedToken(playbackId, config: ConfigService) {
    const baseOptions = {
      keyId: config.get('MUX_SIGNED_KEY_ID'),
      keySecret: config.get('MUX_SIGNED_KEY_SECRET'),
      expiration: config.get('MUX_SIGNED_KEY_EXPIRATION'),
    };

    return {
      video: MuxHelper.newSignedToken(playbackId, baseOptions, 'video'),
      thumbnail: MuxHelper.newSignedToken(playbackId, baseOptions, 'thumbnail'),
    };
  }

  private static newSignedToken(
    playbackId,
    options,
    type: 'video' | 'thumbnail',
  ) {
    return JWT.sign(playbackId, { ...options, type: type });
  }
}
