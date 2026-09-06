/** ttyd 终端 WebSocket 子协议 */
export const TTYD_TERMINAL_WS_SUBPROTOCOLS = ['tty'] as const;

/** ttyd 终端 wire 协议 */
export const TTYD_TERMINAL_WIRE_PROTOCOL = 'ttyd' as const;

/** 本地 ttyd 联调默认地址（缺少 tenant/computer 时回退） */
const DEV_TTYD_WS_FALLBACK = (conversationId: number) =>
  `wss://testagent.xspaceagi.com/computer/terminal/${conversationId}/ws`;

/**
 * 将 http(s)/ws(s) 基础地址规范化为 WebSocket URL
 */
export function normalizeTerminalWsUrl(base: string): string {
  try {
    const u = new URL(base);
    const wsScheme =
      u.protocol === 'https:'
        ? 'wss:'
        : u.protocol === 'http:'
        ? 'ws:'
        : u.protocol;
    const path = u.pathname === '/' || u.pathname === '' ? '/ws' : u.pathname;
    return `${wsScheme}//${u.host}${path}`;
  } catch {
    return base || '';
  }
}

/**
 * 解析后端入口地址
 * - 配置了 BASE_URL 时（跨域联调 / dev 包独立部署）用 BASE_URL
 * - 未配置时回落到当前页面地址（同源部署，如 production）
 */
function resolveBackendOrigin(): string {
  const base = process.env.BASE_URL;
  if (base) {
    return base;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

/**
 * 构建 ttyd 终端 WebSocket 地址
 * @param conversationId 会话 ID
 */
export function buildTtydTerminalWsUrl(conversationId?: number): string {
  if (!conversationId) {
    return '';
  }

  const origin = resolveBackendOrigin();
  if (!origin) {
    return normalizeTerminalWsUrl(DEV_TTYD_WS_FALLBACK(conversationId));
  }

  try {
    const u = new URL(origin);
    const wsScheme = u.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeTerminalWsUrl(
      `${wsScheme}://${u.host}/computer/terminal/${conversationId}/ws`,
    );
  } catch {
    return normalizeTerminalWsUrl(DEV_TTYD_WS_FALLBACK(conversationId));
  }
}
