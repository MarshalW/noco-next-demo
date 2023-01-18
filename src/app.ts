import { Application } from "@nocobase/server";
import { IDatabaseOptions } from "@nocobase/database";

import { resolve } from "path";

import addons from "./addons";

const dialect = process.env.DB_DIALECT as any;

let databaseConfig: IDatabaseOptions = {
  dialect,
  logging: process.env.DB_LOG_SQL === "on" ? console.log : false,
};

if (dialect === "sqlite") {
  databaseConfig = {
    ...databaseConfig,
    storage: resolve(process.cwd(), process.env.DB_STORAGE || "db.sqlite"),
  };
} else {
  databaseConfig = {
    ...databaseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
  };
}

const app = new Application({
  database: databaseConfig,
  resourcer: {
    prefix: process.env.SERVER_BASE_PATH,
  },
});

// 加载插件
const plugins = [
  ["@nocobase/plugin-error-handler"],
  ["@nocobase/plugin-collection-manager"],
  ["@nocobase/plugin-ui-schema-storage"],
  ["@nocobase/plugin-ui-routes-storage"],
  ["@nocobase/plugin-file-manager"],
  ["@nocobase/plugin-system-settings"],
  [
    "@nocobase/plugin-users",
    {
      jwt: {
        secret: process.env.JWT_SECRET,
      },
    },
  ],
  ["@nocobase/plugin-acl"],
  ["@nocobase/plugin-china-region"],
  ["@nocobase/plugin-workflow"],
  ["@nocobase/plugin-client"],
];

for (const [plugin, options = null] of plugins) {
  app.plugin(require(plugin as string).default, options);
}

// 补丁入口
addons(app);

app.parse(process.argv);
