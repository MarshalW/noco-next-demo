# noco next demo

演示如何简单的使用 nocobase 服务器端。

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



```


