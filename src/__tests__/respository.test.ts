/*
 * @Author: pangff
 * @Date: 2022-04-18 16:46:00
 * @LastEditTime: 2022-04-19 11:04:34
 * @LastEditors: pangff
 * @Description: 基于isuue #1的 repository测试用例
 * @FilePath: /noco-next-demo/src/__tests__/respository.test.ts
 * stay hungry,stay foolish
 */
import { Application } from "@nocobase/server";
import request from "supertest";

class MockServer extends Application { }

describe("collections test", () => {
    let app: Application;

    let User;
    let Role;
    let Post;
    let Comment;
    let Tag;

    
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

        Tag = app.db.getCollection("tags");
        Post = app.db.getCollection("posts");
        Comment = app.db.getCollection("comments");
    });

    afterEach(async () => {
        await app.destroy();
    });

    it("create new posts with tags", async () => {

        const zhangsan = await User.repository.findOne({
            filter:{
                email: "zhangsan@a.com"
            }
        });
        expect(zhangsan['nickname']).toEqual('zhangsan');
        
        // 张三创建多个标签;
        let tagArray = [];

        //科技标签
        let tag = await Tag.repository.create({
            values : {
                name: "科技"
            }
        });
        tagArray.push(tag)

        //国际标签
        tag = await Tag.repository.create({
            values : {
                name: "国际"
            }
        });
        tagArray.push(tag)
        const tagsCount = await Tag.repository.count();
        expect(tagsCount).toEqual(2);

        // 创建多标签文章;
        let post = await Post.repository.create({
            values : {
                title: "测试文章",
                content: "iOS、Android、Harmony.",
                tags: tagArray,
                comments: [],
                user:zhangsan
            }
        });
        let tags = await post.getTags();
        expect(tags.length).toEqual(2);
        expect(tags[0].name).toEqual("科技");
        expect(tags[1].name).toEqual("国际");

    });

    it("create multi posts and list by paginate", async () => {
      
    });


    it("create, query, delete comments", async () => {

      
    });
});
