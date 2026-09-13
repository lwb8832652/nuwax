import { Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';

import ConversationItem from './components/ConversationItem';
import EmptyState from './components/EmptyState';

import { EVENT_TYPE } from '@/constants/event.constants';
import { apiAgentConversationList } from '@/services/agentConfig';
import { TaskStatus } from '@/types/enums/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import styles from './index.less';

const cx = classNames.bind(styles);

const ITEM_HEIGHT = 48;

const componentCache = {
  list: null as ConversationInfo[] | null,
  hasMore: true,
  scrollTop: 0,
};

const NewHomeSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { id: chatIdParam } = useParams();
  const location = useLocation();
  const chatId =
    chatIdParam || location.pathname.match(/\/home\/chat\/([^/]+)/)?.[1];

  const { handleCloseMobileMenu } = useModel('layout');
  const [localList, setLocalList] = useState<ConversationInfo[]>(
    componentCache.list || [],
  );
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    componentCache.list ? componentCache.hasMore : true,
  );
  const [scrollThumb, setScrollThumb] = useState({
    visible: false,
    offset: 0,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listInnerRef = useRef<HTMLDivElement>(null);
  const clearScrollThumbDragRef = useRef<(() => void) | undefined>();
  const initializedRef = useRef(false);
  const pageSizeRef = useRef(20);
  const loadingRef = useRef(false);

  const calcPageSize = useCallback(() => {
    const height = scrollContainerRef.current?.clientHeight ?? 0;
    if (!height) return 20;
    const count = Math.ceil(height / ITEM_HEIGHT);
    return Math.max(count, 10);
  }, []);

  // Keep the prototype's quiet three-pixel scroll indicator while retaining
  // the native scroll container for touch, wheel, and keyboard interaction.
  const updateScrollThumb = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { clientHeight, scrollHeight, scrollTop } = container;
    const overflow = scrollHeight > clientHeight + 1;
    const scrollRange = Math.max(0, scrollHeight - clientHeight);
    const offset = scrollRange
      ? (scrollTop / scrollRange) * Math.max(0, clientHeight - 34)
      : 0;

    setScrollThumb((previous) => {
      if (
        previous.visible === overflow &&
        Math.abs(previous.offset - offset) < 0.1
      ) {
        return previous;
      }
      return { visible: overflow, offset };
    });
  }, []);

  const handleScrollThumbPointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    event.preventDefault();
    clearScrollThumbDragRef.current?.();

    const { clientHeight, scrollHeight, scrollTop } = container;
    const scrollRange = scrollHeight - clientHeight;
    const thumbTravel = Math.max(0, clientHeight - 34);
    if (scrollRange <= 0 || thumbTravel <= 0) return;

    const startY = event.clientY;
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const nextScrollTop = scrollTop + (delta / thumbTravel) * scrollRange;
      container.scrollTop = Math.max(0, Math.min(scrollRange, nextScrollTop));
    };
    const clearDrag = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', clearDrag);
      window.removeEventListener('pointercancel', clearDrag);
      clearScrollThumbDragRef.current = undefined;
    };

    clearScrollThumbDragRef.current = clearDrag;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', clearDrag);
    window.addEventListener('pointercancel', clearDrag);
  };

  const loadList = useCallback(
    async (isRefresh = false, options?: { silent?: boolean }) => {
      if (loadingRef.current || (!hasMore && !isRefresh)) return;
      loadingRef.current = true;
      if (!options?.silent) {
        setLoading(true);
      }

      const pageSize = isRefresh ? calcPageSize() : pageSizeRef.current;
      if (isRefresh) pageSizeRef.current = pageSize;
      const lastId = isRefresh
        ? null
        : localList.length > 0
        ? localList[localList.length - 1].id
        : null;

      try {
        const res = await apiAgentConversationList({
          agentId: null,
          lastId,
          limit: pageSize,
        });

        const data = res.data ?? [];
        if (isRefresh) {
          setLocalList(data);
        } else {
          setLocalList((prev) => {
            const merged = [...prev, ...data];
            const unique: ConversationInfo[] = [];
            const seen = new Set();
            for (const item of merged) {
              if (item && item.id !== undefined && item.id !== null) {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  unique.push(item);
                }
              } else {
                unique.push(item);
              }
            }
            return unique;
          });
        }
        setHasMore(data.length >= pageSize);
      } finally {
        loadingRef.current = false;
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [hasMore, localList, calcPageSize],
  );

  const loadListRef = useRef(loadList);
  useEffect(() => {
    loadListRef.current = loadList;
  }, [loadList]);

  const stateRef = useRef({ localList, hasMore });
  stateRef.current = { localList, hasMore };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (componentCache.list) {
        loadList(true, { silent: true });
        setTimeout(() => {
          if (scrollContainerRef.current && componentCache.scrollTop) {
            scrollContainerRef.current.scrollTop = componentCache.scrollTop;
          }
          updateScrollThumb();
        }, 0);
      } else {
        loadList(true);
      }
    }

    return () => {
      componentCache.list = stateRef.current.localList;
      componentCache.hasMore = stateRef.current.hasMore;
      if (scrollContainerRef.current) {
        componentCache.scrollTop = scrollContainerRef.current.scrollTop;
      }
    };
  }, []);

  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (!initializedRef.current) return;

    const isHomeRoute = location.pathname.startsWith('/home');
    const wasHomeRoute = prevPathnameRef.current.startsWith('/home');

    if (location.pathname === '/home') {
      // 点击菜单回到首页，静默更新并回到顶部
      loadListRef.current(true, { silent: true });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else if (isHomeRoute && !wasHomeRoute) {
      // 从其他页面（如 /space）切回到 /home/chat 页面，即使组件未销毁也应当静默更新一次
      loadListRef.current(true, { silent: true });
    }

    prevPathnameRef.current = location.pathname;
  }, [location.pathname, location.state]);

  useEffect(() => {
    const handleConversationUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{
        id: number;
        topic: string;
        icon?: string;
      }>;
      if (!customEvent.detail) return;
      const { id, topic, icon } = customEvent.detail;
      setLocalList((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              topic,
              icon,
            };
          }
          return item;
        }),
      );
    };

    const handleConversationDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: number }>;
      if (!customEvent.detail) return;
      const { id } = customEvent.detail;
      setLocalList((prev) => prev.filter((item) => item.id !== id));
    };

    const handleRefreshConversationList = () => {
      loadListRef.current(true, { silent: true });
    };

    const handleUpdateConversationListTaskStatus = ({
      conversationId,
      taskStatus,
    }: {
      conversationId: number | string;
      taskStatus: TaskStatus;
    }) => {
      setLocalList((prev) =>
        prev.map((item) =>
          item.id?.toString() === conversationId.toString()
            ? { ...item, taskStatus }
            : item,
        ),
      );
    };

    const handleChatFinished = (data: {
      conversationId: number | string;
      status: TaskStatus;
    }) => {
      if (!data) return;
      const { conversationId, status } = data;
      setLocalList((prev) =>
        prev.map((item) =>
          item.id?.toString() === conversationId.toString()
            ? { ...item, taskStatus: status }
            : item,
        ),
      );
    };

    window.addEventListener('conversation-updated', handleConversationUpdated);
    window.addEventListener('conversation-deleted', handleConversationDeleted);
    eventBus.on(
      EVENT_TYPE.RefreshConversationList,
      handleRefreshConversationList,
    );
    eventBus.on(
      EVENT_TYPE.UpdateConversationListTaskStatus,
      handleUpdateConversationListTaskStatus,
    );
    eventBus.on(EVENT_TYPE.ChatFinished, handleChatFinished);

    return () => {
      window.removeEventListener(
        'conversation-updated',
        handleConversationUpdated,
      );
      window.removeEventListener(
        'conversation-deleted',
        handleConversationDeleted,
      );
      eventBus.off(
        EVENT_TYPE.RefreshConversationList,
        handleRefreshConversationList,
      );
      eventBus.off(
        EVENT_TYPE.UpdateConversationListTaskStatus,
        handleUpdateConversationListTaskStatus,
      );
      eventBus.off(EVENT_TYPE.ChatFinished, handleChatFinished);
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollThumb();
      if (loading || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        loadList();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(updateScrollThumb);
    resizeObserver?.observe(container);
    if (listInnerRef.current) resizeObserver?.observe(listInnerRef.current);
    window.addEventListener('resize', updateScrollThumb);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScrollThumb);
    };
  }, [loading, hasMore, loadList, localList.length, updateScrollThumb]);

  useEffect(
    () => () => clearScrollThumbDragRef.current?.(),
    [],
  );

  const handleConversationClick = (item: ConversationInfo) => {
    handleCloseMobileMenu();
    const { id, agentId, devTargetType, devTargetId, devSpaceId } = item;

    if (devTargetType === 'Agent' && devSpaceId && id) {
      history.push(
        `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`,
      );
    } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
      history.push(`/space/${devSpaceId}/app-dev/${devTargetId}`);
    } else {
      history.push('/home/chat/' + id + '/' + agentId);
    }
  };

  // const noMoreText = dict('PC.Components.HistoryConversationList.noMore');

  return (
    <div style={style} className={cx(styles['new-home-section'])}>
      {/* 会话记录列表 */}
      <div className={cx(styles['conversation-list-shell'])}>
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="会话记录"
          className={cx(styles['conversation-list-wrapper'])}
        >
          {!loading && localList.length === 0 && <EmptyState />}

          <div ref={listInnerRef} className={cx(styles['conversation-list'])}>
            {localList.map((item) => (
              <ConversationItem
                key={item.id}
                item={item}
                isActive={chatId === item.id?.toString()}
                onClick={() => handleConversationClick(item)}
              />
            ))}

            {loading && (
              <div className={cx(styles['load-more'])}>
                <Spin size="small" />
              </div>
            )}
            {/* {!loading && !hasMore && localList.length > 0 && (
              <div className={cx(styles['no-more'])}>
                <Typography.Text type="secondary">{noMoreText}</Typography.Text>
              </div>
            )} */}
          </div>
        </div>
        {scrollThumb.visible && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="滚动会话记录"
            className={cx(styles['conversation-scroll-thumb'])}
            style={{ transform: `translateY(${scrollThumb.offset}px)` }}
            onPointerDown={handleScrollThumbPointerDown}
          />
        )}
      </div>
    </div>
  );
};

export default NewHomeSection;
