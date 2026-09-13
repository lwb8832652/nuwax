import MentionPopup from '@/components/ChatInputHome/MentionPopup';
import type {
  MentionItem,
  MentionPopupHandle,
} from '@/components/ChatInputHome/MentionPopup/types';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import type {
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  allSkills: vi.fn(),
  recentSkills: vi.fn(),
  favoriteSkills: vi.fn(),
}));

vi.mock('umi', () => ({ request: vi.fn() }));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/components/ChatInputHome/MentionPopup/index.less', () => ({
  default: new Proxy({}, { get: (_target, key) => String(key) }),
}));
vi.mock('@ant-design/icons', () => ({
  ApiOutlined: () => null,
  DatabaseOutlined: () => null,
  DeploymentUnitOutlined: () => null,
  LeftOutlined: () => null,
  SearchOutlined: () => null,
  ThunderboltOutlined: () => null,
}));
vi.mock('antd', async () => {
  const React = await import('react');
  return {
    Input: React.forwardRef<HTMLInputElement, Record<string, unknown>>(
      (
        {
          allowClear: _allowClear,
          prefix: _prefix,
          variant: _variant,
          ...props
        },
        ref,
      ) => <input ref={ref} {...props} />,
    ),
    Tag: ({ children, ...props }: Record<string, unknown>) => (
      <span {...props}>{children as React.ReactNode}</span>
    ),
  };
});
vi.mock('ahooks', () => {
  const runAsyncByService = new WeakMap<
    (...args: any[]) => Promise<unknown>,
    (...args: any[]) => Promise<unknown>
  >();

  return {
    useRequest: (service: (...args: any[]) => Promise<unknown>) => {
      let runAsync = runAsyncByService.get(service);
      if (!runAsync) {
        runAsync = (...args: any[]) => service(...args);
        runAsyncByService.set(service, runAsync);
      }
      return { runAsync };
    },
  };
});
vi.mock('@/components/ChatInputHome/MentionPopup/atSkill', () => ({
  apiSkillCollectListForAt: mocks.favoriteSkills,
  apiSkillListForAt: mocks.allSkills,
  apiSkillRecentlyUsedListForAt: mocks.recentSkills,
}));

const RESOURCE_LABELS = {
  skill: 'PC.Components.Newx.skills',
  plugin: 'PC.Pages.SpaceSquare.plugin',
  workflow: 'PC.Pages.SpaceSquare.workflow',
  knowledge: 'PC.Common.Global.knowledge',
};

const manualComponent = (
  id: number,
  type: AgentComponentTypeEnum,
  name: string,
): AgentManualComponentInfo => ({
  id,
  type,
  name,
  icon: '',
  description: `${name} description`,
  defaultSelected: DefaultSelectedEnum.No,
});

function getTypeButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(label) });
}

function renderPopup({
  enableSkillMention = false,
  manualComponents = [],
  selectedComponentList = [],
}: {
  enableSkillMention?: boolean;
  manualComponents?: AgentManualComponentInfo[];
  selectedComponentList?: AgentSelectedComponentInfo[];
} = {}) {
  const ref = createRef<MentionPopupHandle>();
  const onSelect = vi.fn<(item: MentionItem) => void>();
  const onClose = vi.fn();
  const view = render(
    <MentionPopup
      ref={ref}
      visible
      position={{ top: 24, left: 24 }}
      onSelect={onSelect}
      onClose={onClose}
      enableSkillMention={enableSkillMention}
      manualComponents={manualComponents}
      selectedComponentList={selectedComponentList}
    />,
  );

  return { ref, onSelect, onClose, ...view };
}

beforeEach(() => {
  mocks.allSkills.mockReset();
  mocks.recentSkills.mockReset();
  mocks.favoriteSkills.mockReset();
  mocks.allSkills.mockResolvedValue({
    code: '0000',
    data: { records: [], total: 0 },
  });
  mocks.recentSkills.mockResolvedValue({ code: '0000', data: [] });
  mocks.favoriteSkills.mockResolvedValue({ code: '0000', data: [] });
});

afterEach(cleanup);

describe('NewX resource mention popup', () => {
  it('uses a type-first picker before selecting a configured resource', async () => {
    const plugin = manualComponent(
      101,
      AgentComponentTypeEnum.Plugin,
      'Web search connector',
    );
    const { onSelect } = renderPopup({ manualComponents: [plugin] });

    expect(getTypeButton(RESOURCE_LABELS.plugin)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Web search connector/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(getTypeButton(RESOURCE_LABELS.plugin));
    const resourceButton = await screen.findByRole('button', {
      name: /Web search connector/,
    });
    fireEvent.click(resourceButton);

    expect(onSelect).toHaveBeenCalledWith({
      id: 'manual:Plugin:101',
      targetId: 101,
      targetType: AgentComponentTypeEnum.Plugin,
      source: 'manual',
      name: 'Web search connector',
      icon: '',
      description: 'Web search connector description',
      active: false,
    });
  });

  it('queries the skill library only when skill mention is enabled', async () => {
    const configuredSkill = manualComponent(
      307,
      AgentComponentTypeEnum.Skill,
      'Configured analyst',
    );
    const disabledView = renderPopup({
      enableSkillMention: false,
      manualComponents: [configuredSkill],
    });

    fireEvent.click(getTypeButton(RESOURCE_LABELS.skill));
    await screen.findByRole('button', { name: /Configured analyst/ });
    expect(mocks.allSkills).not.toHaveBeenCalled();
    expect(mocks.recentSkills).not.toHaveBeenCalled();
    expect(mocks.favoriteSkills).not.toHaveBeenCalled();

    disabledView.unmount();
    renderPopup({ enableSkillMention: true });
    fireEvent.click(getTypeButton(RESOURCE_LABELS.skill));

    await waitFor(() => expect(mocks.allSkills).toHaveBeenCalledTimes(1));
    expect(mocks.allSkills).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: AgentComponentTypeEnum.Skill,
        page: 1,
      }),
    );
    expect(mocks.recentSkills).not.toHaveBeenCalled();
    expect(mocks.favoriteSkills).not.toHaveBeenCalled();
  });

  it('keeps a configured Skill as a manual component ID instead of a published skill', async () => {
    const configuredSkill = manualComponent(
      307,
      AgentComponentTypeEnum.Skill,
      'Configured analyst',
    );
    const { onSelect } = renderPopup({
      enableSkillMention: false,
      manualComponents: [configuredSkill],
      selectedComponentList: [{ id: 307, type: AgentComponentTypeEnum.Skill }],
    });

    fireEvent.click(getTypeButton(RESOURCE_LABELS.skill));
    fireEvent.click(
      await screen.findByRole('button', { name: /Configured analyst/ }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'manual:Skill:307',
        targetId: 307,
        targetType: AgentComponentTypeEnum.Skill,
        source: 'manual',
        active: true,
      }),
    );
    expect(mocks.allSkills).not.toHaveBeenCalled();
  });

  it('does not render resource types that are neither configured nor allowed', () => {
    renderPopup({
      manualComponents: [
        manualComponent(11, AgentComponentTypeEnum.Plugin, 'Plugin A'),
        manualComponent(12, AgentComponentTypeEnum.Knowledge, 'Knowledge B'),
      ],
    });

    expect(getTypeButton(RESOURCE_LABELS.plugin)).toBeInTheDocument();
    expect(getTypeButton(RESOURCE_LABELS.knowledge)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: new RegExp(RESOURCE_LABELS.skill) }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: new RegExp(RESOURCE_LABELS.workflow),
      }),
    ).not.toBeInTheDocument();
  });

  it('uses the Enter controller to enter a type and then select its resource', async () => {
    const workflow = manualComponent(
      404,
      AgentComponentTypeEnum.Workflow,
      'Release workflow',
    );
    const { ref, onSelect } = renderPopup({ manualComponents: [workflow] });

    await act(async () => ref.current?.handleSelectCurrentItem());
    expect(
      await screen.findByRole('button', { name: /Release workflow/ }),
    ).toBeInTheDocument();

    await act(async () => ref.current?.handleSelectCurrentItem());
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 404,
        targetType: AgentComponentTypeEnum.Workflow,
        source: 'manual',
      }),
    );
  });
});
