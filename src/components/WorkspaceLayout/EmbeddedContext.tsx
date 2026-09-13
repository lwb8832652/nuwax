import { createContext, useContext } from 'react';

export interface WorkspaceLayoutContextValue {
  embedded?: boolean;
  title?: string;
}

export const WorkspaceLayoutContext =
  createContext<WorkspaceLayoutContextValue>({});

export const useWorkspaceLayoutContext = () =>
  useContext(WorkspaceLayoutContext);
