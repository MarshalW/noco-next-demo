# validate

为测试服务器端 validate 做的单独分支。

## 准备

以下过程见 README

- pull 最新的 nocobase 项目并构建完毕
- 构建本项目

启动本项目：

```bash
npm start

> server@1.0.0 start
> node -r dotenv/config lib/app.js start

====> no posts
====>>> validate from messages
🚀 nocobase server had started at http://0.0.0.0:3000
```

## 技术可行性原型基本思路

在 app.ts 文件中加入补丁：

```ts
// 补丁，临时服务器端校验
addValidate(app);
```

补丁监听到服务启动后再触发:

```ts
export default function addValidate(app: Application) {
  app.on("afterStart", () => {

```

校验器，比如 `posts.ts`，将检查：

- 是否有指定名称的 collection
- 是否有指定名称的 field

如果都存在，才覆盖原来的 field 设置，加入 validate

## 技术可行性原型结论

通过代码，验证了技术的可行性。

首先启动了界面端（为此服务器端已经加满了插件），在 web 界面创建了 posts 表和 email 字段。

这时没有加载校验补丁，没有服务器端校验。

代码使校验生效，重启 nocobase 服务器，服务器端校验生效：

```bash
# 登录
TOKEN=$(curl -s --location --request POST 'http://localhost:3000/api/users:signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email":"admin@nocobase.com",
    "password":"admin123"
}' | jq -j .data.token)


# 测试校验
curl -s --location --request POST 'http://localhost:3000/api/posts' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data-raw '{
    "title":"Hello world",
    "email":"b"
}'
{"errors":[{"message":"Validation error"}]}%

```

## 需要实现的内容

主要目标：

- 实现一个可单独引入的 package，执行没有副作用的校验
- 实现 test 代码测试，而不是可行性原型在服务器运行手动测试

需要做的事情大致有：

- supertest 模拟前端创建新的 posts collection 和 email field
- 实现 `server-validator-nocobase`
  - 是一个函数，`updateValidators(app:Application, validators: Array<Validator>)`
  - Application 是 @nocobase/server 的
  - Validator，需要设计一个 interface
  - 返回 `Array<string>`, 内容为 collection/field 是否生效，便于调试
- test 代码中测试未使用 `updateValidators` 和使用的情况

正式使用时：

- 引入 `server-validator-nocobase` 包
- 加载 json/yml (不必在这里实现)生成 Validator Array
- 在 `afterStart` 后执行 `updateValidators`
