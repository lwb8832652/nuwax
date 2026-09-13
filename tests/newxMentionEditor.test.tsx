import type {
  MentionEditorHandle,
  MentionItem,
} from '@/components/ChatInputHome/MentionPopup/types';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/components/ChatInputHome/MentionEditor/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/ChatInputHome/MentionPopup', async () => {
  const React = await import('react');
  return { default: React.forwardRef(() => null) };
});

import MentionEditor from '@/components/ChatInputHome/MentionEditor';

const skill: MentionItem = {
  targetId: 91,
  targetType: AgentComponentTypeEnum.Skill,
  source: 'skill',
  name: 'Published skill',
};
const manual: MentionItem = {
  targetId: 91,
  targetType: AgentComponentTypeEnum.Knowledge,
  source: 'manual',
  name: 'Project documents',
};
const manualSkill: MentionItem = {
  targetId: 92,
  targetType: AgentComponentTypeEnum.Skill,
  source: 'manual',
  name: 'Configured skill',
};

function setup() {
  const ref = createRef<MentionEditorHandle>();
  const onSkillIdsChange = vi.fn();
  const onMentionSelect = vi.fn();
  const onMentionRemove = vi.fn();
  const view = render(
    <MentionEditor
      ref={ref}
      autoFocus={false}
      onPaste={vi.fn()}
      onSkillIdsChange={onSkillIdsChange}
      onMentionSelect={onMentionSelect}
      onMentionRemove={onMentionRemove}
    />,
  );
  const editor = view.container.querySelector(
    '[contenteditable="true"]',
  ) as HTMLElement;
  return {
    ref,
    editor,
    ...view,
    onSkillIdsChange,
    onMentionSelect,
    onMentionRemove,
  };
}

async function insert(
  ref: React.RefObject<MentionEditorHandle>,
  item: MentionItem,
) {
  await act(async () => ref.current?.handleAtIconMentionSelect(item));
}

afterEach(cleanup);

describe('NewX resource mentions in the real editor', () => {
  it('keeps published skill IDs separate from configured component IDs even when IDs collide', async () => {
    const { ref, editor, onSkillIdsChange } = setup();
    await insert(ref, skill);
    await insert(ref, manual);
    await insert(ref, manualSkill);
    expect(editor.querySelectorAll('[data-mention-key]')).toHaveLength(3);
    expect(onSkillIdsChange).toHaveBeenLastCalledWith([91]);
    fireEvent.click(
      editor.querySelector(
        '[data-mention-source="manual"] [data-mention-delete]',
      )!,
    );
    expect(editor.querySelectorAll('[data-mention-key]')).toHaveLength(2);
    expect(onSkillIdsChange).toHaveBeenLastCalledWith([91]);
  });

  it('synchronizes deleting selected text and undoing it with manual resource selection', async () => {
    const { ref, editor, onMentionSelect, onMentionRemove } = setup();
    await insert(ref, manual);
    expect(onMentionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'manual', targetId: 91 }),
    );
    editor.textContent = '';
    fireEvent.input(editor);
    await waitFor(() =>
      expect(onMentionRemove).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'manual', targetId: 91 }),
      ),
    );
    onMentionSelect.mockClear();
    await act(async () =>
      fireEvent.keyDown(editor, { key: 'z', ctrlKey: true }),
    );
    expect(
      editor.querySelector('[data-mention-source="manual"]'),
    ).not.toBeNull();
    expect(onMentionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'manual', targetId: 91 }),
    );
    onMentionRemove.mockClear();
    fireEvent.click(editor.querySelector('[data-mention-delete]')!);
    expect(onMentionRemove).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'manual', targetId: 91 }),
    );
  });

  it('clears the composer after send without toggling the configured manual tools', async () => {
    const { ref, editor, onMentionRemove, onSkillIdsChange } = setup();
    await insert(ref, manual);
    await insert(ref, skill);
    onMentionRemove.mockClear();
    await act(async () => ref.current?.clear());
    expect(editor.querySelector('[data-mention-key]')).toBeNull();
    expect(onMentionRemove).not.toHaveBeenCalled();
    expect(onSkillIdsChange).toHaveBeenLastCalledWith([]);
  });

  it('does not duplicate a resource when selecting it again', async () => {
    const { ref, editor, onMentionSelect } = setup();
    await insert(ref, manual);
    await insert(ref, manual);
    expect(editor.querySelectorAll('[data-mention-key]')).toHaveLength(1);
    expect(onMentionSelect).toHaveBeenCalledTimes(1);
  });
});
