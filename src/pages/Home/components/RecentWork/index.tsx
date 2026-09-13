import agentImage from '@/assets/images/agent_image.png';
import { apiAgentConversationList } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const RecentWork: React.FC<{ canEdit?: boolean }> = ({ canEdit = false }) => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [showEdits, setShowEdits] = useState(false);
  const { editAgentList, runEdit } = useModel('devCollectAgent');
  const isShowingEdits = canEdit && showEdits;

  useEffect(() => {
    if (isShowingEdits) runEdit({ size: 5 });
  }, [isShowingEdits]);

  useEffect(() => {
    let active = true;

    apiAgentConversationList({ agentId: null, lastId: null, limit: 3 })
      .then(({ data }) => {
        if (active) setConversations(data || []);
      })
      .catch(() => {
        // The workspace remains usable if recent history cannot be loaded.
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpen = (item: ConversationInfo) => {
    const { id, agentId, devTargetType, devTargetId, devSpaceId } = item;

    if (devTargetType === 'Agent' && devSpaceId && id) {
      history.push(
        `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`,
      );
    } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
      history.push(`/space/${devSpaceId}/app-dev/${devTargetId}`);
    } else {
      history.push(`/home/chat/${id}/${agentId}`);
    }
  };

  if (!conversations.length && !canEdit) return null;

  return (
    <section className={styles.recentWork}>
      <div className={styles.heading}>
        <div className={styles.recentTabs}>
          <button
            type="button"
            aria-pressed={!isShowingEdits}
            onClick={() => setShowEdits(false)}
          >
            {dict('PC.Pages.Home.recentWork')}
          </button>
          {canEdit && (
            <button
              type="button"
              aria-pressed={isShowingEdits}
              onClick={() => setShowEdits(true)}
            >
              {dict(
                'PC.Layouts.DynamicMenusLayout.SpaceSection.recentlyEdited',
              )}
            </button>
          )}
        </div>
        {!isShowingEdits && (
          <button
            type="button"
            onClick={() => history.push('/history-conversation')}
          >
            {dict('PC.Pages.Home.viewAll')} <ArrowRightOutlined />
          </button>
        )}
      </div>
      <div className={styles.workList}>
        {isShowingEdits
          ? editAgentList.map((item: AgentInfo) => (
              <button
                type="button"
                className={styles.workItem}
                key={item.id}
                onClick={() =>
                  history.push(`/space/${item.spaceId}/agent/${item.agentId}`)
                }
              >
                <img
                  src={item.icon || agentImage}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = agentImage;
                  }}
                />
                <span className={styles.workInfo}>
                  <strong>{item.name}</strong>
                  <small>{dict('PC.Components.Newx.expert')}</small>
                </span>
                <ArrowRightOutlined className={styles.arrow} />
              </button>
            ))
          : conversations.map((item) => (
              <button
                type="button"
                className={styles.workItem}
                key={item.id}
                onClick={() => handleOpen(item)}
              >
                <img
                  src={item.icon || item.agent?.icon || agentImage}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = agentImage;
                  }}
                />
                <span className={styles.workInfo}>
                  <strong>{item.topic || item.agent?.name}</strong>
                  <small>
                    {item.agent?.name ||
                      dict(
                        'PC.Components.HistoryConversationList.agentFallback',
                      )}
                    {item.modified && dayjs(item.modified).isValid() && (
                      <time dateTime={item.modified}>
                        {dayjs(item.modified).format('MM/DD HH:mm')}
                      </time>
                    )}
                  </small>
                </span>
                {item.taskStatus === TaskStatus.EXECUTING ? (
                  <span className={styles.running}>
                    {dict(
                      'PC.Layouts.DynamicMenusLayout.ConversationItem.executing',
                    )}
                  </span>
                ) : (
                  <ArrowRightOutlined className={styles.arrow} />
                )}
              </button>
            ))}
      </div>
      {isShowingEdits && !editAgentList.length && (
        <p className={styles.empty}>{dict('PC.Common.Global.emptyData')}</p>
      )}
    </section>
  );
};

export default RecentWork;
