/*
 * @Author: pangff
 * @Date: 2022-04-14 19:57:25
 * @LastEditTime: 2022-04-29 15:45:12
 * @LastEditors: pangff
 * @Description: 
 * @FilePath: /noco-next-demo/src/blog/collections/comments.ts
 * stay hungry,stay foolish
 */
import { CollectionOptions } from "@nocobase/database";

// 评论
export default {
  name: "comments",
  createdBy: true,
    fields: [
      { name: "content", type: "text" },
      { name: "user", type: "belongsTo", target: "users" },
      { name: "audited", type: "boolean"}
    ],
} as CollectionOptions;