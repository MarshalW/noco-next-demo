import { Context, Next } from "@nocobase/actions";

export async function hello(ctx: Context, next: Next) {
  ctx.body = { message: "hello" };
  await next();
}
