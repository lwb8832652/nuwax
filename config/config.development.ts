import { defineConfig } from 'umi';

export default defineConfig({
  define: {
    // 默认留空 => API 请求走同源（本地 dev：localhost:3000，由下面 proxy 转发到源码后端 8081）。
    // 必须留空（与 config.production.ts 一致）：只有同源，后端下发的 ticket Cookie 才能被浏览器保存，
    // <img>/<a> 这类由浏览器直接发起的请求才会自动带上 Cookie 通过鉴权。
    // 若填 http://localhost:8081 则为跨域，Cookie 在 http 下无法保存，图片会一直 401 加载失败。
    //
    // 打 dev 站点(110.42.41.113:8000)的部署包时，用环境变量覆盖指向后端反代入口：
    //   NUX_DEV_API_BASE=http://110.42.41.113:6443 pnpm build:dev
    // 此时页面与 API 跨源，前端会通过 syncTicketCookie 把 token 写成 ticket Cookie 保证资源鉴权。
    'process.env.BASE_URL': process.env.NUX_DEV_API_BASE || '',
  },
  proxy: {
    '/api': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
  },
  hash: true,
});
