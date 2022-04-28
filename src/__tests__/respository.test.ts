/*
 * @Author: pangff
 * @Date: 2022-04-18 16:46:00
 * @LastEditTime: 2022-04-28 09:38:14
 * @LastEditors: pangff
 * @Description: 基于isuue #1的 repository测试用例
 * @FilePath: /noco-next-demo/src/__tests__/respository.test.ts
 * stay hungry,stay foolish
 */
import { BelongsToManyRepository, HasManyRepository } from "@nocobase/database";
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
        const zhangsan = await User.repository.findOne({
            filter:{
                email: "zhangsan@a.com"
            }
        });
        const lisi = await User.repository.findOne({
            filter:{
                email: "lisi@a.com"
            }
        });

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



        for (let i = 0; i < 50; i++) {
            if (i % 2 == 0) { // zhangsan发文章
                await Post.repository.create({
                    values : {
                        title: "张三发的科技文章",
                        content: "张三发的科技文章",
                        tags: tagArray[0],
                        comments: [],
                        user:zhangsan
                    }
                });

                await Post.repository.create({
                    values : {
                        title: "张三发的国际文章",
                        content: "张三发的国际文章",
                        tags: tagArray[1],
                        comments: [],
                        user:zhangsan
                    }
                });

            }  else {  // lisi发文章
                await Post.repository.create({
                    values : {
                        title: "李四发的科技文章",
                        content: "李四发的科技文章",
                        tags: tagArray[0],
                        comments: [],
                        user: lisi
                    }
                });

                await Post.repository.create({
                    values : {
                        title: "李四发的国际文章",
                        content: "李四发的国际文章",
                        tags: tagArray[1],
                        comments: [],
                        user: lisi
                    }
                });
            }
        }

        let post = await Post.repository.findAndCount();
        expect(post[1]).toEqual(100);


        post = await Post.repository.findAndCount({
            filter: {
                userId: zhangsan.get('id')
            }
        });
        expect(post[1]).toEqual(50);


        // 根据科技-tag分页查询文章列表 10 第一种方式
        const TagPostRepository = new BelongsToManyRepository(Tag, 'posts', tagArray[0].get('id'));
        let count = await TagPostRepository.count();
        expect(count).toEqual(50);

        let posts = await TagPostRepository.find({
            offset:0,
            limit:10
        });
        expect(posts.length).toEqual(10);


        // 根据科技-tag分页查询文章列表 10 第二种方式
        count = await Post.repository.count({
            filter: {
              'tags.id': tagArray[0].get('id'),
            },
          });
        expect(count).toEqual(50);

        posts = await Post.repository.find({
            filter: {
              'tags.id': tagArray[0].get('id'),
            },
            offset:0,
            limit:10
          });
        expect(posts.length).toEqual(10);
    });


    it("create, query, delete comments", async () => {

        const zhangsan = await User.repository.findOne({
            filter:{
                email: "zhangsan@a.com"
            }
        });

        const lisi = await User.repository.findOne({
            filter:{
                email: "lisi@a.com"
            }
        });

        // 创建多评论文章;
        let post = await Post.repository.create({
            values : {
                title: "测试文章",
                content: "iOS、Android、Harmony.",
                comments: [{
                    //张三对post发表评论
                    content: `my comment >>> ${zhangsan.nickname}`,
                    user: zhangsan.id
                },{
                    // lisi对post发表评论
                    content: `my comment >>> ${lisi.nickname}`,
                    user: lisi.id
                }],
                user:zhangsan
            }
        });
        
        const PostCommentsRepository = new HasManyRepository(Post, 'comments', post.id);
        let count = await PostCommentsRepository.count();
        expect(count).toEqual(2);

        let comments = await PostCommentsRepository.find({
            offset: 0,
            limit: 1
        })
        expect(comments.length).toEqual(1);
       
    
        // 查看张三下所有评论 应该有1条
        count = await Comment.repository.count({
            filter: {
                userId: zhangsan.get('id')
            }
        });
        expect(count).toEqual(1);
    
        // 删除评论
        await Comment.repository.destroy({
            filter: {
                userId: zhangsan.get('id')
            }
        });

        //删除后再看没有了
        count = await Comment.repository.count({
            filter: {
                userId: zhangsan.get('id')
            }
        });
        expect(count).toEqual(0);
    });
});
