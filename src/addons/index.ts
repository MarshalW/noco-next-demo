import { Application } from "@nocobase/server";

import aggregationAddon from "./aggregation";

const addons = [aggregationAddon];

export default function (app: Application) {
  addons.forEach((addon) => {
    addon(app);
  });
}
