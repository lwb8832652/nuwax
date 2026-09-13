import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { t } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import MentionPopup from '../MentionPopup';
import type { MentionItem } from '../MentionPopup/types';
import styles from '../index.less';

const cx = classNames.bind(styles);

export type MentionPlacement = 'auto' | 'up' | 'down';

export interface AtMentionIconProps {
  /** 是否允许打开资源选择器 */
  enableMention: boolean;
  /** 是否显示资源选择器入口；工作台可在无资源时显示真实空态 */
  showResourceMention?: boolean;
  /** 是否允许从技能库选择，保留 allowAtSkill 的权限语义 */
  enableSkillMention?: boolean;
  /** @ 弹窗展示方向 */
  mentionPlacement: MentionPlacement;
  /** 是否开启订阅功能（租户配置） */
  enableSubscription?: boolean;
  /** 将选中的提及项插入到输入编辑器 */
  onSelectMention: (item: MentionItem) => void;
  /** 可用值:PageApp,TaskAgent */
  usageScenarios?: AgentTypeEnum[];
  /** 是否禁用（置灰且不可点击） */
  disabled?: boolean;
  /** 当前会话可手动启用的资源 */
  manualComponents?: AgentManualComponentInfo[];
  /** 当前已经启用的手动组件 */
  selectedComponentList?: AgentSelectedComponentInfo[];
}

/**
 * 底部 @ 图标触发的提及弹窗（与 MentionEditor 内部 @ 弹窗保持一致的定位规则）
 *
 * - 向下使用 `top`；向上使用 `bottom`
 * - 监听 `window.resize`，弹窗位置随视口变化同步更新
 * - 点击弹窗外部关闭
 */
const AtMentionIcon: React.FC<AtMentionIconProps> = ({
  enableMention,
  showResourceMention = enableMention,
  enableSkillMention = enableMention,
  mentionPlacement,
  enableSubscription = false,
  onSelectMention,
  usageScenarios,
  disabled = false,
  manualComponents,
  selectedComponentList,
}) => {
  // 是否显示提及弹窗
  const [atIconShowMentionPopup, setAtIconShowMentionPopup] =
    useState<boolean>(false);
  // 弹窗位置（向下用 top，向上用 bottom）
  const [atIconMentionPosition, setAtIconMentionPosition] = useState<{
    top?: number;
    left: number;
    bottom?: number;
  }>({ top: 0, left: 0 });
  const [atIconMentionMaxHeight, setAtIconMentionMaxHeight] = useState<
    number | undefined
  >();

  // 控制底部 @ 图标 Tooltip 显隐（避免弹窗关闭时 tooltip 又冒出来）
  const [mentionTooltipOpen, setMentionTooltipOpen] = useState<boolean>(false);
  // 标记用户是否已经使用过底部 @ 图标，使用过后不再展示引导 Tooltip
  const [hasUsedMentionIcon, setHasUsedMentionIcon] = useState<boolean>(false);

  // 底部 @ 图标引用（用于定位弹窗）
  const mentionIconRef = useRef<HTMLButtonElement | null>(null);

  // 与 MentionPopup 的实际 CSS 尺寸保持一致，用于在窄屏时准确收边。
  const POPUP_MAX_HEIGHT = 400;
  const POPUP_WIDTH = 360;
  const margin = 8;

  const calcAndSetAtIconMentionPosition = useCallback(
    (rect: DOMRect) => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth || 0;

      let finalPlacement: 'up' | 'down' = 'down';
      if (mentionPlacement === 'auto') {
        const spaceBelow = viewportHeight - rect.bottom;
        finalPlacement = spaceBelow >= POPUP_MAX_HEIGHT ? 'down' : 'up';
      } else {
        finalPlacement = mentionPlacement;
      }

      const popupWidth = Math.min(
        POPUP_WIDTH,
        Math.max(0, viewportWidth - margin * 2),
      );
      const left = Math.min(
        Math.max(margin, rect.left),
        Math.max(margin, viewportWidth - popupWidth - margin),
      );

      if (finalPlacement === 'down') {
        const availableHeight = Math.max(
          96,
          Math.min(POPUP_MAX_HEIGHT, viewportHeight - rect.bottom - margin),
        );
        let top = rect.bottom + 4;
        const maxTop = viewportHeight - availableHeight - margin;
        if (top > maxTop) top = Math.max(margin, maxTop);
        setAtIconMentionMaxHeight(availableHeight);
        setAtIconMentionPosition({ left, top });
      } else {
        const availableHeight = Math.max(
          96,
          Math.min(POPUP_MAX_HEIGHT, rect.top - margin),
        );
        // up：固定弹窗底边贴近图标上方 4px，并进行 clamp
        const bottomCss = viewportHeight - (rect.top - 4);
        setAtIconMentionMaxHeight(availableHeight);
        setAtIconMentionPosition({ left, bottom: bottomCss });
      }
    },
    [mentionPlacement],
  );

  /**
   * 关闭提及弹窗
   */
  const closeAtIconMentionPopup = useCallback(() => {
    setAtIconShowMentionPopup(false);
    // 同步关闭底部 @ 图标的 Tooltip，避免弹窗关闭时 Tooltip 重新出现
    setMentionTooltipOpen(false);
    setHasUsedMentionIcon(false);
  }, []);

  /**
   * 选择提及项：关弹窗 + 写入编辑器
   */
  const handleAtIconMentionSelect = useCallback(
    (item: MentionItem) => {
      setAtIconShowMentionPopup(false);
      setHasUsedMentionIcon(false);
      onSelectMention(item);
    },
    [onSelectMention],
  );

  /**
   * 点击底部 @ 图标：打开 MentionPopup 并将弹窗锚定到图标附近
   */
  const handleMentionIconClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // 若禁用则不做任何事
      if (disabled || !showResourceMention) {
        closeAtIconMentionPopup();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // 点击后立刻关闭 Tooltip
      setMentionTooltipOpen(false);
      // 用户已经主动点击使用过一次，之后不再展示引导 Tooltip
      setHasUsedMentionIcon(true);

      const iconEl = mentionIconRef.current;
      if (iconEl) {
        const rect = iconEl.getBoundingClientRect();
        calcAndSetAtIconMentionPosition(rect);
      }

      setAtIconShowMentionPopup(true);
    },
    [
      showResourceMention,
      disabled,
      closeAtIconMentionPopup,
      calcAndSetAtIconMentionPosition,
    ],
  );

  /**
   * 点击外部区域关闭弹窗
   */
  useEffect(() => {
    // 若禁用或弹窗未显示，则不执行
    if (!showResourceMention || !atIconShowMentionPopup) {
      return;
    }

    // 点击外部区域关闭弹窗
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 点击在弹窗本体内部（含 Tab、列表、空白）不关闭
      if (target?.closest?.('[data-mention-popup]')) {
        return;
      }
      // 点击在弹窗外部，关闭弹窗
      closeAtIconMentionPopup();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResourceMention, atIconShowMentionPopup, closeAtIconMentionPopup]);

  /**
   * 窗口大小变化时，同步更新底部 @ 弹窗位置
   */
  useEffect(() => {
    if (!atIconShowMentionPopup) return;

    const handleReposition = () => {
      const iconEl = mentionIconRef.current;
      if (!iconEl) return;
      const rect = iconEl.getBoundingClientRect();
      calcAndSetAtIconMentionPosition(rect);
    };

    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('resize', handleReposition);
    };
  }, [atIconShowMentionPopup, calcAndSetAtIconMentionPosition]);

  const tooltipTitle = useMemo(
    () =>
      hasUsedMentionIcon
        ? ''
        : t('PC.Components.ChatInputHomeAtMentionIcon.tryMentionResource'),
    [hasUsedMentionIcon],
  );

  if (!showResourceMention) return null;

  return (
    <>
      <Tooltip
        title={tooltipTitle}
        open={mentionTooltipOpen && !atIconShowMentionPopup}
        onOpenChange={setMentionTooltipOpen}
      >
        {/* 底部 @ 图标 */}
        <button
          type="button"
          ref={mentionIconRef}
          data-resource-mention-trigger=""
          aria-label={t(
            'PC.Components.ChatInputHomeAtMentionIcon.tryMentionResource',
          )}
          aria-haspopup="dialog"
          aria-expanded={atIconShowMentionPopup}
          disabled={disabled}
          className={cx(
            'flex',
            'items-center',
            'content-center',
            'cursor-pointer',
            styles.clear,
            styles.box,
            styles['plus-box'],
            { [styles['upload-box-disabled']]: disabled },
          )}
          onClick={handleMentionIconClick}
        >
          @
        </button>
      </Tooltip>

      {/* @提及技能选择弹窗 */}
      <MentionPopup
        visible={atIconShowMentionPopup}
        position={atIconMentionPosition}
        onSelect={handleAtIconMentionSelect}
        enableSubscription={enableSubscription}
        enableSkillMention={enableSkillMention}
        onClose={closeAtIconMentionPopup}
        showSearchInput={true}
        maxHeight={atIconMentionMaxHeight}
        usageScenarios={usageScenarios}
        manualComponents={manualComponents}
        selectedComponentList={selectedComponentList}
      />
    </>
  );
};

export default AtMentionIcon;
