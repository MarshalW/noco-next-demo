# roadmap

路线图：

- collection，实现实体相关
- acl，实现对 action 的 acl 授权控制
- swagger/open api，单独的 plugin，用于 api server 用户查看和测试 api
- action logging，部署 nocobase 自带的 plugin，测试怎么使用和是否正常使用
- dockerfile，分阶段 build image，支持 install 和 start，注意进程退出问题，形成 docker compose file
- 业务插件的日志处理，abstract LoggingPlugin 供后续继承使用，使用 winston logging
- nocobase 自带日志的屏蔽处理，比如登录时控制台显示用户名和密码
- 基于 github action ci/cd，发布到 docker hub
- docker compose file 增加 watchtower/loki/grafana
