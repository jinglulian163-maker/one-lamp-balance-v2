import { Platform, Share } from 'react-native';

export type ExportPayload = {
  exportedAt: string;
  app: string;
  transactions: unknown[];
  goals: unknown[];
  collection: unknown[];
  categories: { income: string[]; expense: string[] };
};

/** Saves a portable JSON backup in browsers, and opens the system share sheet on phones. */
export async function exportFinanceBackup(payload: ExportPayload): Promise<'downloaded' | 'shared'> {
  const content = JSON.stringify(payload, null, 2);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const file = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `one-lamp-balance-backup-${payload.exportedAt.slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }
  await Share.share({ title: '一盏余额数据备份', message: content });
  return 'shared';
}
