import { Application } from "@nocobase/server";
import request from "supertest";
import { CollectionOptions } from "@nocobase/database";

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
      ["@nocobase/plugin-ui-schema-storage"],
      ["@nocobase/plugin-collection-manager"],
    ];

    for (const [plugin, options = null] of plugins) {
      app.plugin(require(plugin as string).default, options);
    }

    // app.collection({
    //   name: "posts",
    //   createdBy: true,
    //   fields: [
    //     { type: "string", name: "title" },
    //     { type: "text", name: "content" },
    //     { type: "string", name: "email" },
    //   ],
    // }) as any;

    // let collection = app.db.getCollection("posts");

    // collection.setField("email", {
    //   type: "string",
    //   name: "email",
    //   validate: { isEmail: true },
    // });

    await app.load();
    await app.install({
      sync: {
        force: true,
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it("test", async () => {
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "admin@nocobase.com",
        password: "admin123",
      });
    expect(response.statusCode).toEqual(200);
    let user = response.body.data;
    expect(user.token).toBeDefined();

    response = await request(app.callback())
      .post("/api/collections")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "posts",
        fields: [
          {
            name: "title",
            type: "string",
          },
          {
            name: "email",
            type: "string",
          },
        ],
      });
    expect(response.statusCode).toEqual(200);

    response = await request(app.callback())
      .post(`/api/posts`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        title: "hello",
        email: "a",
      });
    expect(response.statusCode).toEqual(200);

    let collection = app.db.getCollection("posts");

    collection.setField("email", {
      type: "string",
      name: "email",
      validate: { isEmail: true },
    });

    response = await request(app.callback())
      .post(`/api/posts`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        title: "hi~",
        email: "b",
      });
    expect(response.statusCode).toEqual(400);
  });
});
