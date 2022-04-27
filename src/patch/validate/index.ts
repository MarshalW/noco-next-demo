import { addPostsValidate } from "./posts";
import { addMessagesValidate } from "./messages";
import { Application } from "@nocobase/server";

const addValidators=[
    addPostsValidate,
    addMessagesValidate
]

export default function addValidate(app: Application) {
  app.on("afterStart", () => {
    for(let validate of addValidators){
        validate(app)
    }
  });
}
