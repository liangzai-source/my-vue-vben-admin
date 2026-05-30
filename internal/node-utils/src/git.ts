import path from 'node:path';

import { execa } from 'execa';

export * from '@changesets/git';

/**
 * 获取暂存区文件
 */
async function getStagedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execa('git', [
      '-c',
      'submodule.recurse=false',
      'diff',
      '--staged',
      '--diff-filter=ACMR',
      '--name-only',
      '--ignore-submodules',
      '-z',
    ]);

    const changedList = stdout
      ? stdout
          .split('\0')
          .filter(Boolean)
          .map((item) => path.resolve(process.cwd(), item))
      : [];
    return [...new Set(changedList)];
  } catch (error) {
    console.error('Failed to get staged files:', error);
    return [];
  }
}

export { getStagedFiles };
