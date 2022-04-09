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

const plugins = [
  ["@nocobase/plugin-error-handler"] as any,
  ["@nocobase/plugin-users"],
  ["@nocobase/plugin-acl"],
];

for (const [plugin, options = null] of plugins) {
  app.plugin(require(plugin).default, options);
}

app.parse(process.argv);
