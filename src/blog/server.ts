import { Plugin } from "@nocobase/server";
import { resolve } from "path";
// import * as postsActions from "./actions/posts";

export default class PluginBlog extends Plugin {
  getName(): string {
    return this.constructor.name;
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, "collections"),
    });
  }

  async install() {
    this.app.on("afterInstall", async () => {
      // 设置 strategy，只能更新自己创建的posts
      const Role = this.db.getCollection("roles");

      // writer role strategy
      let role = await Role.repository.create({
        values: {
          name: "writer",
          title: "Writer",
          strategy: {
            actions: ["update:own", "create", "view", "destroy:own"],
          },
        },
      });

      const Scope = this.db.getCollection("rolesResourcesScopes");
      let scope = await Scope.repository.findOne({
        filter: {
          key: "own",
        },
      });

      // writer role detail resource action
      await Role.repository
        .relation("resources")
        .of("writer")
        .create({
          values: {
            name: "posts",
            actions: [
              {
                name: "hello",
              },
            ],
          },
        });

      // anonymous
      await Role.repository.update({
        filter: {
          name: "anonymous",
        },
        values: {
          strategy: {
            allowConfigure: true,
            actions: ["view"],
          },
        },
      });
    });
  }
}
