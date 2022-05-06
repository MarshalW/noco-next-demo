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
        // storage: ":memory:",
        storage: "/Users/pangff/Downloads/tmp.sqlite",
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
    // writer role strategy
    let writerRole =  await Role.repository.findOne({
        filter: {
            name: "writer",
        },
    });

    // admin role strategy
    let adminRole = await Role.repository.findOne({
      filter: {
          name: "admin",
      },
    });

    // audit role strategy
    let auditRole = await Role.repository.findOne({
      filter: {
          name: "audit",
      },
    });

    
    let anonymousRole= await Role.repository.findOne({
      filter: {
          name: "anonymous",
      },
    });

    

    User = app.db.getCollection("users");

    // 创建用户 writer
    await User.repository.create({
      values: {
        email: "writer@a.com",
        password: "password",
        nickname: "writer",
        roles: [writerRole],
      },
    });

    // 创建用户 writer2
    await User.repository.create({
      values: {
        email: "writer2@a.com",
        password: "password",
        nickname: "writer2",
        roles: [writerRole],
      },
    });

    // 创建用户 admin
    await User.repository.create({
      values: {
        email: "admin@a.com",
        password: "password",
        nickname: "admin",
        roles: [adminRole],
      },
    });

     // 创建用户 audit
     await User.repository.create({
      values: {
        email: "audit@a.com",
        password: "password",
        nickname: "audit",
        roles: [auditRole],
      },
    });

    // 创建用户 anonymous
    await User.repository.create({
      values: {
        email: "anonymous@a.com",
        password: "password",
        nickname: "anonymous",
        roles: [anonymousRole],
      },
    });

  });

  afterEach(async () => {
    await app.destroy();
  });

  it("writer only update and delete own post", async () => {

      // writer 登录
      let response = await request(app.callback())
        .post("/api/users:signin")
        .send({
          email: "writer@a.com",
          password: "password",
        });
      expect(response.statusCode).toEqual(200);
      let writer1 = response.body.data;
      expect(writer1.token).toBeDefined();

      // writer1 创建文章;
      response = await request(app.callback())
        .post("/api/posts")
        .set("Authorization", `Bearer ${writer1.token}`)
        .send({
          title: "Hello world",
          published: true,
          hidden: false,
          content: "my first posts.",
        });
      expect(response.statusCode).toEqual(200);
      let post = response.body.data;

      // writer2 登录
      response = await request(app.callback())
        .post("/api/users:signin")
        .send({
          email: "writer2@a.com",
          password: "password",
        });
      expect(response.statusCode).toEqual(200);
      let writer2 = response.body.data;
 
      // writer2 修改 writer1的文章 不生效
      response = await request(app.callback())
        .put(`/api/posts/${post.id}`)
        .set("Authorization", `Bearer ${writer2.token}`)
        .send({
          title: "Hi~",
          content: "my first posts with update.",
        });
      expect(response.statusCode).toEqual(200);
      expect(response.body.data.length).toEqual(0);

      // writer2 删除 writer1的文章 不生效
      response = await request(app.callback())
        .delete(`/api/posts/${post.id}`)
        .set("Authorization", `Bearer ${writer2.token}`)
        .send();
      expect(response.statusCode).toEqual(200);

      // writer2 查看 writer1的文章 因为是published并且未hidden 可以看到，并且确认前面的删除未生效
      response = await request(app.callback())
        .get(`/api/posts/${post.id}`)
        .set("Authorization", `Bearer ${writer2.token}`)
        .send();
      expect(response.statusCode).toEqual(200);
      expect(response.body.data.title).toEqual('Hello world');
      
      // writer1 修改自己的文章生效
      response = await request(app.callback())
        .put(`/api/posts/${post.id}`)
        .set("Authorization", `Bearer ${writer1.token}`)
        .send({
          title: "Hi~",
          content: "my first posts with update.",
        });
      expect(response.statusCode).toEqual(200);
      expect(response.body.data[0].title).toEqual("Hi~");
      expect(response.body.data[0].content).toEqual("my first posts with update.");

       // writer1 删除自己的文章 生效
      response = await request(app.callback())
       .delete(`/api/posts/${post.id}`)
       .set("Authorization", `Bearer ${writer1.token}`)
       .send();
      expect(response.statusCode).toEqual(200);

      response = await request(app.callback())
        .get(`/api/posts/${post.id}`)
        .set("Authorization", `Bearer ${writer1.token}`)
        .send();
      expect(response.statusCode).toEqual(204);
  });


  it("admin can update and delete all posts", async () => {

    // writer 登录
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "writer@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let writer1 = response.body.data;
    expect(writer1.token).toBeDefined();

    // writer1 创建文章;
    response = await request(app.callback())
      .post("/api/posts")
      .set("Authorization", `Bearer ${writer1.token}`)
      .send({
        title: "Hello world",
        published: true,
        hidden: false,
        content: "my first posts.",
      });
    expect(response.statusCode).toEqual(200);
    let post = response.body.data;

    // admin 登录
    response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "admin@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let admin = response.body.data;

    // admin 修改 writer1的文章 生效
    response = await request(app.callback())
      .put(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        title: "Hi~",
        content: "my first posts with update.",
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0].title).toEqual("Hi~");

    // admin 删除 writer1的文章 生效
    response = await request(app.callback())
      .delete(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send();
    expect(response.statusCode).toEqual(200);

    response = await request(app.callback())
      .get(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${writer1.token}`)
      .send();
    expect(response.statusCode).toEqual(204);

  });


  it("hidden post can view by no one. audit can change post hidden status", async () => {

    // writer 登录
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "writer@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let writer1 = response.body.data;
    expect(writer1.token).toBeDefined();

    // writer1 创建文章 hidden true;
    response = await request(app.callback())
      .post("/api/posts")
      .set("Authorization", `Bearer ${writer1.token}`)
      .send({
        title: "Hello world",
        published: true,
        hidden: true,
        content: "my first posts.",
      });
    expect(response.statusCode).toEqual(200);
    let post = response.body.data;

    // writer2 登录
    response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "writer2@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let writer2 = response.body.data;

    // writer2访问 writer1的文章访问不到
    response = await request(app.callback())
      .get(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${writer2.token}`)
      .send();
    expect(response.statusCode).toEqual(204);

     // writer1访问自己的文章 也访问不到，因为hidden的话都不能访问
     response = await request(app.callback())
     .get(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${writer1.token}`)
     .send();
    expect(response.statusCode).toEqual(204);

     // admin 登录
     response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "admin@a.com",
        password: "password",
      });
     expect(response.statusCode).toEqual(200);
     let admin = response.body.data;
     expect(admin.token).toBeDefined();

    // admin访问 writer1的文章 可以访问。未admin限制
    response = await request(app.callback())
     .get(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${admin.token}`)
     .send();
    expect(response.statusCode).toEqual(200);
    expect(response.body.data.title).toEqual('Hello world');

     // anonymous 登录
     response = await request(app.callback())
     .post("/api/users:signin")
     .send({
       email: "anonymous@a.com",
       password: "password",
     });
    expect(response.statusCode).toEqual(200);
    let anonymous = response.body.data;

    // anonymous writer1的隐藏文章是看不到的
    response = await request(app.callback())
    .get(`/api/posts/${post.id}`)
    .set("Authorization", `Bearer ${anonymous.token}`)
    .send();
    expect(response.statusCode).toEqual(204);

     // audit 用户登录
     response = await request(app.callback())
     .post("/api/users:signin")
     .send({
       email: "audit@a.com",
       password: "password",
     });
    expect(response.statusCode).toEqual(200);
    let audit = response.body.data;

     // audit 修改 writer1的文章 hidden 状态 生效
     response = await request(app.callback())
     .put(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${audit.token}`)
     .send({
       hidden: false
     });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0].hidden).toEqual(false);

    // audit 修改 writer1的文章 title 状态 不生效
    response = await request(app.callback())
    .put(`/api/posts/${post.id}`)
    .set("Authorization", `Bearer ${audit.token}`)
    .send({
      title: "Hi~",
      content: "my first posts with update.",
    });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0].title).toEqual("Hello world");


    // writer1访问自己的文章可以访问到，因为hidden=false
    response = await request(app.callback())
     .get(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${writer1.token}`)
     .send();
     expect(response.statusCode).toEqual(200);
     expect(response.body.data.title).toEqual("Hello world");
  });


  it("post without published can view only by admin and owner. owner can change post published status", async () => {

    // writer 登录
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "writer@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let writer1 = response.body.data;
    expect(writer1.token).toBeDefined();

    // writer1 创建文章 published false;
    response = await request(app.callback())
      .post("/api/posts")
      .set("Authorization", `Bearer ${writer1.token}`)
      .send({
        title: "Hello world",
        published: false,
        hidden: false,
        content: "my first posts.",
      });
    expect(response.statusCode).toEqual(200);
    let post = response.body.data;

    // writer2 登录
    response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "writer2@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let writer2 = response.body.data;

    // writer2访问 writer1 未发布文章访问不到
    response = await request(app.callback())
      .get(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${writer2.token}`)
      .send();
    expect(response.statusCode).toEqual(204);

     // writer1访问自己的文章 可以访问到
     response = await request(app.callback())
     .get(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${writer1.token}`)
     .send();
    expect(response.statusCode).toEqual(200);

     // admin 登录
     response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "admin@a.com",
        password: "password",
      });
     expect(response.statusCode).toEqual(200);
     let admin = response.body.data;
     expect(admin.token).toBeDefined();

    // admin访问 writer1的文章 可以访问
    response = await request(app.callback())
     .get(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${admin.token}`)
     .send();
    expect(response.statusCode).toEqual(200);
    expect(response.body.data.title).toEqual('Hello world');

     // anonymous 登录
     response = await request(app.callback())
     .post("/api/users:signin")
     .send({
       email: "anonymous@a.com",
       password: "password",
     });
    expect(response.statusCode).toEqual(200);
    let anonymous = response.body.data;

    // anonymous 访问 writer1 未发布文章访问不到
    response = await request(app.callback())
    .get(`/api/posts/${post.id}`)
    .set("Authorization", `Bearer ${anonymous.token}`)
    .send();
    expect(response.statusCode).toEqual(204);

     // writer1 修改 自己的文章 published 状态 生效
     response = await request(app.callback())
     .put(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${writer1.token}`)
     .send({
       published: true
     });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0].hidden).toEqual(false);

    // writer2访问writer1的文章可以访问到，因为published=true
    response = await request(app.callback())
     .get(`/api/posts/${post.id}`)
     .set("Authorization", `Bearer ${writer2.token}`)
     .send();
     expect(response.statusCode).toEqual(200);
     expect(response.body.data.title).toEqual("Hello world");
  });


  it("unaudited comment can only view by owner, audit can update audited status, anonymous can view but cannot create and update", async () => {
    // writer 登录
    let response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "writer@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let writer1 = response.body.data;
    expect(writer1.token).toBeDefined();

    // writer1 创建comments;
    response = await request(app.callback())
      .post("/api/comments")
      .set("Authorization", `Bearer ${writer1.token}`)
      .send({
        content: "Hello world Comments",
        audited: false,
      });
    expect(response.statusCode).toEqual(200);
    let comment = response.body.data;

     // writer2 登录
     response = await request(app.callback())
     .post("/api/users:signin")
     .send({
       email: "writer2@a.com",
       password: "password",
     });
   expect(response.statusCode).toEqual(200);
   let writer2 = response.body.data;

    // writer2访问 writer1 未审核评论访问不到
    response = await request(app.callback())
     .get(`/api/comments/${comment.id}`)
     .set("Authorization", `Bearer ${writer2.token}`)
     .send();
    expect(response.statusCode).toEqual(204);


    // audit 登录
    response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "audit@a.com",
        password: "password",
      });
    expect(response.statusCode).toEqual(200);
    let audit = response.body.data;
    
    // audit尝试修改comment content 不生效
    response = await request(app.callback())
     .put(`/api/comments/${comment.id}`)
     .set("Authorization", `Bearer ${audit.token}`)
     .send({
      content: "Hi~"
    });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0].content).toEqual("Hello world Comments");


    // audit尝试修改comment audited状态 生效
    response = await request(app.callback())
      .put(`/api/comments/${comment.id}`)
      .set("Authorization", `Bearer ${audit.token}`)
      .send({
        audited: true
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data[0].audited).toEqual(true);
   
    // writer2可以访问了
    response = await request(app.callback())
     .get(`/api/comments/${comment.id}`)
     .set("Authorization", `Bearer ${writer2.token}`)
     .send();
     expect(response.statusCode).toEqual(200);
     expect(response.body.data.content).toEqual("Hello world Comments");

     // anonymous 登录
     response = await request(app.callback())
      .post("/api/users:signin")
      .send({
        email: "anonymous@a.com",
        password: "password",
      });
     expect(response.statusCode).toEqual(200);
     let anonymous = response.body.data;

     // anonymous 访问comments
     response = await request(app.callback())
     .get(`/api/comments/${comment.id}`)
     .set("Authorization", `Bearer ${anonymous.token}`)
     .send();
     expect(response.statusCode).toEqual(200);
     expect(response.body.data.content).toEqual("Hello world Comments");


     // anonymous 创建comments
     response = await request(app.callback())
      .post("/api/comments")
      .set("Authorization", `Bearer ${anonymous.token}`)
      .send({
        content: "Hello world Comments"
      });
    expect(response.statusCode).toEqual(403);

    // anonymous 创建 更新comments
    response = await request(app.callback())
    .put(`/api/comments/${comment.id}`)
      .set("Authorization", `Bearer ${anonymous.token}`)
      .send({
        content: "Hello world"
      });
    expect(response.statusCode).toEqual(403);
   

  });

});
