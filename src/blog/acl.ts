/*
 * @Author: pangff
 * @Date: 2022-05-06 17:03:01
 * @LastEditTime: 2022-05-06 17:16:08
 * @LastEditors: pangff
 * @Description: acl初始化设置
 * @FilePath: /noco-next-demo/src/blog/acl.ts
 * stay hungry,stay foolish
 */
export default class InitAcl {

    async init(db) {

      // 设置 strategy，只能更新自己创建的posts
      const Role = db.getCollection("roles");
      const Scope = db.getCollection("rolesResourcesScopes");
      // writer role strategy
      await Role.repository.create({
        values: {
          name: "writer",
          title: "Writer",
          strategy: {
            actions: ["update:own", "create", "view", "destroy:own"],
          },
        },
      });
    
      // audit role strategy
      await Role.repository.create({
        values: {
          name: "audit",
          title: "Audit",
          strategy: {
            actions: ["view:all"],
          },
        },
      });


        // anonymous role strategy
        await Role.repository.update({
        filter: {
            name: "anonymous",
        },
        values:{
            strategy: {
            allowConfigure: true,
            actions: ["view"],
            },
        }
        });
        
        // create posts no hidden and (published or own) scope
        const noHiddenAndPublishScope = await Scope.repository
        .create({
            values: {
            resourceName: 'posts',
            name: 'no hidden posts',
            scope: {
                hidden: false,
                $or:[{
                published: true
                },{
                createdById: "{{ ctx.state.currentUser.id }}"
                }]
            },
            },
        });

        // create comment audited or own scope
        const auditedOrOwnCommentScope = await Scope.repository
        .create({
            values: {
            resourceName: 'comments',
            name: 'audited or own comments',
            scope: {
                $or:[{
                audited: true
                },{
                createdById: "{{ ctx.state.currentUser.id }}"
                }]
            },
            },
        });


        // writer 只能看到非hidden状态的published稿件，以及非hidden状态自己的稿件
        await Role.repository
        .relation("resources")
        .of("writer")
        .create({
            values: {
                name: "posts",
                usingActionsConfig: true,
                actions: [
                {
                    name: "view",
                    scope: noHiddenAndPublishScope,
                    fields:["content","title"]
                }
                ],
            },
        });

        // writer 只能看到审核通过的评论或者自己的评论
        await Role.repository
        .relation("resources")
        .of("writer")
        .create({
            values: {
                name: "comments",
                usingActionsConfig: true,
                actions: [
                {
                    name: "view",
                    scope: auditedOrOwnCommentScope,
                    fields:["content","audited"]
                }],
            },
        });

        // audit 可设置 post hidden ，但不可更改 post 其他 fields
        await Role.repository
        .relation("resources")
        .of("audit")
        .create({
            values: {
                name: "posts",
                usingActionsConfig: true,
                actions: [
                    {
                        name: "update",
                        fields: ["hidden"]
                    },
                    {
                        name: "view",
                        scope: noHiddenAndPublishScope,
                        fields:["content","title"]
                    }
                ],
            },
        });

        // audit 可设置 comment audited 属性，但不可更改 comment
        await Role.repository
        .relation("resources")
        .of("audit")
        .create({
            values: {
                name: "comments",
                actions: [
                    {
                        name: "update",
                        fields: ["audited"]
                    },
                    {
                        name: "view",
                        scope: auditedOrOwnCommentScope,
                        fields:["content","audited"]
                    }
                ],
            },
        });

        // anonymous 只能看到非hidden状态并且是publish状态的稿件
        await Role.repository
        .relation("resources")
        .of("anonymous")
        .create({
            values: {
                name: "posts",
                usingActionsConfig: true,
                actions: [
                {
                    name: "view",
                    scope: noHiddenAndPublishScope,
                    fields:["content","title"]
                }],
            },
        });

        // anonymous 只能看到审核通过评论
        await Role.repository
        .relation("resources")
        .of("anonymous")
        .create({
            values: {
                name: "comments",
                usingActionsConfig: true,
                actions: [
                {
                    name: "view",
                    scope: auditedOrOwnCommentScope,
                    fields:["content"]
                }],
            },
        });
    }
}