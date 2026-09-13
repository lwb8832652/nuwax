import Loading from '@/components/custom/Loading';
import { apiUpdateAgentSort } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import type {
  CategoryItemInfo,
  HomeAgentCategoryInfo,
} from '@/types/interfaces/agentConfig';
import type { DragEndEvent } from '@dnd-kit/core';
import { Affix, App } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { history, useRequest } from 'umi';
import AgentSection from './AgentSection';
import CategoryContainer from './CategoryContainer';
import {
  ERROR_MESSAGES,
  LOADING_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DraggableHomeContentProps {
  expertMarketplacePath?: string | null;
  /** 首页分类信息 */
  homeCategoryInfo: HomeAgentCategoryInfo;
  /** 当前激活的标签 */
  activeTab?: string;
  /** 标签点击事件 */
  onTabClick: (type: string) => void;
  /** 智能体点击事件 */
  onAgentClick: (agentInfo: CategoryItemInfo) => void;
  /** 收藏切换事件 */
  onToggleCollect: (type: string, info: CategoryItemInfo) => void;
  /** 数据更新回调 */
  onDataUpdate: () => void;
}

/**
 * 首页拖拽排序内容组件
 * 支持栏目和智能体的拖拽排序功能，支持分类左右滑动
 */
const DraggableHomeContent: React.FC<DraggableHomeContentProps> = ({
  expertMarketplacePath = '/square?cate_type=Agent',
  homeCategoryInfo,
  activeTab,
  onTabClick,
  onAgentClick,
  onToggleCollect,
  onDataUpdate,
}) => {
  const { message } = App.useApp();

  // 组件状态
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragHoverText, setDragHoverText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeSticky, setActiveSticky] = useState<boolean>(false);
  const categories = homeCategoryInfo?.categories || [];
  const selectedCategory = useMemo(
    () =>
      categories.find((category) => category.type === activeTab) ||
      categories[0],
    [activeTab, categories],
  );
  const selectedAgents = useMemo(
    () =>
      selectedCategory
        ? homeCategoryInfo?.categoryItems[selectedCategory.type] || []
        : [],
    [homeCategoryInfo?.categoryItems, selectedCategory],
  );

  // 更新排序API请求
  const { run: runUpdateSort } = useRequest(apiUpdateAgentSort, {
    manual: true,
    debounceInterval: 300,
    onBefore: () => {
      setIsUpdating(true);
    },
    onSuccess: () => {
      message.success(SUCCESS_MESSAGES.SORT_SUCCESS);
      onDataUpdate();
    },
    onError: () => {
      message.error(ERROR_MESSAGES.SORT_FAILED);
      onDataUpdate(); // 恢复原始数据
    },
    onFinally: () => {
      setIsUpdating(false);
    },
  });

  // 事件处理函数

  const handleMouseEnter = useCallback(
    (text: string) => {
      if (!isDragging) {
        setDragHoverText(text);
      }
    },
    [isDragging],
  );

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setDragHoverText('');
    }
  }, [isDragging]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // 处理分类拖拽结束
  const handleCategoryDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setIsDragging(false);
      setDragHoverText('');

      if (active.id !== over?.id && homeCategoryInfo?.categories) {
        const oldIndex = homeCategoryInfo.categories.findIndex(
          (item) => item.type === active.id,
        );
        const newIndex = homeCategoryInfo.categories.findIndex(
          (item) => item.type === over?.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const categoryTypes = homeCategoryInfo.categories.map(
            (cat) => cat.type,
          );
          const newCategoryTypes = [...categoryTypes];
          const [movedItem] = newCategoryTypes.splice(oldIndex, 1);
          newCategoryTypes.splice(newIndex, 0, movedItem);

          runUpdateSort(newCategoryTypes, undefined);
        }
      }
    },
    [homeCategoryInfo?.categories, runUpdateSort],
  );

  // 处理智能体拖拽结束
  const handleAgentDragEnd = useCallback(
    (categoryType: string, newAgents: CategoryItemInfo[]) => {
      const agentIds = newAgents.map((agent) => agent.targetId);
      runUpdateSort(undefined, { [categoryType]: agentIds });
    },
    [runUpdateSort],
  );

  // 跳转到广场页面
  const handleLinkToSquare = useCallback(() => {
    if (expertMarketplacePath) history.push(expertMarketplacePath);
  }, [expertMarketplacePath]);

  const isSelectedCategoryEmpty = !selectedCategory || !selectedAgents.length;

  // 渲染加载状态
  if (isUpdating) {
    return (
      <div className={cx('loading-container')}>
        <Loading />
        <span className={cx('loading-text')}>
          {LOADING_MESSAGES.UPDATING_SORT}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.draggableContainer}>
      <Affix
        target={() => document.getElementById('home-container')}
        offsetTop={0}
        className={cx(
          styles.stickyContainer,
          activeSticky ? styles.activeSticky : '',
        )}
        onChange={(result) => {
          setActiveSticky(result || false);
        }}
      >
        <div>
          {/*<Space className={styles.recommendContainer}>*/}
          {/*  <Typography.Title level={5} className={styles.recommendTitle}>*/}
          {/*    智能体推荐*/}
          {/*  </Typography.Title>*/}
          {/*  <span className={styles.recommendDesc}>*/}
          {/*    拖拽智能体卡片可交换位置*/}
          {/*  </span>*/}
          {/*</Space>*/}
          {/* 分类标签容器 */}
          <CategoryContainer
            categories={categories}
            activeCategory={selectedCategory?.type}
            dragHoverText={dragHoverText}
            onCategoryDragEnd={handleCategoryDragEnd}
            onTabClick={onTabClick}
            onDiscoverExperts={
              expertMarketplacePath ? handleLinkToSquare : undefined
            }
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onDragStart={handleDragStart}
          />
        </div>
      </Affix>

      {/* 内容区域 */}
      {isSelectedCategoryEmpty ? (
        <div className={cx(styles.emptyContainer)}>
          {expertMarketplacePath ? (
            <a
              href={expertMarketplacePath}
              onClick={(event) => {
                event.preventDefault();
                handleLinkToSquare();
              }}
              className={cx('empty-link')}
            >
              {dict('PC.Components.Newx.emptyExplore')} →
            </a>
          ) : (
            <span>{dict('PC.Common.Global.emptyData')}</span>
          )}
        </div>
      ) : (
        <div className={styles.contentContainer}>
          {selectedCategory && (
            <AgentSection
              key={selectedCategory.type}
              category={selectedCategory}
              agents={selectedAgents}
              dragHoverText={dragHoverText}
              onAgentClick={onAgentClick}
              onToggleCollect={onToggleCollect}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onAgentDragEnd={handleAgentDragEnd}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableHomeContent;
