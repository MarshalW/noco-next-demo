import { CollectionOptions } from "@nocobase/database";

// 文章
export default {
  name: "posts",
  createdBy: true,
  fields: [
    { name: "title", type: "string" },
    { name: "content", type: "text" },
  ],
} as CollectionOptions;
