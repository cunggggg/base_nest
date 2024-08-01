import * as FFmpeg from 'fluent-ffmpeg';
import * as path from 'path';

export class FFmpegHelper {
  /**
   * Get first video frame as image
   * @param filePath
   */
  public static captureScreenshot(filePath): Promise<string> {
    return new Promise((resolve, reject) => {
      const pathObj = path.parse(filePath);
      const folder = pathObj.dir;
      const filename = `${pathObj.name}.png`;
      const fileOutput = `${folder}/${filename}`;

      new FFmpeg(filePath)
        .on('end', () => {
          resolve(fileOutput);
        })
        .on('error', (e) => {
          console.log(e);
          reject(null);
        })
        .screenshots({
          timestamps: ['00:00'],
          filename: filename,
          folder: folder,
        });
    });
  }

  /**
   * Get first video frame as image
   * @param filePath
   */
  public static getVideoLength(filePath): Promise<number> {
    return new Promise((resolve, reject) => {
      new FFmpeg(filePath).ffprobe((err, data) => {
        if (err) {
          console.log(err);
          reject(null);
        } else {
          resolve(data.format.duration);
        }
      });
    });
  }
}
