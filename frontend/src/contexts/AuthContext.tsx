'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setUseMockData as setApiMockData, checkSmaregiConnection } from '@/lib/api';

// 接続状態の型定義
interface AuthState {
  isConnected: boolean;
  isLoading: boolean;
  message: string;
}

// Context の型定義
interface AuthContextType extends AuthState {
  checkConnection: () => Promise<void>;
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
}

// デフォルト値
const defaultAuthState: AuthState = {
  isConnected: false,
  isLoading: true,
  message: '',
};

// Context 作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider コンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const [useMockData, setUseMockDataState] = useState<boolean>(
    process.env.NEXT_PUBLIC_USE_MOCK === 'true'
  );

  // モックデータモードを設定（APIモジュールも同期）
  const setUseMockData = useCallback((value: boolean) => {
    setUseMockDataState(value);
    setApiMockData(value);
  }, []);

  // 接続状態をチェック
  const checkConnection = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await checkSmaregiConnection();
      setAuthState({
        isConnected: result.connected,
        isLoading: false,
        message: result.message,
      });
      
      // 接続成功時はモックデータモードを無効化
      if (result.connected) {
        setUseMockData(false);
      }
    } catch {
      setAuthState({
        isConnected: false,
        isLoading: false,
        message: '接続確認に失敗しました',
      });
    }
  }, [setUseMockData]);

  // 初回マウント時に接続状態をチェック
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const value: AuthContextType = {
    ...authState,
    checkConnection,
    useMockData,
    setUseMockData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
