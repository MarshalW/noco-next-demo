import { Application } from "@nocobase/server";
import request from "supertest";
import { updateValidators } from "server-validator-nocobase";

class MockServer extends Application {}

describe("app test", () => {
  let app: Application;

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

    const validators = [{
      collectionName: 'posts',
      fieldValidators:[{
        type: "string",
        name: "email",
        validate: { isEmail: true },
      }]
    }];


    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "admin@nocobase.com",
        password: "admin123",
      });
    expect(response.statusCode).toEqual(200);
    let user = response.body.data;
    expect(user.token).toBeDefined();


    let updateValidatorsResults = updateValidators(app,validators)
    expect(updateValidatorsResults.length).toEqual(1);
    expect(updateValidatorsResults[0]).toEqual('collection posts no exists');

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


    updateValidatorsResults = updateValidators(app,validators)
    expect(updateValidatorsResults.length).toEqual(0);


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
