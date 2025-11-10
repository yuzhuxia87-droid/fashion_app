'use client';

import { useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';

/**
 * ControlledAlertDialog - Radix UI AlertDialogの堅牢なラッパー
 *
 * ## 目的
 * Radix UI AlertDialogがAlertDialog閉鎖後もbody要素に`overflow: hidden`を残留させる問題を
 * 根本的に解決するための統一制御コンポーネント
 *
 * ## 問題の背景
 * Radix UI AlertDialogは、ダイアログ表示中にbody要素に以下を動的に追加します：
 * - `overflow: hidden` - スクロールを無効化
 * - `padding-right: [スクロールバー幅]px` - レイアウトシフトを防止
 *
 * 本来、ダイアログを閉じる際にこれらは削除されるべきですが、以下の要因で残留します：
 * 1. React 18のConcurrent Modeとの相互作用
 * 2. 複数のAlertDialogコンポーネントの状態管理の複雑さ
 * 3. unmount時のクリーンアップタイミングのズレ
 *
 * ## 解決策
 * このラッパーは、AlertDialog状態の変更を監視し、閉鎖後に以下を実行します：
 * 1. 50msの遅延（Radixのアニメーション完了を待つ）
 * 2. bodyのstyle属性から`overflow`と`padding-right`を強制削除
 * 3. 念のため、style属性全体をクリアする二重防御
 *
 * ## 使用方法
 * 標準の<AlertDialog>の代わりに、このコンポーネントを使用してください：
 *
 * ```tsx
 * <ControlledAlertDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="削除確認"
 *   description="本当に削除しますか？"
 *   footer={
 *     <>
 *       <AlertDialogCancel>キャンセル</AlertDialogCancel>
 *       <AlertDialogAction onClick={handleConfirm}>削除</AlertDialogAction>
 *     </>
 *   }
 * >
 *   <div>コンテンツ</div>
 * </ControlledAlertDialog>
 * ```
 *
 * ## 注意事項
 * - 標準の<AlertDialog>を直接使用しないでください
 * - AlertDialogContentに直接`overflow-y-auto`を指定しないでください
 * - 長いコンテンツは内部divでスクロール制御してください
 *
 * @see https://www.radix-ui.com/docs/primitives/components/alert-dialog
 */

interface ControlledAlertDialogProps {
  /** AlertDialogの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** AlertDialogの内容 */
  children?: React.ReactNode;
  /** AlertDialogのタイトル（オプション） */
  title?: string;
  /** AlertDialogの説明文（オプション） */
  description?: string;
  /** AlertDialogContentに適用するカスタムクラス名 */
  className?: string;
  /** フッター部分のコンテンツ（AlertDialogActionやAlertDialogCancelなど） */
  footer?: React.ReactNode;
}

/**
 * body要素のスタイルをクリーンアップする関数
 *
 * Radix UI AlertDialogが追加したスタイルを強制的に削除します。
 * この関数は、AlertDialogが完全に閉じられた後に実行されることを想定しています。
 */
function cleanupBodyStyles(): void {
  // 1. 個別プロパティを削除
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');

  // 2. 念のため、style属性全体をチェックしてRadix由来のスタイルをクリア
  const bodyStyle = document.body.getAttribute('style');
  if (bodyStyle && (bodyStyle.includes('overflow') || bodyStyle.includes('padding-right'))) {
    // overflow または padding-right が含まれている場合のみ、
    // 他のスタイルを保持しつつこれらを削除
    const cleanedStyle = bodyStyle
      .split(';')
      .filter(
        (style) =>
          style.trim() &&
          !style.includes('overflow') &&
          !style.includes('padding-right')
      )
      .join(';');

    if (cleanedStyle) {
      document.body.setAttribute('style', cleanedStyle);
    } else {
      document.body.removeAttribute('style');
    }
  }
}

export function ControlledAlertDialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
  footer,
}: ControlledAlertDialogProps) {
  /**
   * AlertDialog状態の変更を監視し、閉鎖後にbodyのスタイルをクリーンアップ
   *
   * タイミング戦略：
   * - requestAnimationFrame: 次のレンダーサイクルで実行
   * - setTimeout(50ms): Radixのアニメーション完了を待つ
   *
   * この二段階アプローチにより、Radix UIのクリーンアップ処理が
   * 完了した後に、確実にbodyをクリーンアップできます。
   */
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);

      if (!newOpen) {
        // AlertDialogが閉じられた場合、bodyのスタイルをクリーンアップ
        // 1. requestAnimationFrame: 次のレンダーサイクルで実行
        requestAnimationFrame(() => {
          // 2. setTimeout: Radixのクローズアニメーション（約30-50ms）完了を待つ
          setTimeout(() => {
            cleanupBodyStyles();
          }, 50);
        });
      }
    },
    [onOpenChange]
  );

  /**
   * コンポーネントのunmount時のクリーンアップ
   *
   * AlertDialogが開いたままコンポーネントがunmountされる場合
   * （例：ページ遷移）に備えて、強制的にbodyをクリーンアップします。
   */
  useEffect(() => {
    return () => {
      // unmount時、openがtrueの場合のみクリーンアップ
      if (open) {
        // 即座にクリーンアップを実行
        requestAnimationFrame(() => {
          cleanupBodyStyles();
        });
      }
    };
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={className}>
        {(title || description) && (
          <AlertDialogHeader>
            {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
        )}

        {/* メインコンテンツ */}
        {children}

        {/* フッター（オプション） */}
        {footer && <AlertDialogFooter>{footer}</AlertDialogFooter>}
      </AlertDialogContent>
    </AlertDialog>
  );
}
