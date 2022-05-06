/*
 * @Author: pangff
 * @Date: 2022-04-14 09:27:11
 * @LastEditTime: 2022-04-29 15:46:08
 * @LastEditors: pangff
 * @Description:
 * @FilePath: /noco-next-demo/src/blog/collections/posts.ts
 * stay hungry,stay foolish
 */
import { CollectionOptions } from "@nocobase/database";


// 博客
export default {
  name: "posts",
  createdBy: true,
  fields: [
    { name: "title", type: "string" },
    { name: "content", type: "text" },
    { name: "tags", type: "belongsToMany" },
    { name: "comments", type: "hasMany" },
    { name: "user", type: "belongsTo", target: "users" },
    { name: "hidden", type: "boolean"},
    { name: "published", type: "boolean"}
  ],
} as CollectionOptions;
