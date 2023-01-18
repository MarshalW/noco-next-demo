import { Application } from "@nocobase/server";
import request from "supertest";

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

    // 实现聚合的补丁
    app.use(async (ctx, next) => {
      await next();

      const setTotal = async function (dataValues) {
        let results = await app.db.getCollection("products").model.findAll({
          attributes: [
            "seriesId",
            [
              app.db.sequelize.fn("sum", app.db.sequelize.col("amount")),
              "total",
            ],
          ],
          where: {
            seriesId: dataValues.id,
          },
          group: ["seriesId"],
          raw: true,
        });

        // @ts-ignore
        let totalStr = results[0].total;
        let total: number = +totalStr;

        dataValues.total = total;
      };

      if (
        ctx.request.url.startsWith("/api/series") &&
        ctx.request.method == "GET"
      ) {
        if (ctx.response.body.dataValues != null) {
          let { dataValues } = ctx.response.body;
          await setTotal(dataValues);
        }
        if (ctx.response.body.rows != null) {
          let { rows } = ctx.response.body;
          for (let row of rows) {
            let { dataValues } = row;
            await setTotal(dataValues);
          }
        }
      }
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it("test", async () => {
    // 登录
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "admin@nocobase.com",
        password: "admin123",
      });
    expect(response.statusCode).toEqual(200);
    let user = response.body.data;
    expect(user.token).toBeDefined();

    // 创建 collection: series 和 products
    app.collection({
      name: "series",
      fields: [
        { type: "string", name: "name" },
        { type: "integer", name: "total" },
        { type: "hasMany", name: "products" },
      ],
    }) as any;
    await app.db.sync();

    app.collection({
      name: "products",
      fields: [
        { type: "string", name: "name" },
        { type: "integer", name: "amount" },
        { type: "belongsTo", name: "series" },
      ],
    }) as any;
    await app.db.sync();

    // 创建 series 记录
    response = await request(app.callback())
      .post("/api/series")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "长城",
        total: 0,
      });
    expect(response.statusCode).toEqual(200);
    let serie = response.body.data;

    // 创建 products 记录
    response = await request(app.callback())
      .post("/api/products")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "八达岭",
        amount: 10,
        series: serie,
      });
    expect(response.statusCode).toEqual(200);

    // 获取 series，包含聚合数据
    response = await request(app.callback())
      .get(`/api/series/${serie.id}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(response.statusCode).toEqual(200);
    serie = response.body.data;
    expect(serie.total).toEqual(10);

    // 创建另一个 products 记录
    response = await request(app.callback())
      .post("/api/products")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        name: "慕田峪长城",
        amount: 5,
        series: serie,
      });
    expect(response.statusCode).toEqual(200);

    // 获取 series，包含聚合数据
    response = await request(app.callback())
      .get(`/api/series`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(response.statusCode).toEqual(200);
    let rows = response.body.data;
    expect(rows[0].total).toEqual(15);
  });
});
