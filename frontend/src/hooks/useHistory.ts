import { useState, useCallback } from 'react';

interface UseHistoryOptions {
  maxHistory?: number;
}

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

/**
 * Undo/Redo機能付きのstate管理フック
 * @param initialState 初期状態
 * @param options オプション（maxHistory: 履歴の最大数）
 */
export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): UseHistoryReturn<T> {
  const { maxHistory = 50 } = options;

  // 履歴スタック（過去の状態）
  const [past, setPast] = useState<T[]>([]);
  // 現在の状態
  const [present, setPresent] = useState<T>(initialState);
  // 未来スタック（Undoした後の状態）
  const [future, setFuture] = useState<T[]>([]);

  // 状態を更新（履歴に追加）
  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setPresent((currentPresent) => {
      const resolvedState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(currentPresent)
        : newState;

      // 現在の状態を過去に追加
      setPast((currentPast) => {
        const newPast = [...currentPast, currentPresent];
        // 最大履歴数を超えたら古いものを削除
        if (newPast.length > maxHistory) {
          return newPast.slice(-maxHistory);
        }
        return newPast;
      });

      // 新しい操作をしたら未来をクリア
      setFuture([]);

      return resolvedState;
    });
  }, [maxHistory]);

  // Undo
  const undo = useCallback(() => {
    setPast((currentPast) => {
      if (currentPast.length === 0) return currentPast;

      const previous = currentPast[currentPast.length - 1];
      const newPast = currentPast.slice(0, -1);

      setPresent((currentPresent) => {
        // 現在の状態を未来に追加
        setFuture((currentFuture) => [currentPresent, ...currentFuture]);
        return previous;
      });

      return newPast;
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setFuture((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;

      const next = currentFuture[0];
      const newFuture = currentFuture.slice(1);

      setPresent((currentPresent) => {
        // 現在の状態を過去に追加
        setPast((currentPast) => [...currentPast, currentPresent]);
        return next;
      });

      return newFuture;
    });
  }, []);

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
  };
}
