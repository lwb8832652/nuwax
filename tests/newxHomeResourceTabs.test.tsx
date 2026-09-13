import type { HomeAgentCategoryInfo } from '@/types/interfaces/agentConfig';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('antd', () => ({
  Affix: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  App: {
    useApp: () => ({
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
    }),
  },
}));

vi.mock('umi', () => ({
  history: { push: vi.fn() },
  useRequest: () => ({ run: vi.fn() }),
}));

vi.mock('@/services/agentDev', () => ({
  apiUpdateAgentSort: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/components/custom/Loading', () => ({ default: () => null }));
vi.mock('@/pages/Home/DraggableHomeContent/index.less', () => ({
  default: {},
}));

vi.mock(
  '@/pages/Home/DraggableHomeContent/CategoryContainer',
  async () => {
    const React = await import('react');
    return {
      default: ({
        categories,
        activeCategory,
        onTabClick,
      }: {
        categories: Array<{ name: string; type: string }>;
        activeCategory?: string;
        onTabClick: (type: string) => void;
      }) => (
        <nav aria-label="资源分类">
          {categories.map((category) => (
            <button
              key={category.type}
              type="button"
              aria-pressed={activeCategory === category.type}
              onClick={() => onTabClick(category.type)}
            >
              {category.name}
            </button>
          ))}
        </nav>
      ),
    };
  },
);

vi.mock('@/pages/Home/DraggableHomeContent/AgentSection', async () => {
  const React = await import('react');
  return {
    default: ({
      category,
      agents,
    }: {
      category: { name: string; type: string };
      agents: Array<{ name: string }>;
    }) => (
      <section data-testid={`resource-section-${category.type}`}>
        <h2>{category.name}</h2>
        {agents.map((agent) => (
          <span key={agent.name}>{agent.name}</span>
        ))}
      </section>
    ),
  };
});

import DraggableHomeContent from '@/pages/Home/DraggableHomeContent';

const resourceCategories = {
  categories: [
    { name: '我的收藏', type: 'favorites' },
    { name: '官方推荐', type: 'official' },
    { name: '个人空间', type: 'personal' },
  ],
  categoryItems: {
    favorites: [{ targetId: 1, name: '收藏专家' }],
    official: [{ targetId: 2, name: '官方专家' }],
    personal: [{ targetId: 3, name: '个人专家' }],
  },
} as unknown as HomeAgentCategoryInfo;

const ResourceTabsHarness = () => {
  const [activeTab, setActiveTab] = useState('favorites');

  return (
    <DraggableHomeContent
      homeCategoryInfo={resourceCategories}
      activeTab={activeTab}
      onTabClick={setActiveTab}
      onAgentClick={vi.fn()}
      onToggleCollect={vi.fn()}
      onDataUpdate={vi.fn()}
    />
  );
};

describe('NewX workbench resource tabs', () => {
  it('renders only the resources for the selected tab', () => {
    render(<ResourceTabsHarness />);

    expect(screen.getByTestId('resource-section-favorites')).toHaveTextContent(
      '收藏专家',
    );
    expect(screen.queryByTestId('resource-section-official')).toBeNull();
    expect(screen.queryByTestId('resource-section-personal')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '官方推荐' }));
    expect(screen.getByTestId('resource-section-official')).toHaveTextContent(
      '官方专家',
    );
    expect(screen.queryByTestId('resource-section-favorites')).toBeNull();
    expect(screen.queryByTestId('resource-section-personal')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '个人空间' }));
    expect(screen.getByTestId('resource-section-personal')).toHaveTextContent(
      '个人专家',
    );
    expect(screen.queryByTestId('resource-section-favorites')).toBeNull();
    expect(screen.queryByTestId('resource-section-official')).toBeNull();
  });
});
