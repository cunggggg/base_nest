import * as fs from 'fs';
import axios from 'axios';
import * as uuid from 'uuid';
import * as path from 'path';
import * as TikTokScraper from 'tiktok-scraper';
import { FFmpegHelper } from './ffmpeg.helper';
import { ContentLengthLimitException } from '@common/exeptions/content-length-limit.exception';
import { ConfigService } from '@nestjs/config';

const INSTAGRAM_REGEX =
  /(?:(?:http|https):\/\/)?(?:www.)?(?:instagram.com|instagr.am|instagr.com)\/\w+\/(\w+)\/.*?/gi;

export class UploadHelper {
  /**
   * Download video from tiktok / instagram
   * @param type
   * @param url
   * @param configService
   */
  public static async downloadVideoFromExt(
    type: 'tiktok' | 'instagram',
    url: string,
    configService: ConfigService,
  ): Promise<any> {
    const dest = configService.get('UPLOAD_TEMP_FOLDER');
    return type === 'tiktok'
      ? UploadHelper.downloadVideoFromTiktok(url, dest)
      : UploadHelper.downloadVideoFromInstagram(url, dest);
  }

  public static async validateVideoLength(filePath, maxVideoLength) {
    const videoDuration = await FFmpegHelper.getVideoLength(filePath);
    if (videoDuration > maxVideoLength) {
      throw new ContentLengthLimitException(maxVideoLength);
    }
  }

  /**
   * Download tiktok video
   * @param url
   * @param dest
   */
  public static async downloadVideoFromTiktok(
    url: string,
    dest: string,
  ): Promise<any> {
    try {
      const metaData = await TikTokScraper.getVideoMeta(url);
      if (metaData.collector.length === 0) {
        console.error('Metadata Collector Empty');
        return null;
      }
      const headers = metaData.headers;
      const { videoUrl, videoMeta } = metaData.collector[0];
      // const imagePath = await UploadHelper.downloadFile(imageUrl, dest, 'png');
      const videoPath = await UploadHelper.downloadFile(
        videoUrl,
        dest,
        'mp4',
        headers,
      );

      return { duration: videoMeta?.duration, videoPath };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * Download tiktok instagram
   * @param url
   * @param config
   */
  public static async downloadVideoFromInstagram(
    url: string,
    config: ConfigService,
  ): Promise<any> {
    const match = INSTAGRAM_REGEX.exec(url);
    if (!match) {
      return null;
    }
    const postCode = match[1];
    const maxVideoLength = +config.get('UPLOAD_VIDEO_LENGTH_LIMIT');
    const test = config.get('MUX_FOR_TEST') == 'true' ? 1 : 0;
    const api = config.get('INSTAGRAM_CRAWLER_API');
    const params = {
      post_code: postCode,
      test: test,
      video_limit: maxVideoLength,
    };
    console.log('call crawler api: ' + api);
    console.log(params);

    try {
      const response = await axios({
        method: 'GET',
        url: api,
        params,
      });

      return response.data.data;
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.code === 'B001005'
      ) {
        throw new ContentLengthLimitException(maxVideoLength);
      }

      console.log(error);
      return null;
    }
  }

  private static async downloadFile(
    url,
    folder,
    ext: 'mp4' | 'png',
    headers?: any,
  ): Promise<string> {
    const localFilePath = path.join(folder, `${uuid.v4()}.${ext}`);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: headers ? headers : {},
    });

    const w = response.data.pipe(fs.createWriteStream(localFilePath));

    return new Promise((resolve, reject) => {
      w.on('finish', () => {
        console.log('Successfully downloaded file!');
        resolve(localFilePath);
      }).on('error', (error) => {
        console.log(error);
        reject(error);
      });
    });
  }

  private static async extractInstagramData(url: string) {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/604.3.5 (KHTML, like Gecko) Version/11.0.1 Safari/604.3.5';

    const userInfoSource = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
      },
    });
    const match = userInfoSource.data.match(
      /<script type="text\/javascript">window\._sharedData = (.*)<\/script>/,
    );

    if (match) {
      const data = JSON.parse(match[1].slice(0, -1));
      console.log(data.entry_data);
      if (data.entry_data && data.entry_data.PostPage.length > 0) {
        const graphql = data.entry_data.PostPage[0].graphql;
        if (graphql.shortcode_media.is_video) {
          const video = graphql.shortcode_media.video_url;
          const thumbnail = graphql.shortcode_media.thumbnail_src;

          return { video, thumbnail };
        }
      }
    }

    return null;
  }
}
