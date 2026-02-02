/**
 * Monol Rulebook - Rule Sharing Service (v0.3.x)
 *
 * 규칙 공유 및 배포 시스템
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  Rule,
  SharedRule,
  RuleVisibility,
  RuleCollaboration,
  RuleOrigin,
  RuleMetadata,
} from './types.js';
import { RulebookError } from './errors.js';

// ============================================================================
// Types
// ============================================================================

/**
 * 규칙 패키지 형식
 */
export interface RulePackage {
  /** 패키지 ID */
  id: string;

  /** 패키지 이름 */
  name: string;

  /** 패키지 설명 */
  description?: string;

  /** 패키지 버전 */
  version: string;

  /** 작성자 */
  author: string;

  /** 규칙 목록 */
  rules: Rule[];

  /** 생성일 */
  createdAt: string;

  /** 의존성 (다른 패키지 ID) */
  dependencies?: string[];

  /** 태그 */
  tags?: string[];

  /** 체크섬 (무결성 검증) */
  checksum: string;
}

/**
 * 공유 URL 정보
 */
export interface ShareUrl {
  /** 공유 URL */
  url: string;

  /** 공유 코드 (단축 ID) */
  code: string;

  /** 만료일 */
  expiresAt?: string;

  /** 접근 횟수 제한 */
  accessLimit?: number;

  /** 현재 접근 횟수 */
  accessCount: number;
}

/**
 * 채택 정보
 */
export interface AdoptionRecord {
  /** 채택한 규칙 ID */
  ruleId: string;

  /** 원본 패키지 ID */
  sourcePackageId: string;

  /** 채택 버전 */
  adoptedVersion: string;

  /** 채택일 */
  adoptedAt: string;

  /** 최신 버전과의 차이 */
  outdated: boolean;

  /** 로컬 수정 여부 */
  locallyModified: boolean;
}

/**
 * 공유 서비스 설정
 */
export interface RuleSharingConfig {
  /** 공유 저장소 경로 */
  repositoryPath: string;

  /** 기본 공개 범위 */
  defaultVisibility: RuleVisibility;

  /** 공유 URL 기본 호스트 */
  shareHost?: string;

  /** 패키지 서명 키 (선택적) */
  signingKey?: string;
}

/**
 * 가져오기 옵션
 */
export interface ImportOptions {
  /** 충돌 시 처리 방법 */
  onConflict: 'skip' | 'overwrite' | 'rename' | 'ask';

  /** 로컬 복사본 생성 여부 */
  createLocalCopy: boolean;

  /** 의존성 함께 가져오기 */
  includeDependencies: boolean;

  /** 검증 건너뛰기 */
  skipValidation: boolean;
}

/**
 * 내보내기 옵션
 */
export interface ExportOptions {
  /** 의존성 포함 여부 */
  includeDependencies: boolean;

  /** 예시 코드 포함 여부 */
  includeExamples: boolean;

  /** 변경 이력 포함 여부 */
  includeChangelog: boolean;

  /** 압축 여부 */
  compress: boolean;
}

/**
 * 가져오기 결과
 */
export interface ImportResult {
  success: boolean;
  imported: string[];
  skipped: string[];
  errors: Array<{ ruleId: string; error: string }>;
}

// ============================================================================
// Rule Sharing Service
// ============================================================================

export class RuleSharingService {
  private config: RuleSharingConfig;
  private adoptionRecords: Map<string, AdoptionRecord> = new Map();
  private shareUrls: Map<string, ShareUrl> = new Map();

  constructor(config: RuleSharingConfig) {
    this.config = config;
    this.ensureRepositoryExists();
    this.loadAdoptionRecords();
  }

  // --------------------------------------------------------------------------
  // Package Export
  // --------------------------------------------------------------------------

  /**
   * 규칙들을 패키지로 내보내기
   */
  async exportPackage(
    rules: Rule[],
    packageInfo: {
      name: string;
      description?: string;
      version?: string;
      author: string;
      tags?: string[];
    },
    options?: Partial<ExportOptions>
  ): Promise<RulePackage> {
    const opts: ExportOptions = {
      includeDependencies: true,
      includeExamples: true,
      includeChangelog: false,
      compress: false,
      ...options,
    };

    // 규칙 정제
    const cleanedRules = rules.map(rule => this.cleanRuleForExport(rule, opts));

    // 패키지 생성
    const pkg: RulePackage = {
      id: this.generatePackageId(packageInfo.name),
      name: packageInfo.name,
      description: packageInfo.description,
      version: packageInfo.version || '1.0.0',
      author: packageInfo.author,
      rules: cleanedRules,
      createdAt: new Date().toISOString(),
      tags: packageInfo.tags,
      checksum: '', // 아래에서 계산
    };

    // 체크섬 계산
    pkg.checksum = this.calculateChecksum(pkg);

    return pkg;
  }

  /**
   * 패키지를 파일로 저장
   */
  async savePackageToFile(pkg: RulePackage, filePath: string): Promise<void> {
    const content = JSON.stringify(pkg, null, 2);
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 패키지를 JSON 문자열로 변환
   */
  packageToJson(pkg: RulePackage): string {
    return JSON.stringify(pkg, null, 2);
  }

  /**
   * 패키지를 Base64로 인코딩 (URL 안전)
   */
  packageToBase64(pkg: RulePackage): string {
    const json = JSON.stringify(pkg);
    return Buffer.from(json).toString('base64url');
  }

  // --------------------------------------------------------------------------
  // Package Import
  // --------------------------------------------------------------------------

  /**
   * 파일에서 패키지 가져오기
   */
  async importFromFile(
    filePath: string,
    options?: Partial<ImportOptions>
  ): Promise<ImportResult> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const pkg = JSON.parse(content) as RulePackage;
    return this.importPackage(pkg, options);
  }

  /**
   * JSON에서 패키지 가져오기
   */
  async importFromJson(
    json: string,
    options?: Partial<ImportOptions>
  ): Promise<ImportResult> {
    const pkg = JSON.parse(json) as RulePackage;
    return this.importPackage(pkg, options);
  }

  /**
   * Base64에서 패키지 가져오기
   */
  async importFromBase64(
    base64: string,
    options?: Partial<ImportOptions>
  ): Promise<ImportResult> {
    const json = Buffer.from(base64, 'base64url').toString('utf-8');
    return this.importFromJson(json, options);
  }

  /**
   * 패키지 가져오기
   */
  async importPackage(
    pkg: RulePackage,
    options?: Partial<ImportOptions>
  ): Promise<ImportResult> {
    const opts: ImportOptions = {
      onConflict: 'skip',
      createLocalCopy: true,
      includeDependencies: true,
      skipValidation: false,
      ...options,
    };

    const result: ImportResult = {
      success: true,
      imported: [],
      skipped: [],
      errors: [],
    };

    // 체크섬 검증
    if (!opts.skipValidation) {
      const expectedChecksum = pkg.checksum;
      const pkgWithoutChecksum = { ...pkg, checksum: '' };
      const actualChecksum = this.calculateChecksum(pkgWithoutChecksum);

      if (expectedChecksum !== actualChecksum) {
        throw new RulebookError(
          'Package checksum mismatch - package may be corrupted',
          'CHECKSUM_MISMATCH'
        );
      }
    }

    // 규칙 가져오기
    for (const rule of pkg.rules) {
      try {
        const existingRule = await this.findLocalRule(rule.id);

        if (existingRule) {
          switch (opts.onConflict) {
            case 'skip':
              result.skipped.push(rule.id);
              continue;
            case 'overwrite':
              // 덮어쓰기 진행
              break;
            case 'rename':
              rule.id = `${rule.id}-imported-${Date.now()}`;
              break;
            case 'ask':
              // 실제 구현에서는 콜백 또는 이벤트로 처리
              result.skipped.push(rule.id);
              continue;
          }
        }

        // 규칙 저장
        await this.saveLocalRule(rule, pkg.id);
        result.imported.push(rule.id);

        // 채택 기록
        this.recordAdoption(rule.id, pkg.id, pkg.version);
      } catch (error) {
        result.errors.push({
          ruleId: rule.id,
          error: error instanceof Error ? error.message : String(error),
        });
        result.success = false;
      }
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Sharing URLs
  // --------------------------------------------------------------------------

  /**
   * 공유 URL 생성
   */
  generateShareUrl(
    pkg: RulePackage,
    options?: {
      expiresIn?: number; // 밀리초
      accessLimit?: number;
    }
  ): ShareUrl {
    const code = this.generateShareCode();
    const host = this.config.shareHost || 'https://monol.dev/share';

    const shareUrl: ShareUrl = {
      url: `${host}/${code}`,
      code,
      accessCount: 0,
      expiresAt: options?.expiresIn
        ? new Date(Date.now() + options.expiresIn).toISOString()
        : undefined,
      accessLimit: options?.accessLimit,
    };

    // 저장 (실제 구현에서는 DB 또는 원격 서버에 저장)
    this.shareUrls.set(code, shareUrl);
    this.saveShareData(code, pkg);

    return shareUrl;
  }

  /**
   * 공유 코드로 패키지 가져오기
   */
  async fetchByShareCode(code: string): Promise<RulePackage | null> {
    const shareUrl = this.shareUrls.get(code);

    if (!shareUrl) {
      return null;
    }

    // 만료 확인
    if (shareUrl.expiresAt && new Date(shareUrl.expiresAt) < new Date()) {
      this.shareUrls.delete(code);
      return null;
    }

    // 접근 제한 확인
    if (
      shareUrl.accessLimit &&
      shareUrl.accessCount >= shareUrl.accessLimit
    ) {
      return null;
    }

    // 접근 카운트 증가
    shareUrl.accessCount++;

    return this.loadShareData(code);
  }

  // --------------------------------------------------------------------------
  // Adoption Tracking
  // --------------------------------------------------------------------------

  /**
   * 채택 기록
   */
  recordAdoption(
    ruleId: string,
    sourcePackageId: string,
    adoptedVersion: string
  ): void {
    const record: AdoptionRecord = {
      ruleId,
      sourcePackageId,
      adoptedVersion,
      adoptedAt: new Date().toISOString(),
      outdated: false,
      locallyModified: false,
    };

    this.adoptionRecords.set(ruleId, record);
    this.saveAdoptionRecords();
  }

  /**
   * 채택 기록 조회
   */
  getAdoptionRecord(ruleId: string): AdoptionRecord | undefined {
    return this.adoptionRecords.get(ruleId);
  }

  /**
   * 모든 채택 기록 조회
   */
  getAllAdoptionRecords(): AdoptionRecord[] {
    return Array.from(this.adoptionRecords.values());
  }

  /**
   * 업데이트 확인
   */
  async checkForUpdates(
    ruleId: string,
    currentVersion: string
  ): Promise<{
    hasUpdate: boolean;
    latestVersion?: string;
    changelog?: string[];
  }> {
    const record = this.adoptionRecords.get(ruleId);

    if (!record) {
      return { hasUpdate: false };
    }

    // 실제 구현에서는 원격 저장소에서 최신 버전 확인
    // 여기서는 간단한 버전 비교만 수행
    return {
      hasUpdate: record.adoptedVersion !== currentVersion,
      latestVersion: currentVersion,
    };
  }

  /**
   * 로컬 수정 표시
   */
  markAsModified(ruleId: string): void {
    const record = this.adoptionRecords.get(ruleId);
    if (record) {
      record.locallyModified = true;
      this.saveAdoptionRecords();
    }
  }

  // --------------------------------------------------------------------------
  // Shared Rule Conversion
  // --------------------------------------------------------------------------

  /**
   * 일반 Rule을 SharedRule로 변환
   */
  toSharedRule(
    rule: Rule,
    options: {
      teamId: string;
      visibility?: RuleVisibility;
      author?: string;
    }
  ): SharedRule {
    const collaboration: RuleCollaboration = {
      forkCount: 0,
      adoptionCount: 0,
      upvotes: 0,
      viewCount: 0,
    };

    return {
      ...rule,
      teamId: options.teamId,
      visibility: options.visibility || this.config.defaultVisibility,
      collaboration,
      publishedAt: new Date().toISOString(),
      listedInMarketplace: false,
    };
  }

  /**
   * SharedRule을 일반 Rule로 변환
   */
  fromSharedRule(sharedRule: SharedRule): Rule {
    // SharedRule에서 공유 관련 필드 제거
    const {
      teamId,
      visibility,
      collaboration,
      origin,
      publishedAt,
      listedInMarketplace,
      ...rule
    } = sharedRule;

    return rule;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private ensureRepositoryExists(): void {
    if (!fs.existsSync(this.config.repositoryPath)) {
      fs.mkdirSync(this.config.repositoryPath, { recursive: true });
    }
  }

  private generatePackageId(name: string): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${safeName}-${timestamp}-${random}`;
  }

  private generateShareCode(): string {
    return crypto.randomBytes(6).toString('base64url');
  }

  private calculateChecksum(pkg: Omit<RulePackage, 'checksum'>): string {
    const content = JSON.stringify(pkg);
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  private cleanRuleForExport(rule: Rule, options: ExportOptions): Rule {
    const cleaned = { ...rule };

    if (!options.includeExamples) {
      delete cleaned.examples;
    }

    if (!options.includeChangelog && cleaned.metadata) {
      const { changelog, ...rest } = cleaned.metadata as RuleMetadata;
      cleaned.metadata = rest;
    }

    return cleaned;
  }

  private async findLocalRule(ruleId: string): Promise<Rule | null> {
    const filePath = path.join(
      this.config.repositoryPath,
      'rules',
      `${ruleId}.json`
    );

    if (fs.existsSync(filePath)) {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    }

    return null;
  }

  private async saveLocalRule(rule: Rule, sourcePackageId: string): Promise<void> {
    const rulesDir = path.join(this.config.repositoryPath, 'rules');

    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    const filePath = path.join(rulesDir, `${rule.id}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(rule, null, 2), 'utf-8');
  }

  private loadAdoptionRecords(): void {
    const filePath = path.join(this.config.repositoryPath, 'adoptions.json');

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const records = JSON.parse(content) as AdoptionRecord[];
        this.adoptionRecords = new Map(records.map(r => [r.ruleId, r]));
      } catch {
        // 파일 손상 시 빈 맵으로 시작
        this.adoptionRecords = new Map();
      }
    }
  }

  private saveAdoptionRecords(): void {
    const filePath = path.join(this.config.repositoryPath, 'adoptions.json');
    const records = Array.from(this.adoptionRecords.values());
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf-8');
  }

  private saveShareData(code: string, pkg: RulePackage): void {
    const shareDir = path.join(this.config.repositoryPath, 'shares');

    if (!fs.existsSync(shareDir)) {
      fs.mkdirSync(shareDir, { recursive: true });
    }

    const filePath = path.join(shareDir, `${code}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2), 'utf-8');
  }

  private loadShareData(code: string): RulePackage | null {
    const filePath = path.join(
      this.config.repositoryPath,
      'shares',
      `${code}.json`
    );

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }

    return null;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let defaultService: RuleSharingService | null = null;

/**
 * 공유 서비스 인스턴스 가져오기
 */
export function getRuleSharingService(config?: RuleSharingConfig): RuleSharingService {
  if (!defaultService) {
    const defaultConfig: RuleSharingConfig = config || {
      repositoryPath: path.join(
        process.env.HOME || '~',
        '.config',
        'monol',
        'rulebook-share'
      ),
      defaultVisibility: 'public',
      shareHost: 'https://monol.dev/share',
    };

    defaultService = new RuleSharingService(defaultConfig);
  }

  return defaultService;
}

/**
 * 빠른 패키지 내보내기
 */
export async function quickExportRules(
  rules: Rule[],
  author: string,
  packageName?: string
): Promise<RulePackage> {
  const service = getRuleSharingService();
  return service.exportPackage(rules, {
    name: packageName || `rules-${Date.now()}`,
    author,
  });
}

/**
 * 빠른 패키지 가져오기
 */
export async function quickImportRules(
  source: string, // 파일 경로, JSON, 또는 Base64
  options?: Partial<ImportOptions>
): Promise<ImportResult> {
  const service = getRuleSharingService();

  // 파일 경로인지 확인
  if (fs.existsSync(source)) {
    return service.importFromFile(source, options);
  }

  // JSON인지 확인
  try {
    JSON.parse(source);
    return service.importFromJson(source, options);
  } catch {
    // Base64로 시도
    return service.importFromBase64(source, options);
  }
}
