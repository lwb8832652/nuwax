import { ACCESS_TOKEN } from '@/constants/home.constants';

/**
 * 把 localStorage 中的登录票据同步为名为 ticket 的 Cookie。
 *
 * 后端 AuthInterceptor 优先读取 Cookie 中的 ticket 作为登录凭证；而 <img>/<a> 这类由浏览器
 * 直接发起的资源请求不会携带前端手动附加的 Authorization 头，只能依赖 Cookie。
 * 仅当页面源与 API 源不一致（跨域部署，如 dev 站点页面在 :8000、API 走 :6443）时才需要手动
 * 同步；同源部署（BASE_URL 为空）时登录接口下发的 HttpOnly Set-Cookie 已覆盖所有请求，且 JS
 * 不应覆盖 HttpOnly Cookie，故直接跳过。
 *
 * 注意：生产 bundle 里 NODE_ENV 恒为 production，不能用 NODE_ENV 判断是否执行，
 * 必须按“源是否跨域”判断，才能把同步逻辑打进 max build 产物。
 */
export function syncTicketCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const apiOrigin = process.env.BASE_URL || '';
  if (!apiOrigin || apiOrigin === window.location.origin) {
    return;
  }
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    document.cookie = `ticket=${token}; path=/; max-age=86400`;
  }
}
