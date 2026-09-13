import useSelectedComponent from '@/hooks/useSelectedComponent';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('NewX selected resources', () => {
  it('keeps resources with the same numeric ID and different types independent', () => {
    const { result } = renderHook(useSelectedComponent);
    const skill = { id: 17, type: AgentComponentTypeEnum.Skill };
    const knowledge = { id: 17, type: AgentComponentTypeEnum.Knowledge };

    act(() => result.current.handleSelectComponent(skill));
    act(() => result.current.handleSelectComponent(knowledge));
    expect(result.current.selectedComponentList).toEqual([skill, knowledge]);

    act(() => result.current.handleSelectComponent(skill));
    expect(result.current.selectedComponentList).toEqual([knowledge]);
  });

  it('retains all resource changes from the same editor undo or restore event', () => {
    const { result } = renderHook(useSelectedComponent);
    const first = { id: 7, type: AgentComponentTypeEnum.Plugin };
    const second = { id: 8, type: AgentComponentTypeEnum.Workflow };

    act(() => {
      result.current.handleSelectComponent(first);
      result.current.handleSelectComponent(second);
    });
    expect(result.current.selectedComponentList).toEqual([first, second]);

    act(() => {
      result.current.handleSelectComponent(first);
      result.current.handleSelectComponent(second);
    });
    expect(result.current.selectedComponentList).toEqual([]);
  });
});
