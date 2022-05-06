/*
 * @Author: pangff
 * @Date: 2022-04-14 20:09:21
 * @LastEditTime: 2022-05-06 16:57:37
 * @LastEditors: pangff
 * @Description: 基于isuue #1的Api方式测试用例
 * @FilePath: /noco-next-demo/src/__tests__/collections.test.ts
 * stay hungry,stay foolish
 */
import { Application } from "@nocobase/server";
import request from "supertest";

class MockServer extends Application { }

describe("collections test", () => {
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

        // 创建用户 pangff
        await User.repository.create({
            values: {
                email: "pangff@a.com",
                password: "password",
                nickname: "pangff",
                roles: [role],
            },
        });

        // 创建用户 lisi
        await User.repository.create({
            values: {
                email: "lisi@a.com",
                password: "password",
                nickname: "lisi",
                roles: [role],
            },
        });
    });

    afterEach(async () => {
        await app.destroy();
    });

    it("create new posts with tags", async () => {
        // zhangsan 登录
        let response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "zhangsan@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let zhangsan = response.body.data;
        expect(zhangsan.token).toBeDefined();


        // 张三创建多个标签;
        let tagArray = [];

        //科技标签
        response = await request(app.callback())
            .post("/api/tags:create")
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                name: "科技"
            });
        expect(response.statusCode).toEqual(200);
        let tag = response.body.data;
        tagArray.push(tag);

        //国际标签
        response = await request(app.callback())
            .post("/api/tags:create")
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                name: "国际"
            });
        expect(response.statusCode).toEqual(200);
        tag = response.body.data;
        tagArray.push(tag);

        // 创建多标签文章;
        response = await request(app.callback())
            .post("/api/posts:create")
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                title: "测试文章",
                hidden: false,
                published : true,
                content: "iOS、Android、Harmony.",
                user: zhangsan.id,
                tags: tagArray
            });
        expect(response.statusCode).toEqual(200);
        let post = response.body.data;

        //读取文章的标签
        response = await request(app.callback())
        .get(`/api/posts/${post.id}/tags:list`)
        .set("Authorization", `Bearer ${zhangsan.token}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(2);
        expect(response.body.data[0].name).toEqual("科技");
        expect(response.body.data[1].name).toEqual("国际");

    });



    it("create multi posts and list by paginate", async () => {
        // zhangsan 登录
        let response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "zhangsan@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let zhangsan = response.body.data;
        expect(zhangsan.token).toBeDefined();

        // pangff 登录
        response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "pangff@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let pangff = response.body.data;
        expect(pangff.token).toBeDefined();


        // lisi 登录
        response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "lisi@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let lisi = response.body.data;
        expect(lisi.token).toBeDefined();


        // 张三创建多个标签;
        let tagArray = [];

        //科技标签
        response = await request(app.callback())
            .post("/api/tags:create")
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                name: "科技"
            });
        expect(response.statusCode).toEqual(200);
        let tag = response.body.data;
        tagArray.push(tag);

        //国际标签
        response = await request(app.callback())
            .post("/api/tags:create")
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                name: "国际"
            });
        expect(response.statusCode).toEqual(200);
        tag = response.body.data;
        tagArray.push(tag);

        //批量创建posts
        for (let i = 0; i < 50; i++) {
            if (i % 3 == 0) { // zhangsan发文章

                response = await request(app.callback())
                    .post("/api/posts:create")
                    .set("Authorization", `Bearer ${zhangsan.token}`)
                    .send({
                        title: "张三发的科技文章",
                        content: "张三发的科技文章",
                        hidden: false,
                        published : true,
                        user: zhangsan.id,
                        tags: [tagArray[0]]
                    });
                expect(response.statusCode).toEqual(200);

                response = await request(app.callback())
                    .post("/api/posts:create")
                    .set("Authorization", `Bearer ${zhangsan.token}`)
                    .send({
                        title: "张三发的国际文章",
                        content: "张三发的国际文章",
                        hidden: false,
                        published : true,
                        user: zhangsan.id,
                        tags: [tagArray[1]]
                    });
                expect(response.statusCode).toEqual(200);
            } else if (i % 3 == 1) { // pangff发文章

                response = await request(app.callback())
                    .post("/api/posts:create")
                    .set("Authorization", `Bearer ${pangff.token}`)
                    .send({
                        title: "pangff发的科技文章",
                        content: "pangff发的科技文章",
                        hidden: false,
                        published : true,
                        user: pangff.id,
                        tags: [tagArray[0]]
                    });
                expect(response.statusCode).toEqual(200);

                response = await request(app.callback())
                    .post("/api/posts:create")
                    .set("Authorization", `Bearer ${pangff.token}`)
                    .send({
                        title: "pangff发的国际文章",
                        content: "pangff发的国际文章",
                        hidden: false,
                        published : true,
                        user: pangff.id,
                        tags: [tagArray[1]]
                    });
                expect(response.statusCode).toEqual(200);
            } else {  // lisi发文章
                response = await request(app.callback())
                    .post("/api/posts:create")
                    .set("Authorization", `Bearer ${lisi.token}`)
                    .send({
                        title: "lisi发的科技文章",
                        content: "lisi发的科技文章",
                        hidden: false,
                        published : true,
                        user: lisi.id,
                        tags: [tagArray[0]]
                    });
                expect(response.statusCode).toEqual(200);

                response = await request(app.callback())
                    .post("/api/posts:create")
                    .set("Authorization", `Bearer ${lisi.token}`)
                    .send({
                        title: "lisi发的国际文章",
                        content: "lisi发的国际文章",
                        hidden: false,
                        published : true,
                        user: lisi.id,
                        tags: [tagArray[1]]
                    });
                expect(response.statusCode).toEqual(200);
            }
        }
        //读取文章列表，确定总数 100
        response = await request(app.callback())
            .get(`/api/posts:list`)
            .set("Authorization", `Bearer ${lisi.token}`)
            .query({paginate: false});
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(100);

        //根据用户 pangff 查询文章列表 34
        response = await request(app.callback())
            .get(`/api/posts:list`)
            .set("Authorization", `Bearer ${pangff.token}`)
            .query({paginate: false, filter:{ userId: pangff.id}});
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(34);

        //根据科技-tag分页查询文章列表 10
        response = await request(app.callback())
            .get(`/api/tags/${tagArray[0].id}/posts:list`)
            .set("Authorization", `Bearer ${pangff.token}`)
            .query({ page: 1, pageSize: 10 });
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(10);
    });


    it("create, query, delete comments", async () => {

        // zhangsan 登录
        let response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "zhangsan@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let zhangsan = response.body.data;
        expect(zhangsan.token).toBeDefined();

        // pangff 登录
        response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "pangff@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let pangff = response.body.data;
        expect(pangff.token).toBeDefined();

        // lisi 登录
        response = await request(app.callback())
            .post("/api/users:signin")
            .send({
                email: "lisi@a.com",
                password: "password",
            });
        expect(response.statusCode).toEqual(200);
        let lisi = response.body.data;
        expect(lisi.token).toBeDefined();


        // 创建文章;
        response = await request(app.callback())
            .post("/api/posts:create")
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                title: "测试文章",
                content: "iOS、Android、Harmony.",
                user: zhangsan.id
            });
        expect(response.statusCode).toEqual(200);
        let post = response.body.data;

        //张三对post发表评论
        response = await request(app.callback())
            .post(`/api/posts/${post.id}/comments:create`)
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .send({
                content: `my comment >>> ${zhangsan.nickname}`,
                user: zhangsan.id
            });
        expect(response.statusCode).toEqual(200);

        // pangff对post发表评论
        response = await request(app.callback())
            .post(`/api/posts/${post.id}/comments:create`)
            .set("Authorization", `Bearer ${pangff.token}`)
            .send({
                content: `my comment >>> ${pangff.nickname}`,
                user: pangff.id
            });
        expect(response.statusCode).toEqual(200);

        // lisi发表对post评论
        response = await request(app.callback())
            .post(`/api/posts/${post.id}/comments:create`)
            .set("Authorization", `Bearer ${lisi.token}`)
            .send({
                content: `my comment >>> ${lisi.nickname}`,
                user: lisi.id
            });
        expect(response.statusCode).toEqual(200);

        //获取文章下的全部评论
        response = await request(app.callback())
        .get(`/api/posts/${post.id}/comments:list`)
        .set("Authorization", `Bearer ${pangff.token}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body.data[0].content).toEqual(`my comment >>> ${zhangsan.nickname}`);
        expect(response.body.data[1].content).toEqual(`my comment >>> ${pangff.nickname}`);
        expect(response.body.data[2].content).toEqual(`my comment >>> ${lisi.nickname}`);


        //分页查看post下的comments 该posts下有3个评论
        response = await request(app.callback())
            .get(`/api/posts/${post.id}/comments:list`)
            .set("Authorization", `Bearer ${pangff.token}`)
            .query({ page: 1, pageSize: 2 });
        expect(response.statusCode).toEqual(200);
        expect(response.body.meta.count).toEqual(3);
        expect(response.body.meta.totalPage).toEqual(2);


        //查看张三下所有评论 应该有1条
        response = await request(app.callback())
            .get(`/api/comments:list`)
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .query({ paginate: false, filter:{userId: zhangsan.id }});
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(1);

        // 李四删除张三评论
        response = await request(app.callback())
            .post(`/api/comments:destroy`)
            .query({ filter: { "userId": zhangsan.id } })
            .set("Authorization", `Bearer ${lisi.token}`);
        expect(response.statusCode).toEqual(200);

        //再次查看张三下所有评论 应该没有删除还有1条
        response = await request(app.callback())
            .get(`/api/comments:list`)
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .query({ paginate: false,filter: { userId: zhangsan.id } })
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(1);

        //张三删除自己评论,（不需要通过id过滤 不传也可以）
        response = await request(app.callback())
            .post(`/api/comments:destroy`)
            .query({ filter: { userId: zhangsan.id } })
            .set("Authorization", `Bearer ${zhangsan.token}`);
        expect(response.statusCode).toEqual(200);

        //再次查看张三下所有评论 应该有0条
        response = await request(app.callback())
            .get(`/api/comments:list`)
            .set("Authorization", `Bearer ${zhangsan.token}`)
            .query({ paginate: false, filter: { userId: zhangsan.id } });
        expect(response.statusCode).toEqual(200);
        expect(response.body.data.length).toEqual(0);
    });
});
