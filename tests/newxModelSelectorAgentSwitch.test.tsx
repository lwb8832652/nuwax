import ModelSelector from '@/components/ChatInputHome/ModelSelector';
import type { ModelOptionDto } from '@/types/interfaces/agent';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  options: vi.fn(),
}));

vi.mock('umi', () => ({ useModel: () => ({ spaceList: [] }) }));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationModelOptions: mocks.options,
}));
vi.mock('@/services/modelConfig', () => ({ apiModelDelete: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/ant-custom', () => ({ modalConfirm: vi.fn() }));
vi.mock('@/components/base', () => ({ SvgIcon: () => null }));
vi.mock('@/components/ConditionRender', () => ({
  default: ({ condition, children }: any) => (condition ? children : null),
}));
vi.mock('@/pages/SpaceLibrary/CreateModel', () => ({ default: () => null }));
vi.mock('@/components/ChatInputHome/ModelSelector/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@ant-design/icons', () => ({
  CheckOutlined: () => null,
  DeleteOutlined: () => null,
  EditOutlined: () => null,
  PlusOutlined: () => null,
}));
vi.mock('antd', () => ({
  Button: ({ children }: any) => <button>{children}</button>,
  Dropdown: ({ children }: any) => <>{children}</>,
  Typography: { Text: ({ children }: any) => <span>{children}</span> },
  message: { success: vi.fn() },
}));

const option = (id: number, name: string) =>
  ({ id, name, spaceId: -1 } as ModelOptionDto);

const deferred = () => {
  let resolve!: (value: { code: string; data: ModelOptionDto[] }) => void;
  const promise = new Promise<{ code: string; data: ModelOptionDto[] }>(
    (complete) => {
      resolve = complete;
    },
  );
  return { promise, resolve };
};

describe('ModelSelector agent switching', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('ignores an old agent response after the new agent has loaded', async () => {
    const first = deferred();
    const second = deferred();
    mocks.options.mockImplementation((id: number) =>
      id === 1 ? first.promise : second.promise,
    );
    const onModelSelect = vi.fn();
    const { rerender } = render(
      <ModelSelector agentId={1} onModelSelect={onModelSelect} />,
    );
    await waitFor(() => expect(mocks.options).toHaveBeenCalledWith(1));

    rerender(<ModelSelector agentId={2} onModelSelect={onModelSelect} />);
    await waitFor(() => expect(mocks.options).toHaveBeenCalledWith(2));
    await act(async () =>
      second.resolve({ code: '0000', data: [option(202, 'New model')] }),
    );
    await waitFor(() => expect(screen.getByText('New model')).toBeTruthy());
    expect(onModelSelect).toHaveBeenCalledWith(202);

    await act(async () =>
      first.resolve({ code: '0000', data: [option(101, 'Old model')] }),
    );
    expect(screen.getByText('New model')).toBeTruthy();
    expect(screen.queryByText('Old model')).toBeNull();
    expect(onModelSelect.mock.calls).toEqual([[202]]);
  });

  it('clears options when the agent ID disappears and ignores its pending response', async () => {
    const first = deferred();
    mocks.options.mockReturnValue(first.promise);
    const onModelSelect = vi.fn();
    const { rerender } = render(
      <ModelSelector agentId={1} onModelSelect={onModelSelect} />,
    );
    await waitFor(() => expect(mocks.options).toHaveBeenCalledWith(1));

    rerender(<ModelSelector onModelSelect={onModelSelect} />);
    await act(async () =>
      first.resolve({ code: '0000', data: [option(101, 'Old model')] }),
    );
    expect(screen.queryByText('Old model')).toBeNull();
    expect(onModelSelect).not.toHaveBeenCalled();
  });

  it('uses an external list while an internal request is still pending', async () => {
    const first = deferred();
    mocks.options.mockReturnValue(first.promise);
    const onModelSelect = vi.fn();
    const { rerender } = render(
      <ModelSelector agentId={1} onModelSelect={onModelSelect} />,
    );
    await waitFor(() => expect(mocks.options).toHaveBeenCalledWith(1));

    rerender(
      <ModelSelector
        modelList={[option(303, 'External model')]}
        onModelSelect={onModelSelect}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText('External model')).toBeTruthy(),
    );
    expect(onModelSelect).toHaveBeenCalledWith(303);
    await act(async () =>
      first.resolve({ code: '0000', data: [option(101, 'Old model')] }),
    );
    expect(screen.getByText('External model')).toBeTruthy();
    expect(screen.queryByText('Old model')).toBeNull();
    expect(onModelSelect.mock.calls).toEqual([[303]]);
    expect(mocks.options).toHaveBeenCalledTimes(1);
  });
});
