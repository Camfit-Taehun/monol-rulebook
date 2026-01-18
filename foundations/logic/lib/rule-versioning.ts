/**
 * Monol Rulebook - Rule Versioning
 *
 * 규칙 버전 관리, 이력 추적, 롤백 기능
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as YAML from 'yaml';
import type {
  Rule,
  RuleMetadata,
  ChangelogEntry,
  RuleDiff,
  DiffChange,
} from './types.js';
import { VersionError } from './errors.js';

// ============================================================================
// Constants
// ============================================================================

const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;
const HISTORY_DIR = '.history';

// ============================================================================
// RuleVersioning Class
// ============================================================================

export class RuleVersioning {
  private basePath: string;
  private historyPath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.historyPath = path.join(basePath, 'rules', HISTORY_DIR);
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * 규칙의 새 버전 생성
   */
  async createVersion(
    rule: Rule,
    changes: string,
    author: string
  ): Promise<Rule> {
    const currentVersion = rule.metadata?.version || '0.0.0';
    const newVersion = this.incrementVersion(currentVersion, 'patch');

    // 현재 상태를 히스토리에 저장
    await this.saveSnapshot(rule);

    // 새 버전으로 업데이트
    const updatedRule: Rule = {
      ...rule,
      updated: new Date().toISOString(),
      metadata: {
        ...rule.metadata,
        version: newVersion,
        status: rule.metadata?.status || 'active',
        changelog: [
          {
            version: newVersion,
            date: new Date().toISOString(),
            author,
            changes,
            snapshot: this.createSnapshot(rule),
          },
          ...(rule.metadata?.changelog || []),
        ],
      },
    };

    return updatedRule;
  }

  /**
   * 규칙 변경 이력 조회
   */
  async getHistory(ruleId: string): Promise<ChangelogEntry[]> {
    // 1. 현재 규칙에서 changelog 확인
    const historyFile = path.join(this.historyPath, `${ruleId}.yaml`);

    try {
      const content = await fs.readFile(historyFile, 'utf-8');
      const history = YAML.parse(content) as { entries: ChangelogEntry[] };
      return history.entries || [];
    } catch {
      // 히스토리 파일이 없으면 빈 배열 반환
      return [];
    }
  }

  /**
   * 두 버전 간 차이점 비교
   */
  async diff(
    ruleId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<RuleDiff> {
    const history = await this.getHistory(ruleId);

    const fromEntry = history.find(e => e.version === fromVersion);
    const toEntry = history.find(e => e.version === toVersion);

    if (!fromEntry?.snapshot) {
      throw VersionError.notFound(ruleId, fromVersion);
    }
    if (!toEntry?.snapshot) {
      throw VersionError.notFound(ruleId, toVersion);
    }

    const changes = this.compareRules(
      fromEntry.snapshot as Partial<Rule>,
      toEntry.snapshot as Partial<Rule>
    );

    return {
      ruleId,
      fromVersion,
      toVersion,
      changes,
    };
  }

  /**
   * 특정 버전으로 롤백
   */
  async rollback(ruleId: string, targetVersion: string): Promise<Rule> {
    const history = await this.getHistory(ruleId);
    const targetEntry = history.find(e => e.version === targetVersion);

    if (!targetEntry?.snapshot) {
      throw VersionError.notFound(ruleId, targetVersion);
    }

    const snapshot = targetEntry.snapshot as Partial<Rule>;
    const newVersion = this.incrementVersion(
      history[0]?.version || '0.0.0',
      'patch'
    );

    // 롤백된 규칙 생성
    const rolledBackRule: Rule = {
      ...snapshot,
      id: ruleId,
      name: snapshot.name || '',
      description: snapshot.description || '',
      category: snapshot.category || '',
      tags: snapshot.tags || [],
      severity: snapshot.severity || 'info',
      created: snapshot.created || new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: {
        ...snapshot.metadata,
        version: newVersion,
        status: 'active',
        changelog: [
          {
            version: newVersion,
            date: new Date().toISOString(),
            author: 'system',
            changes: `Rolled back to version ${targetVersion}`,
          },
          ...history,
        ],
      },
    } as Rule;

    return rolledBackRule;
  }

  /**
   * 버전 번호 유효성 검사
   */
  validateVersion(version: string): boolean {
    return VERSION_REGEX.test(version);
  }

  /**
   * 버전 증가
   */
  incrementVersion(
    version: string,
    type: 'major' | 'minor' | 'patch'
  ): string {
    const match = version.match(VERSION_REGEX);
    if (!match) {
      return '1.0.0';
    }

    let [, major, minor, patch] = match.map(Number);

    switch (type) {
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'patch':
        patch++;
        break;
    }

    return `${major}.${minor}.${patch}`;
  }

  /**
   * 버전 비교 (-1: a < b, 0: a == b, 1: a > b)
   */
  compareVersions(a: string, b: string): number {
    const parseVersion = (v: string) => {
      const match = v.match(VERSION_REGEX);
      return match ? match.slice(1).map(Number) : [0, 0, 0];
    };

    const [aMajor, aMinor, aPatch] = parseVersion(a);
    const [bMajor, bMinor, bPatch] = parseVersion(b);

    if (aMajor !== bMajor) return aMajor > bMajor ? 1 : -1;
    if (aMinor !== bMinor) return aMinor > bMinor ? 1 : -1;
    if (aPatch !== bPatch) return aPatch > bPatch ? 1 : -1;
    return 0;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * 규칙 스냅샷 저장
   */
  private async saveSnapshot(rule: Rule): Promise<void> {
    await fs.mkdir(this.historyPath, { recursive: true });

    const historyFile = path.join(this.historyPath, `${rule.id}.yaml`);

    let existingHistory: { entries: ChangelogEntry[] } = { entries: [] };
    try {
      const content = await fs.readFile(historyFile, 'utf-8');
      existingHistory = YAML.parse(content);
    } catch {
      // 파일이 없으면 새로 생성
    }

    // 현재 상태를 히스토리에 추가
    const entry: ChangelogEntry = {
      version: rule.metadata?.version || '0.0.0',
      date: new Date().toISOString(),
      author: rule.metadata?.author || 'unknown',
      changes: 'Snapshot before update',
      snapshot: this.createSnapshot(rule),
    };

    existingHistory.entries.unshift(entry);

    // 최대 50개 버전 유지
    if (existingHistory.entries.length > 50) {
      existingHistory.entries = existingHistory.entries.slice(0, 50);
    }

    await fs.writeFile(
      historyFile,
      YAML.stringify(existingHistory),
      'utf-8'
    );
  }

  /**
   * 규칙의 스냅샷 생성 (메타데이터 제외)
   */
  private createSnapshot(rule: Rule): Partial<Rule> {
    const { metadata, ...rest } = rule;
    return {
      ...rest,
      metadata: metadata
        ? {
            version: metadata.version,
            status: metadata.status,
            author: metadata.author,
          }
        : undefined,
    };
  }

  /**
   * 두 규칙 비교하여 변경 사항 추출
   */
  private compareRules(
    from: Partial<Rule>,
    to: Partial<Rule>
  ): DiffChange[] {
    const changes: DiffChange[] = [];
    const allKeys = new Set([
      ...Object.keys(from),
      ...Object.keys(to),
    ]);

    for (const key of allKeys) {
      const fromValue = (from as Record<string, unknown>)[key];
      const toValue = (to as Record<string, unknown>)[key];

      if (fromValue === undefined && toValue !== undefined) {
        changes.push({
          field: key,
          oldValue: undefined,
          newValue: toValue,
          type: 'added',
        });
      } else if (fromValue !== undefined && toValue === undefined) {
        changes.push({
          field: key,
          oldValue: fromValue,
          newValue: undefined,
          type: 'removed',
        });
      } else if (!this.deepEqual(fromValue, toValue)) {
        changes.push({
          field: key,
          oldValue: fromValue,
          newValue: toValue,
          type: 'modified',
        });
      }
    }

    return changes;
  }

  /**
   * 깊은 비교
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.deepEqual(item, b[i]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a as object);
      const bKeys = Object.keys(b as object);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(key =>
        this.deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      );
    }

    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 버전 문자열 파싱
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} | null {
  const match = version.match(VERSION_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * 규칙에 버전 메타데이터 초기화
 */
export function initializeVersioning(rule: Rule, author?: string): Rule {
  const now = new Date().toISOString();

  return {
    ...rule,
    metadata: {
      version: '1.0.0',
      status: 'draft',
      author,
      changelog: [
        {
          version: '1.0.0',
          date: now,
          author: author || 'unknown',
          changes: 'Initial version',
        },
      ],
    },
  };
}

/**
 * Diff를 포맷된 문자열로 변환
 */
export function formatDiff(diff: RuleDiff): string {
  const lines: string[] = [];

  lines.push(`규칙: ${diff.ruleId}`);
  lines.push(`버전: ${diff.fromVersion} → ${diff.toVersion}`);
  lines.push('');

  if (diff.changes.length === 0) {
    lines.push('변경 사항 없음');
    return lines.join('\n');
  }

  for (const change of diff.changes) {
    const icon =
      change.type === 'added' ? '+' :
      change.type === 'removed' ? '-' : '~';

    lines.push(`${icon} ${change.field}:`);

    if (change.type === 'added') {
      lines.push(`  + ${JSON.stringify(change.newValue)}`);
    } else if (change.type === 'removed') {
      lines.push(`  - ${JSON.stringify(change.oldValue)}`);
    } else {
      lines.push(`  - ${JSON.stringify(change.oldValue)}`);
      lines.push(`  + ${JSON.stringify(change.newValue)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default RuleVersioning;
