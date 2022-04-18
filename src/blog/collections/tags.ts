/*
 * @Author: pangff
 * @Date: 2022-04-14 19:56:04
 * @LastEditTime: 2022-04-14 19:56:58
 * @LastEditors: pangff
 * @Description: 
 * @FilePath: /noco-next-demo/src/blog/collections/tags.ts
 * stay hungry,stay foolish
 */
import { CollectionOptions } from "@nocobase/database";

// 标签
export default {
  name: "tags",
  createdBy: true,
  fields: [
    { type: "string", name: "name" },
    { type: "belongsToMany", name: "posts" },
  ],
} as CollectionOptions;
