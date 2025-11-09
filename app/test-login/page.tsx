'use client';

import { useState } from 'react';
import { loginAction } from '../auth/login/actions';

export default function TestLoginPage() {
  const [status, setStatus] = useState('');

  const handleTest = async () => {
    setStatus('送信中...');

    const formData = new FormData();
    formData.append('email', 'yuzhuxia87@gmail.com');
    formData.append('password', 'test123');  // パスワードを入力してください

    try {
      const result = await loginAction(formData);
      if (result?.error) {
        setStatus(`エラー: ${result.error}`);
      } else {
        setStatus('成功！リダイレクト中...');
      }
    } catch (error) {
      setStatus(`例外: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">ログインテスト</h1>
        <button
          onClick={handleTest}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        >
          テストログイン実行
        </button>
        <div className="text-sm text-gray-600">{status}</div>
        <div className="text-xs text-gray-500">
          ターミナルに [LOGIN ACTION] のログが表示されることを確認してください
        </div>
      </div>
    </div>
  );
}
