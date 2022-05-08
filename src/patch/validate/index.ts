import { Application } from "@nocobase/server";
import { load } from "js-yaml";
import { readFile } from "fs/promises";
import { Validator, updateValidators} from "server-validator-nocobase";

export default function addValidate(app: Application,validatorPath: string) {
  app.on("afterStart", async () => {
    const validators = load(await readFile(validatorPath, "utf8")).validators as Array<Validator>;
    const results = updateValidators(app,validators);
    assertEmpty(results)
  });
}

function assertEmpty(array: Array<string>) {
  if (array.length != 0) {
      throw new Error(array[0]);
  }
}

