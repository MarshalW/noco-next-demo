import { Application } from "@nocobase/server";

export default function (app: Application) {
  app.on("afterStart", () => {
    // TODO 全量更新聚合字段
  });

  
}
