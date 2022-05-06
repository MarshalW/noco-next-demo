/*
 * @Author: pangff
 * @Date: 2022-04-14 09:27:11
 * @LastEditTime: 2022-05-06 17:24:55
 * @LastEditors: pangff
 * @Description: server
 * @FilePath: /noco-next-demo/src/blog/server.ts
 * stay hungry,stay foolish
 */
import { Plugin } from "@nocobase/server";
import { resolve } from "path";
import InitAcl from "./acl";
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
      const acl = new InitAcl();
      await acl.init(this.db)
    });
  }
}
