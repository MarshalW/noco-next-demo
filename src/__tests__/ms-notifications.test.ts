/*
 * @Author: pangff
 * @Date: 2022-05-16 13:45:41
 * @LastEditTime: 2022-05-25 10:03:39
 * @LastEditors: pangff
 * @Description: plugin-notifications 测试
 * @FilePath: /noco-next-demo/src/__tests__/ms-notifications.test.ts
 * stay hungry,stay foolish
 */
import Database from '@nocobase/database';
import { Notification, NotificationService } from '@nocobase/plugin-notifications/lib/models';
import nodemailerMock from 'nodemailer-mock';
// import nodemailer from 'nodemailer';
import { mockServer } from '@nocobase/test';

jest.setTimeout(300000);

describe('notifications', () => {
  let db: Database;

  beforeEach(async () => {
    const app = mockServer({
      registerActions: true,
      database: {
        dialect: "sqlite",
        storage: ":memory:",
        logging: false,
      }
    });
    // 加载插件
    const plugins = [
      ["@nocobase/plugin-notifications"]
    ];

    for (const [plugin, options = null] of plugins) {
      app.plugin(require(plugin as string).default, options);
    }

    await app.loadAndInstall();
    db = app.db;
    await db.sync();
    NotificationService.createTransport = nodemailerMock.createTransport;
  });

  afterEach(() => db.close());

  it('create', async () => {
    const Notification = db.getCollection('notifications');
    const notification = await Notification.repository.create({
      values: {
        subject: 'Subject',
        body: 'hell world',
        receiver_options: {
          data: 'xxx@gmail.com',
          fromTable: 'users',
          filter: {},
          dataField: 'email',
        },
        service: {
          type: 'email',
          title: 'QQ邮件推送',
          options: {
            host: 'smtp.qq.com',
            port: 465,
            secure: true,
            auth: {
              user: 'xxx@qq.com',
              pass: 'xxx',
            },
            from: '"xxx" <xxx@qq.com>',
          },
        },
      },
    }) as Notification;
    await notification.send();
  });
});
