/**
 * Monol Rulebook - Error Classes
 *
 * 구조화된 에러 클래스로 디버깅 정보 개선
 */

// ============================================================================
// Base Error Class
// ============================================================================

export interface ErrorContext {
  file?: string;
  line?: number;
  column?: number;
  snippet?: string;
  suggestion?: string;
  docs?: string;
}

/**
 * Rulebook 기본 에러 클래스
 */
export class RulebookError extends Error {
  readonly code: string;
  readonly context: ErrorContext;
  readonly timestamp: string;

  constructor(
    code: string,
    message: string,
    context: ErrorContext = {}
  ) {
    super(message);
    this.name = 'RulebookError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Error.captureStackTrace가 있으면 사용 (V8 엔진)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 에러 정보를 포맷된 문자열로 반환
   */
  format(): string {
    const lines: string[] = [];

    lines.push(`[${this.code}] ${this.message}`);

    if (this.context.file) {
      const location = this.context.line
        ? `${this.context.file}:${this.context.line}${this.context.column ? `:${this.context.column}` : ''}`
        : this.context.file;
      lines.push(`  위치: ${location}`);
    }

    if (this.context.snippet) {
      lines.push('');
      lines.push('  문제 부분:');
      const snippetLines = this.context.snippet.split('\n');
      for (const line of snippetLines) {
        lines.push(`    ${line}`);
      }
    }

    if (this.context.suggestion) {
      lines.push('');
      lines.push(`  💡 제안: ${this.context.suggestion}`);
    }

    if (this.context.docs) {
      lines.push(`  📚 문서: ${this.context.docs}`);
    }

    return lines.join('\n');
  }

  /**
   * JSON 직렬화용
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ============================================================================
// YAML Parsing Errors
// ============================================================================

/**
 * YAML 파싱 에러
 */
export class YAMLParseError extends RulebookError {
  constructor(
    message: string,
    file: string,
    options: {
      line?: number;
      column?: number;
      snippet?: string;
      yamlError?: Error;
    } = {}
  ) {
    const suggestion = 'YAML 문법을 확인하세요. 들여쓰기와 콜론 뒤 공백에 주의하세요.';

    super('YAML_PARSE_ERROR', message, {
      file,
      line: options.line,
      column: options.column,
      snippet: options.snippet,
      suggestion,
      docs: 'https://yaml.org/spec/1.2/spec.html',
    });

    this.name = 'YAMLParseError';
  }

  /**
   * yaml 라이브러리 에러에서 YAMLParseError 생성
   */
  static fromYAMLError(error: Error, file: string, content?: string): YAMLParseError {
    // yaml 라이브러리의 에러 메시지에서 라인 정보 추출
    const lineMatch = error.message.match(/at line (\d+)/);
    const columnMatch = error.message.match(/column (\d+)/);

    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    const column = columnMatch ? parseInt(columnMatch[1], 10) : undefined;

    // 문제 부분 스니펫 추출
    let snippet: string | undefined;
    if (content && line) {
      const lines = content.split('\n');
      const start = Math.max(0, line - 2);
      const end = Math.min(lines.length, line + 2);
      snippet = lines
        .slice(start, end)
        .map((l, i) => {
          const lineNum = start + i + 1;
          const marker = lineNum === line ? '> ' : '  ';
          return `${marker}${lineNum.toString().padStart(4)} | ${l}`;
        })
        .join('\n');
    }

    return new YAMLParseError(error.message, file, {
      line,
      column,
      snippet,
      yamlError: error,
    });
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

/**
 * 규칙 유효성 검사 에러
 */
export class ValidationError extends RulebookError {
  readonly field?: string;
  readonly expected?: string;
  readonly received?: string;

  constructor(
    message: string,
    options: {
      file?: string;
      field?: string;
      expected?: string;
      received?: string;
      ruleId?: string;
    } = {}
  ) {
    const suggestion = options.field
      ? `'${options.field}' 필드를 확인하세요.${options.expected ? ` 예상: ${options.expected}` : ''}`
      : '규칙 필드를 확인하세요.';

    super('VALIDATION_ERROR', message, {
      file: options.file,
      suggestion,
    });

    this.name = 'ValidationError';
    this.field = options.field;
    this.expected = options.expected;
    this.received = options.received;
  }

  /**
   * 필수 필드 누락 에러
   */
  static missingRequired(field: string, file?: string, ruleId?: string): ValidationError {
    return new ValidationError(
      `필수 필드가 누락되었습니다: ${field}`,
      { file, field, ruleId }
    );
  }

  /**
   * 잘못된 타입 에러
   */
  static invalidType(
    field: string,
    expected: string,
    received: string,
    file?: string
  ): ValidationError {
    return new ValidationError(
      `'${field}' 필드의 타입이 올바르지 않습니다`,
      { file, field, expected, received }
    );
  }

  /**
   * 잘못된 값 에러
   */
  static invalidValue(
    field: string,
    expected: string,
    received: string,
    file?: string
  ): ValidationError {
    return new ValidationError(
      `'${field}' 필드의 값이 올바르지 않습니다`,
      { file, field, expected, received }
    );
  }
}

// ============================================================================
// Dependency Errors
// ============================================================================

/**
 * 의존성 관련 에러
 */
export class DependencyError extends RulebookError {
  readonly cycle?: string[];
  readonly missingDependencies?: string[];
  readonly conflicts?: [string, string][];

  constructor(
    message: string,
    options: {
      file?: string;
      cycle?: string[];
      missingDependencies?: string[];
      conflicts?: [string, string][];
    } = {}
  ) {
    let suggestion: string;
    if (options.cycle) {
      suggestion = `순환 의존성을 해결하세요: ${options.cycle.join(' → ')}`;
    } else if (options.missingDependencies) {
      suggestion = `누락된 의존성을 추가하세요: ${options.missingDependencies.join(', ')}`;
    } else if (options.conflicts) {
      suggestion = '충돌하는 규칙 중 하나를 비활성화하세요.';
    } else {
      suggestion = '의존성 설정을 확인하세요.';
    }

    super('DEPENDENCY_ERROR', message, {
      file: options.file,
      suggestion,
    });

    this.name = 'DependencyError';
    this.cycle = options.cycle;
    this.missingDependencies = options.missingDependencies;
    this.conflicts = options.conflicts;
  }

  /**
   * 순환 의존성 에러
   */
  static circularDependency(cycle: string[]): DependencyError {
    return new DependencyError(
      `순환 의존성이 발견되었습니다: ${cycle.join(' → ')}`,
      { cycle }
    );
  }

  /**
   * 누락된 의존성 에러
   */
  static missingDependency(ruleId: string, missing: string[]): DependencyError {
    return new DependencyError(
      `규칙 '${ruleId}'에 필요한 의존성이 없습니다: ${missing.join(', ')}`,
      { missingDependencies: missing }
    );
  }

  /**
   * 규칙 충돌 에러
   */
  static ruleConflict(ruleA: string, ruleB: string): DependencyError {
    return new DependencyError(
      `규칙 '${ruleA}'와 '${ruleB}'가 충돌합니다`,
      { conflicts: [[ruleA, ruleB]] }
    );
  }
}

// ============================================================================
// Sync Errors
// ============================================================================

/**
 * 동기화 관련 에러
 */
export class SyncError extends RulebookError {
  readonly platform?: string;
  readonly direction?: 'push' | 'pull';

  constructor(
    message: string,
    options: {
      platform?: string;
      direction?: 'push' | 'pull';
      file?: string;
    } = {}
  ) {
    const suggestion = options.direction === 'pull'
      ? '플랫폼 파일의 형식을 확인하세요.'
      : '쓰기 권한과 경로를 확인하세요.';

    super('SYNC_ERROR', message, {
      file: options.file,
      suggestion,
    });

    this.name = 'SyncError';
    this.platform = options.platform;
    this.direction = options.direction;
  }

  /**
   * 플랫폼 파싱 에러
   */
  static parseError(platform: string, file: string, details?: string): SyncError {
    return new SyncError(
      `${platform} 파일을 파싱할 수 없습니다${details ? `: ${details}` : ''}`,
      { platform, direction: 'pull', file }
    );
  }

  /**
   * 쓰기 에러
   */
  static writeError(platform: string, file: string, reason?: string): SyncError {
    return new SyncError(
      `${platform}에 쓸 수 없습니다${reason ? `: ${reason}` : ''}`,
      { platform, direction: 'push', file }
    );
  }
}

// ============================================================================
// Version Errors
// ============================================================================

/**
 * 버전 관련 에러
 */
export class VersionError extends RulebookError {
  readonly ruleId?: string;
  readonly version?: string;

  constructor(
    message: string,
    options: {
      ruleId?: string;
      version?: string;
      file?: string;
    } = {}
  ) {
    super('VERSION_ERROR', message, {
      file: options.file,
      suggestion: '규칙의 버전 정보를 확인하세요.',
    });

    this.name = 'VersionError';
    this.ruleId = options.ruleId;
    this.version = options.version;
  }

  /**
   * 버전을 찾을 수 없음
   */
  static notFound(ruleId: string, version: string): VersionError {
    return new VersionError(
      `규칙 '${ruleId}'의 버전 '${version}'을 찾을 수 없습니다`,
      { ruleId, version }
    );
  }

  /**
   * 잘못된 버전 형식
   */
  static invalidFormat(version: string): VersionError {
    return new VersionError(
      `잘못된 버전 형식입니다: '${version}'. semver 형식을 사용하세요 (예: 1.0.0)`,
      { version }
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 에러가 RulebookError인지 확인
 */
export function isRulebookError(error: unknown): error is RulebookError {
  return error instanceof RulebookError;
}

/**
 * 에러 코드로 분류
 */
export function categorizeError(error: unknown): string {
  if (error instanceof YAMLParseError) return 'yaml';
  if (error instanceof ValidationError) return 'validation';
  if (error instanceof DependencyError) return 'dependency';
  if (error instanceof SyncError) return 'sync';
  if (error instanceof VersionError) return 'version';
  if (error instanceof RulebookError) return 'rulebook';
  return 'unknown';
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function formatError(error: unknown): string {
  if (error instanceof RulebookError) {
    return error.format();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export default {
  RulebookError,
  YAMLParseError,
  ValidationError,
  DependencyError,
  SyncError,
  VersionError,
  isRulebookError,
  categorizeError,
  formatError,
};
