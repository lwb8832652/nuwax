/**
 * enjoy-cloud 接口前缀适配测试
 */
import { describe, expect, it } from 'vitest';
import { rewriteEnjoyApiUrl } from '../src/utils/enjoyApiAdapter';

describe('rewriteEnjoyApiUrl', () => {
  it('管理端智能体接口加 /admin-api/ai 前缀', () => {
    expect(rewriteEnjoyApiUrl('/api/agent/list/1')).toBe(
      '/admin-api/ai/agent/list/1',
    );
    expect(rewriteEnjoyApiUrl('/api/agent/conversation/chat')).toBe(
      '/admin-api/ai/agent/conversation/chat',
    );
    expect(rewriteEnjoyApiUrl('/api/temp/chat/create')).toBe(
      '/admin-api/ai/temp/chat/create',
    );
  });

  it('管理后台 /api/system/* 映射到 /admin-api/ai/manage/*', () => {
    expect(rewriteEnjoyApiUrl('/api/system/resource/agent/list')).toBe(
      '/admin-api/ai/manage/agent/list',
    );
    expect(rewriteEnjoyApiUrl('/api/system/resource/knowledge/1')).toBe(
      '/admin-api/ai/manage/knowledge/1',
    );
    expect(rewriteEnjoyApiUrl('/api/system/display/recommend/list')).toBe(
      '/admin-api/ai/manage/recommend/list',
    );
    expect(rewriteEnjoyApiUrl('/api/system/task/list')).toBe(
      '/admin-api/ai/manage/task/list',
    );
    expect(rewriteEnjoyApiUrl('/api/system/userAgent/message/count')).toBe(
      '/admin-api/ai/manage/message/count',
    );
  });

  it('开放端 /api/v1/** 映射到 /app-api/ai/v1/**', () => {
    expect(rewriteEnjoyApiUrl('/api/v1/chat')).toBe('/app-api/ai/v1/chat');
    expect(rewriteEnjoyApiUrl('/api/v1/4sandbox/agent')).toBe(
      '/app-api/ai/v1/4sandbox/agent',
    );
  });

  it('知识库精度测试映射到管理端', () => {
    expect(
      rewriteEnjoyApiUrl('/api/knowledge/accuracytest/history?kbId=1'),
    ).toBe('/admin-api/ai/knowledge/accuracytest/history?kbId=1');
  });

  it('站内通知映射到管理端', () => {
    expect(rewriteEnjoyApiUrl('/api/notify/event/collect/batch')).toBe(
      '/admin-api/ai/notify/event/collect/batch',
    );
    expect(rewriteEnjoyApiUrl('/api/notify/message/unread/count')).toBe(
      '/admin-api/ai/notify/message/unread/count',
    );
  });

  it('默认图标映射到开放端', () => {
    expect(rewriteEnjoyApiUrl('/api/logo/knowledge/111')).toBe(
      '/app-api/ai/logo/knowledge/111',
    );
    expect(rewriteEnjoyApiUrl('/api/logo/workflow/ZLK-测试')).toBe(
      '/app-api/ai/logo/workflow/ZLK-测试',
    );
  });

  it('未迁移模块保持原路径', () => {
    expect(rewriteEnjoyApiUrl('/api/user/getLoginInfo')).toBe(
      '/api/user/getLoginInfo',
    );
    expect(rewriteEnjoyApiUrl('/api/custom-page/keepalive')).toBe(
      '/api/custom-page/keepalive',
    );
    expect(rewriteEnjoyApiUrl('/api/custom-page/keepalive')).toBe(
      '/api/custom-page/keepalive',
    );
  });

  it('非 /api/ 前缀保持不变', () => {
    expect(rewriteEnjoyApiUrl('/admin-api/system/auth/login')).toBe(
      '/admin-api/system/auth/login',
    );
    expect(rewriteEnjoyApiUrl('')).toBe('');
  });
});
