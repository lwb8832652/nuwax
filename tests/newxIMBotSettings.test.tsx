import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('antd', () => ({
  Empty: ({ description }: { description: React.ReactNode }) => (
    <div data-testid="empty-state">{description}</div>
  ),
}));
vi.mock('@/pages/IMChannel', () => ({
  default: ({ spaceId }: { spaceId: number }) => (
    <div data-testid="im-channel">{spaceId}</div>
  ),
}));
vi.mock('@/layouts/Setting/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));

import IMBotSettings from '@/layouts/Setting/IMBotSettings';
import type { MenuItemDto } from '@/types/interfaces/menu';
import type { SpaceInfo } from '@/types/interfaces/workspace';

const space = (id: number) => ({ id } as SpaceInfo);

describe('NewX IM bot settings', () => {
  afterEach(cleanup);

  it('uses the current workspace without a duplicate selector', () => {
    const menus = [
      { code: 'im_channel', path: '/space/:spaceId/im-channel' },
    ] as MenuItemDto[];

    render(<IMBotSettings menus={menus} space={space(7)} />);

    expect(screen.queryByLabelText('settings-im-space')).toBeNull();
    expect(screen.getByTestId('im-channel')).toHaveTextContent('7');
  });

  it('does not load IM bots from another workspace', () => {
    const menus = [
      { code: 'im_channel', path: '/space/7/im-channel' },
    ] as MenuItemDto[];

    render(<IMBotSettings menus={menus} space={space(1)} />);

    expect(screen.queryByTestId('im-channel')).toBeNull();
    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'PC.Pages.Setting.noAvailableSpace',
    );
  });
});
