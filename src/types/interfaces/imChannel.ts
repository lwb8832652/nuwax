/**
 * IM 机器人类型
 */
export enum IMChannelTypeEnum {
  /** 机器人 */
  Bot = 'bot',
  /** 应用 */
  App = 'app',
}

/**
 * IM 机器人状态
 */
export enum IMChannelStatusEnum {
  /** 启用 */
  Enabled = 1,
  /** 停用 */
  Disabled = 0,
}

/**
 * IM 机器人信息
 */
export interface IMChannelInfo {
  id: number;
  channel: string;
  targetType: string;
  targetId: number | string;
  agentId: number;
  agentName: string;
  enabled: boolean;
  configData: string;
  name: string;
  created: string;
  creatorId: number;
  creatorName: string;
  modified: string;
  modifiedId: number;
  modifiedName: string;
  agentIcon?: string;
  agentDescription?: string;
  outputMode?: string;
}

/**
 * 飞书机器人配置
 */
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  verificationToken: string;
  encryptKey: string;
}

/**
 * 钉钉机器人配置
 */
export interface DingtalkConfig {
  clientId: string;
  clientSecret: string;
  robotCode: string;
}

/**
 * 企业微信机器人配置
 */
export interface WeworkBotConfig {
  aibotId: string;
  corpId: string;
  token: string;
  encodingAesKey: string;
}

/**
 * 企业微信应用配置
 */
export interface WeworkAppConfig {
  agentId: string;
  corpId: string;
  corpSecret: string;
  token: string;
  encodingAesKey: string;
}

/**
 * QQ 官方机器人配置
 */
export interface QqConfig {
  botAppId: string;
  botToken: string;
  botId?: string;
}

/**
 * QQ 渠道 WebSocket 连接状态（后端单连接，同一平台下所有卡片共用）
 */
export interface QqChannelStatus {
  /** 客户端是否已启动 */
  running: boolean;
  /** WebSocket 是否已打开 */
  connected: boolean;
  /** 是否已鉴权成功（收到 READY） */
  authenticated: boolean;
  /** 是否存在已启用的 QQ 渠道配置 */
  hasEnabledConfig: boolean;
  /** 当前生效的机器人 AppID */
  botAppId?: string;
  /** QQ 网关下发的会话 ID */
  sessionId?: string;
  /** 最近一次收到网关消息的时间戳（毫秒） */
  lastEventAt?: number;
  /** 最近一次 WebSocket 打开的时间戳（毫秒） */
  lastConnectedAt?: number;
  /** 自启动以来的重连次数 */
  reconnectCount?: number;
  /** 最近一次错误信息 */
  lastError?: string;
  /** 当前订阅的 intent 位掩码 */
  intents?: number;
}

/**
 * 添加 IM 渠道配置参数
 */
export interface AddIMChannelParams {
  id?: number;
  channel: string; // feishu/dingtalk/wework
  targetType: string;
  agentId: number;
  enabled: boolean;
  configData: string; // JSON 字符串
  spaceId?: number;
  outputMode?: string;
}
