# roadmap

当前计划（2022-5-13）：

- 代码：
  - core: 使用 test/mockserver, 
    - 替代目前的测试相关逻辑
    - 使用 mockserver start，是否可行？是否启动 koa 相关端口？
    - 理解 mockserver 原理，总结使用文档
  - server plugins
    - notification, 测试是否可用，见相关test代码，是否已经可以发送通知邮件？是否能集成 password reset
    - systemSettings，继承扩展的可行性（collections增加字段,plugin覆盖install方法），意义重要，插件的扩招机制（如 users）
  - client，总结贯穿主要模块的体系，包括所需的知识点

- 部署：
  - 基于 npm package 的前后端项目(可扩展) docker build 发布（github）


---

旧计划，已调整（2022-4-14）:

- ~~collection，实现实体相关
- ~~acl，实现对 action 的 acl 授权控制
- swagger/open api，单独的 plugin，用于 api server 用户查看和测试 api
- action logging，部署 nocobase 自带的 plugin，测试怎么使用和是否正常使用
- ~~dockerfile，分阶段 build image，支持 install 和 start，注意进程退出问题，形成 docker compose file
- 业务插件的日志处理，abstract LoggingPlugin 供后续继承使用，使用 winston logging
- nocobase 自带日志的屏蔽处理，比如登录时控制台显示用户名和密码
- 基于 github action ci/cd，发布到 docker hub
- docker compose file 增加 watchtower/loki/grafana
