import { Inject, Injectable } from '@nestjs/common';
import {
  FIREBASE_ADMIN_INJECT,
  FirebaseAdminSDK,
} from '@tfarras/nestjs-firebase-admin';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import * as path from 'path';
import * as uuid from 'uuid';
import { UsersService } from '@admin/access/users/users.service';

@Injectable()
export class FireBaseService {
  private readonly db: any;
  private readonly storage;
  private readonly messaging;

  constructor(
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
    private usersService: UsersService,
  ) {
    this.db = firebaseAdmin.database();
    this.storage = firebaseAdmin.storage().bucket();
    this.messaging = firebaseAdmin.messaging();
  }

  async upload(fileLocalPath, fileRemotePath) {
    return await this.storage
      .upload(fileLocalPath, {
        destination: fileRemotePath,
        public: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      })
      .then((data) => data[0].publicUrl())
      .finally(() => {
        fs.unlinkSync(fileLocalPath);
      });
  }

  async uploadNoCache(fileLocalPath, fileRemotePath) {
    return await this.storage
      .upload(fileLocalPath, {
        destination: fileRemotePath,
        public: true,
      })
      .then((data) => data[0].publicUrl())
      .finally(() => {
        fs.unlinkSync(fileLocalPath);
      });
  }

  async uploadAvatar(fileLocalPath, fileRemotePath, size = 64) {
    const pathObj = path.parse(fileLocalPath);
    const newFilePath = `${pathObj.dir}/${uuid.v4()}${pathObj.ext}`;
    (await Jimp.read(fileLocalPath)).resize(size, size).write(newFilePath);

    return await this.storage
      .upload(newFilePath, {
        destination: fileRemotePath,
        public: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      })
      .then((data) => data[0].publicUrl())
      .finally(() => {
        fs.unlinkSync(fileLocalPath);
        fs.unlinkSync(newFilePath);
      });
  }

  createVote(userId, contestId, battleId, contentId, root = 'Votes') {
    const ref = this.db.ref(`${root}/${contestId}/${battleId}/${contentId}`);
    ref.transaction((content) => {
      if (!content) {
        content = {
          votes: [userId],
          voteCount: 1,
        };
      } else {
        if (!content.votes.includes(userId)) {
          content.votes.push(userId);
        }
        content.voteCount = content.votes.length;
      }
      return content;
    });
  }

  syncVote(vote, root = 'Votes') {
    const ref = this.db.ref(`${root}`);
    ref.set(vote);
  }

  async pushNotifications(title, body, tokens): Promise<void> {
    const message = FireBaseService.buildMessage(title, body, tokens);
    const response = await this.messaging.sendMulticast(message);
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }
  }

  private static buildMessage(title, body, tokens) {
    return {
      notification: {
        title: title,
        body: body,
      },
      androidNotificationChannel: '',
      data: {
        link: '',
      },
      tokens: tokens,
    };
  }

  async pushNotificationsContestEnd(usersDict): Promise<void> {
    const messages = this.buildContestEndMessages(usersDict);
    console.log('>>>>>>>Send all messages: ' + messages.length);
    if (messages.length === 0) {
      return;
    }
    const response = await this.messaging.sendAll(messages);
    const failedTokens = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            userId: messages[idx].data.userId,
            token: messages[idx].token,
          });
        }
      });
      console.log(
        'List of tokens that caused failures: ' + JSON.stringify(failedTokens),
      );
      for (let i = 0; i < failedTokens.length; i += 1) {
        const t = failedTokens[i];
        await this.usersService.removeDevice(t.userId, t.token);
      }
    }
  }

  /*
  userDict {
    userA: {
      devices: [],
      contests: [
        contestA: {
          contestId: contestId,
          topWinners: topWinners,
        },
        contestB: {
        }
      ]
    }
  }
   */
  private buildContestEndMessages(usersDict) {
    const userIds = Object.keys(usersDict);
    const messages = [];
    for (let i = 0; i < userIds.length; i += 1) {
      const user = usersDict[userIds[i]];
      user.devices.forEach((token) => {
        messages.push({
          notification: {
            title: 'Republik',
            body: this.buildContestBodyMessage(user.contests),
          },
          data: {
            contests: JSON.stringify(user.contests),
            userId: userIds[i],
          },
          token: token,
        });
      });
    }
    return messages;
  }

  private buildContestBodyMessage(contests) {
    const total = contests.length;
    const names = contests.map((c) => `#${c.contestName}`);
    let message = '';
    if (total === 0) {
      return message;
    } else if (total === 1) {
      message = `The ${names[0]} contest has ended. Check the result!`;
    } else if (total <= 3) {
      message = `The ${names.join(', ')} contests has ended. Check the result!`;
    } else {
      const remainTotal = total - 3;
      message = `The ${names[0]}, ${names[1]}, ${names[2]} and ${remainTotal} more contests has ended. Check the result!`;
    }
    return message;
  }
}
