# noco next demo

演示如何简单的使用 [nocobase](https://github.com/nocobase/nocobase) 服务器端。

## 下载和构建 nocobase

```bash
# clone 项目
git clone https://github.com/nocobase/nocobase.git

# 切换到nocobase-next分支
cd nocobase
git checkout nocobase-next

# 构建
npm i
npm run bootstrap
npm run build
```

## 下载和构建本项目

```bash
# clone 项目
git clone https://github.com/MarshalW/noco-next-demo.git
cd noco-next-demo

# 安装必要的依赖包
npm i

# 将nocobase中需要的package复制到 ./node_modules
# ../nocobase/ 是nocobase的相对路径或者绝对路径
./cp-nocobase-packages.sh ../nocobase/

# 构建项目
npm run build

# 创建数据库和表
npm run db

# 启动服务
npm start

# 运行所有测试
npm test
```

## 使用

```bash

# 登录
TOKEN=$(curl -s --location --request POST 'http://localhost:3000/api/users:signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email":"admin@nocobase.com",
    "password":"admin123"
}' | jq -j .data.token)

# 查看 users
curl -s  --location --request GET 'http://localhost:3000/api/users' \
--header "Authorization: Bearer $TOKEN" | jq .

{
  "data": [
    {
      "id": 1,
      "createdAt": "2022-04-10T04:14:43.177Z",
      "updatedAt": "2022-04-10T04:34:31.370Z",
      "nickname": "Super Admin",
      "email": "admin@nocobase.com",
      "appLang": null
    }
  ],
  "meta": {
    "count": 1,
    "page": 1,
    "pageSize": 20,
    "totalPage": 1
  }
}

# 查看 posts
curl -s  --location --request GET 'http://localhost:3000/api/posts' \
--header "Authorization: Bearer $TOKEN" | jq .

{
  "data": [],
  "meta": {
    "count": 0,
    "page": 1,
    "pageSize": 20,
    "totalPage": 0
  }
}

# 注册用户 zhangsan
curl -X POST -H "Content-Type: application/json" \
--header "Authorization: Bearer $TOKEN" \
    -d '{"email":"zhangsan@163.com","password":"password"}' \
    http://localhost:3000/api/users

# zhangsan 登录
TOKEN=$(curl -s --location --request POST 'http://localhost:3000/api/users:signin' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email":"zhangsan@163.com",
    "password":"password"
}' | jq -j .data.token)

# zhangsan 创建 post
curl -s --location --request POST 'http://localhost:3000/api/posts' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data-raw '{
    "title":"Hello world",
    "content":"my first blog."
}' | jq .
{
  "data": {
    "id": 1,
    "title": "Hello world",
    "content": "my first blog.",
    "updatedAt": "2022-04-12T03:28:32.811Z",
    "createdAt": "2022-04-12T03:28:32.811Z",
    "createdById": 2
  }
}

# zhangsan 修改 post
curl -s --location --request PUT 'http://localhost:3000/api/posts/2' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $TOKEN" \
--data-raw '{
    "title":"Hi~"
}' | jq .
{
  "data": []
}

```
