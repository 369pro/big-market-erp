# big-market-erp

这是 LLM Market 运营后台，基于 [Ant Design Pro](https://pro.ant.design) 和 Umi Max 构建，提供用户抽奖订单查询、活动详情查看及活动上下架等运营页面。

## 技术依赖、来源与许可证

- Umi Max `^4.1.1`、Ant Design Pro `6.0.0`、React `^18.2.0`、Ant Design `^5.13.2`。
- TypeScript `^5.3.3`、Ant Design Pro CLI `^3.3.0`、Jest `^29.7.0`。
- `package.json` 声明 Node.js `>=12.0.0`；仓库同时包含 `package-lock.json` 和 `pnpm-lock.yaml`，本 README 的命令统一使用 npm。
- 本项目原始来源是 [Ant Design Pro](https://pro.ant.design)，官方文档见 [Ant Design Pro 文档](https://pro.ant.design/docs)；原 README 中的来源说明和官方 GitHub 入口保留在本文末尾。
- 当前 `package.json` 没有声明 `license` 字段，仓库根目录也没有发现 `LICENSE`/`COPYING` 文件；本文不新增许可证承诺，使用和再发布前请按项目所有者的授权约定确认。

## 环境变量与配置

仓库当前没有 `.env.example`，前端代码也没有读取数据库密码、支付密钥等浏览器端 secret。`config/config.ts` 读取的环境变量是 `REACT_APP_ENV`，未设置时默认为 `dev`；现有脚本会按环境设置它：

```text
REACT_APP_ENV=dev
```

这只是无密钥的环境标识，不是密钥模板。`config/proxy.ts` 只为 `test` 和 `pre` 提供代理配置：`test` 指向 `https://proapi.azurewebsites.net`，`pre` 仍是占位地址 `your pre url`。开发环境没有启用该代理配置，不能把占位地址直接用于部署。

## 后端依赖与 API 地址

运营业务接口在 `src/services/api.ts` 和 `src/services/activity.ts` 中使用固定地址 `http://127.0.0.1:8098`，包括：

- `/api/v1/raffle/erp/query_user_raffle_order`
- `/api/v1/raffle/erp/query_user_raffle_order_page`
- `/api/v1/raffle/erp/query_raffle_activity_stage_list`
- `/api/v1/raffle/erp/query_activity_detail`
- `/api/v1/raffle/erp/update_stage_activity_2_active`
- `/api/v1/raffle/erp/update_stage_activity_state`

因此本地运行前必须先准备对应的大市场后端服务并监听 `8098`。这些业务请求使用绝对 URL，不会经过 Umi 的 `/api` 开发代理。项目生成的示例服务仍使用相对路径 `/api/*`；`config/proxy.ts` 中的代理仅在对应 `REACT_APP_ENV` 下生效。

生产构建后代理配置不会生效，这是仓库 `config/proxy.ts` 的明确说明。更重要的是，浏览器会把 `127.0.0.1:8098` 解释为用户自己的机器；上线前必须将业务 API 地址配置化或改为浏览器可访问的域名，并同时处理 CORS/反向代理，当前仓库没有可直接填写的 API host 环境变量。

## 安装与本地开发

```bash
npm install
npm run dev
```

`npm run dev` 对应 `REACT_APP_ENV=dev MOCK=none UMI_ENV=dev max dev`，开发脚本没有在 `package.json` 中显式固定端口；以 Umi 启动日志显示的端口为准。仓库的预览脚本明确使用 `8000` 端口。

## 构建、预览与检查

```bash
# 生产构建，产物输出到 dist/
npm run build

# 构建并使用 Umi 预览，脚本固定端口 8000
npm run preview

# 代码检查
npm run lint
npm run tsc

# 单元测试
npm test
```

`npm run start` 是开发模式别名，不是生产启动命令；`npm run preview` 会先执行构建，再运行 `max preview --port 8000`。生产环境建议由 Nginx 或其他静态文件服务器托管 `dist/`，并将后端 API 通过可访问域名或同源网关提供。不要把后端凭据、用户 token 或其他 secret 写入前端环境变量和构建产物。

## 原始资料

- [Ant Design Pro 官方网站](https://pro.ant.design)
- [Ant Design Pro 文档](https://pro.ant.design/docs)
- [Ant Design Pro GitHub](https://github.com/ant-design/ant-design-pro)
