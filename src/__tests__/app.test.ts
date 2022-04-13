import { Application } from "@nocobase/server";
import request from "supertest";

class MockServer extends Application {}

describe("app test", () => {
  let app: Application;

  let User;
  let Role;


  beforeEach(async () => {
    app = new Application({
      registerActions: true,
      database: {
        dialect: "sqlite",
        storage: ":memory:",
        // storage: "/tmp/tmp.sqlite",
        logging: false,
      },
      resourcer: {
        prefix: `/api`,
      },
    });

    // 加载插件
    const plugins = [
      ["@nocobase/plugin-acl"],
      ["@nocobase/plugin-error-handler"],
      [
        "@nocobase/plugin-users",
        {
          jwt: {
            secret: "randomstring",
          },
        },
      ],
      ["../blog"],
    ];

    for (const [plugin, options = null] of plugins) {
      app.plugin(require(plugin as string).default, options);
    }

    await app.load();
    await app.install({
      sync: {
        force: true,
      },
    });

    let pluginACL = app.getPlugin("@nocobase/plugin-acl") as any;
    await pluginACL.writeRolesToACL();

    Role = app.db.getCollection("roles");
    let role = await Role.repository.findOne({
      filter: {
        name: "writer",
      },
    });

    User = app.db.getCollection("users");

    // 创建用户 zhangsan
    await User.repository.create({
      values: {
        email: "zhangsan@a.com",
        password: "password",
        nickname: "zhangsan",
        roles: [role],
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it("writer user login", async () => {
    // zhangsan 登录
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "zhangsan@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let user = response.body.data;
    expect(user.token).toBeDefined();
  });
});
