import { Application } from "@nocobase/server";

import PluginErrorHandler from "@nocobase/plugin-error-handler";
import UserPlugin from "@nocobase/plugin-users";
import PluginACL from "@nocobase/plugin-acl";

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

const plugins = [PluginErrorHandler, UserPlugin, PluginACL];

for (const plugin of plugins) {
  app.plugin(plugin);
}

app.parse(process.argv);
