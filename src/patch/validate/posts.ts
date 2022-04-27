import { Application } from "@nocobase/server";

const validator = {
  email: {
    type: "string",
    name: "email",
    validate: { isEmail: true },
  },
};

export function addPostsValidate(app: Application) {
  let collection = app.db.getCollection("posts");

  if (collection == null) {
    console.log(`====> no posts`);
    return;
  }

  let k: keyof typeof validator;
  for (k in validator) {
    const v = validator[k];
    if (collection.hasField(k)) {
      collection.setField(k, v);
    }
  }

  console.log("====>>> validate from posts");
}
