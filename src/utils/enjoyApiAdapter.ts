/**
 * enjoy-cloud 接口前缀适配
 *
 * 迁移后后端前缀：
 *   管理端 /api/**     -> /admin-api/ai/**
 *   开放端 /api/v1/**  -> /app-api/ai/v1/**
 *
 * 仅重写已迁移到 enjoy-module-ai 的前缀，其余（如 /api/user/**、/api/notify/**）保持不变。
 */

const API_PREFIX_REWRITE_RULES: Array<[RegExp, string]> = [
  // 默认图标（img src 直接访问，无需鉴权）
  [/^\/api\/logo\//, '/app-api/ai/logo/'],
  // 文件下载（旧路径 /api/file/{id} → 新文件接口）
  [/^\/api\/file\//, '/app-api/ai/file/'],
  // 二维码生成（img 直接访问）
  [/^\/api\/qr\//, '/app-api/ai/qr/'],
  // 前端基础数据（i18n/租户配置/空间列表），迁移后由 /ai/base 提供
  [/^\/api\/i18n\/query/, '/admin-api/ai/base/i18n/query'],
  [/^\/api\/tenant\/config/, '/admin-api/ai/base/tenant/config'],
  [/^\/api\/space\/list/, '/admin-api/ai/base/space/list'],
  // 站内通知与事件轮询（需登录态）
  [/^\/api\/notify\//, '/admin-api/ai/notify/'],
  // 开放端（沙箱回调、开放 API）
  [/^\/api\/v1\/4sandbox\//, '/app-api/ai/v1/4sandbox/'],
  [/^\/api\/v1\//, '/app-api/ai/v1/'],
  // 管理后台（nuwax /api/system/* 统一映射到 /admin-api/ai/manage/*）
  [
    /^\/api\/system\/resource\/(agent|workflow|plugin|skill|mcp|page|table|knowledge|space)(\/|$)/,
    '/admin-api/ai/manage/$1$2',
  ],
  [
    /^\/api\/system\/display\/recommend(\/|$)/,
    '/admin-api/ai/manage/recommend$1',
  ],
  [/^\/api\/system\/task(\/|$)/, '/admin-api/ai/manage/task$1'],
  [
    /^\/api\/system\/userAgent\/message(\/|$)/,
    '/admin-api/ai/manage/message$1',
  ],
  [/^\/api\/system\/stats(\/|$)/, '/admin-api/ai/manage/stats$1'],
  [/^\/api\/system\/model(\/|$)/, '/admin-api/ai/manage/model$1'],
  [/^\/api\/system\/publish(\/|$)/, '/admin-api/ai/manage/publish$1'],
  // 知识库精度测试（已迁移到管理端）
  [
    /^\/api\/knowledge\/accuracytest(\/|$)/,
    '/admin-api/ai/knowledge/accuracytest$1',
  ],
  // 智能体业务（/api/agent|workflow|plugin|skill|... -> /admin-api/ai/*）
  [
    /^\/api\/(agent|assistant|code|component|computer|git|home|model|plugin|project|publish|published|display\/recommend|resource\/group|skill|task|temp\/chat|template|user\/agent|workflow)(\/|$)/,
    '/admin-api/ai/$1$2',
  ],
];

/**
 * 按规则重写接口路径（未命中规则时原样返回）
 */
export const rewriteEnjoyApiUrl = (url: string): string => {
  if (!url || !url.startsWith('/api/')) {
    return url;
  }
  for (const [pattern, replacement] of API_PREFIX_REWRITE_RULES) {
    if (pattern.test(url)) {
      return url.replace(pattern, replacement);
    }
  }
  return url;
};

/**
 * 获取租户标识：优先读取本地存储，缺省为 1（与后端 tenant-id 头一致）
 */
export const getEnjoyTenantId = (): string => {
  if (typeof localStorage === 'undefined') {
    return '1';
  }
  return (
    localStorage.getItem('tenant-id') ||
    localStorage.getItem('tenantId') ||
    localStorage.getItem('TENANT_ID') ||
    '1'
  );
};
