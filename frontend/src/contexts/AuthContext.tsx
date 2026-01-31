'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setUseMockData as setApiMockData } from '@/lib/api';

// 認証状態の型定義
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  contractId: string | null;
  error: string | null;
}

// Context の型定義
interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  useMockData: boolean;
  setUseMockData: (value: boolean) => void;
}

// デフォルト値
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  contractId: null,
  error: null,
};

// Context 作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://popmate-production.up.railway.app';

// Provider コンポーネント
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const [useMockData, setUseMockDataState] = useState<boolean>(true);

  // モックデータモードを設定（APIモジュールも同期）
  const setUseMockData = useCallback((value: boolean) => {
    setUseMockDataState(value);
    setApiMockData(value);
  }, []);

  // 認証状態をチェック
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // ローカルストレージから認証情報を確認
      const token = localStorage.getItem('smaregi_token');
      const contractId = localStorage.getItem('smaregi_contract_id');

      if (!token || !contractId) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          contractId: null,
          error: null,
        });
        return;
      }

      // トークンの有効期限をチェック
      const expiresAt = localStorage.getItem('smaregi_token_expires_at');
      if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
        // トークンが期限切れ
        localStorage.removeItem('smaregi_token');
        localStorage.removeItem('smaregi_contract_id');
        localStorage.removeItem('smaregi_token_expires_at');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          contractId: null,
          error: null,
        });
        return;
      }

      // バックエンドで認証状態を確認
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/smaregi/status`, {
          headers: {
            'x-smaregi-token': token,
            'x-smaregi-contract-id': contractId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              contractId: data.contractId || contractId,
              error: null,
            });
            // モックデータモードを無効化
            setUseMockData(false);
          } else {
            // トークンが無効な場合はクリア
            localStorage.removeItem('smaregi_token');
            localStorage.removeItem('smaregi_contract_id');
            localStorage.removeItem('smaregi_token_expires_at');
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              contractId: null,
              error: null,
            });
          }
        } else {
          // APIエラーの場合はローカルの認証情報を信頼
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            contractId: contractId,
            error: null,
          });
          setUseMockData(false);
        }
      } catch (fetchError) {
        // ネットワークエラーの場合はローカルの認証情報を信頼
        console.warn('Auth status check failed, using local credentials:', fetchError);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          contractId: contractId,
          error: null,
        });
        setUseMockData(false);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        contractId: null,
        error: '認証状態の確認に失敗しました',
      });
    }
  }, [setUseMockData]);

  // ログイン（スマレジ認証画面へリダイレクト）
  const login = useCallback(() => {
    // バックエンドの認証開始エンドポイントへリダイレクト
    window.location.href = `${API_BASE_URL}/api/auth/smaregi/authorize`;
  }, []);

  // ログアウト
  const logout = useCallback(() => {
    localStorage.removeItem('smaregi_token');
    localStorage.removeItem('smaregi_contract_id');
    localStorage.removeItem('smaregi_token_expires_at');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      contractId: null,
      error: null,
    });
    setUseMockData(true);
  }, [setUseMockData]);

  // 初回マウント時に認証状態をチェック
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuthStatus,
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
