import { Application } from "@nocobase/server";

const app = new Application({
  database: {
    dialect: "sqlite",
    storage: "./test.sqlite",
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
  ["./blog"],
];

for (const [plugin, options = null] of plugins) {
  app.plugin(require(plugin as string).default, options);
}

app.parse(process.argv);
