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

  it("create new posts", async () => {
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

    // 创建文章;
    response = await request(app.callback())
      .post("/api/posts")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        title: "Hello world",
        content: "my first posts.",
      });
    expect(response.statusCode).toEqual(200);
    let post = response.body.data;

    // anonymous 用户 读取文章
    response = await request(app.callback()).get(`/api/posts/${post.id}`);
    expect(response.statusCode).toEqual(204);
  });
});
