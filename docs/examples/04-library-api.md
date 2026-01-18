# 라이브러리 API 예시

monol-rulebook 라이브러리를 프로그래매틱하게 사용하는 방법을 설명합니다.

## 설치 및 임포트

```typescript
import {
  // Core
  RulebookManager,
  RuleSearch,
  RuleVersioning,
  SyncManager,

  // Adapters
  getAdapter,
  getAvailableAdapters,
  CursorAdapter,
  ClaudeAdapter,

  // Errors
  RulebookError,
  YAMLParseError,
  ValidationError,
  DependencyError,
  SyncError,
  VersionError,
  isRulebookError,
  formatError,

  // Utils
  generateRuleId,
  validateRule,
  createRuleTemplate,
  formatSyncDiff,
  formatConflicts,

  // Types
  Rule,
  RuleMetadata,
  RuleDependencies,
  RuleCondition,
  LoadedRules,
  SyncResult,
} from 'monol-rulebook/lib';
```

---

## 1. RulebookManager - 규칙 관리

### 초기화

```typescript
const workspacePath = process.cwd();
const manager = new RulebookManager(workspacePath);
```

### 규칙 로드

```typescript
// 경로에 적용 가능한 모든 규칙 로드 (계층적 병합)
const loaded = await manager.loadRulesForPath(workspacePath);

console.log(`로드된 규칙: ${loaded.rules.length}개`);
console.log(`소스 파일: ${loaded.sources.length}개`);

// 결과 구조
// loaded: {
//   rules: Rule[],
//   sources: string[],      // 로드된 파일 경로들
//   errors: LoadError[],    // 로드 중 발생한 에러
//   metadata: {
//     loadedAt: string,
//     workspacePath: string,
//   }
// }
```

### 규칙 저장

```typescript
import { createRuleTemplate, generateRuleId } from 'monol-rulebook/lib';

// 템플릿으로 새 규칙 생성
const newRule = createRuleTemplate({
  name: '새로운 규칙',
  category: 'code/style',
  severity: 'warning',
  description: '규칙 설명입니다.',
  tags: ['style', 'new'],
});

// ID 자동 생성
newRule.id = generateRuleId(newRule.name, newRule.category);
// → "new-rule-001"

// 저장
const result = await manager.saveRule(newRule, 'code');
console.log(`저장 완료: ${result.path}`);
```

### 규칙 병합

```typescript
// 여러 소스의 규칙 병합 (나중에 로드된 것이 우선)
const baseRules = await manager.loadRulesFromDirectory('~/.config/monol/rules');
const projectRules = await manager.loadRulesFromDirectory('./rules');

const merged = manager.mergeRules([baseRules.rules, projectRules.rules]);
// 동일 ID의 규칙은 projectRules가 우선
```

### 의존성 관리

```typescript
// 의존성 그래프 구축
const graph = manager.buildDependencyGraph();

console.log('노드 수:', graph.nodes.size);
console.log('순환 의존성:', graph.cycles);
console.log('충돌 쌍:', graph.conflictPairs);

// 순환 의존성 감지
const cycles = manager.detectCircularDependencies();
if (cycles.length > 0) {
  console.error('순환 의존성 발견:');
  cycles.forEach(cycle => {
    console.error(`  ${cycle.join(' → ')} → ${cycle[0]}`);
  });
}

// 의존성 순서로 정렬 (위상 정렬)
const sorted = manager.sortByDependencies(loaded.rules);
// requires가 있는 규칙은 해당 규칙 뒤에 배치

// 충돌 검사
const conflicts = manager.checkConflicts();
if (!conflicts.valid) {
  console.error('충돌하는 규칙 쌍:');
  conflicts.pairs.forEach(([a, b]) => {
    console.error(`  ${a} ↔ ${b}`);
  });
}

// 단일 규칙 의존성 검증
const validation = manager.validateDependencies(newRule);
if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(error.format());
  });
}
```

---

## 2. RuleSearch - 규칙 검색

### 초기화

```typescript
const search = new RuleSearch(loaded.rules);
```

### 키워드 검색

```typescript
// 기본 키워드 검색 (이름, 설명, 태그에서 검색)
const results = search.searchByKeyword('naming');

results.forEach(result => {
  console.log(`${result.rule.id}: ${result.rule.name}`);
  console.log(`  점수: ${result.score}`);
  console.log(`  매칭: ${result.matches.join(', ')}`);
});
```

### 태그 검색

```typescript
// 단일 태그
const byTag = search.searchByTags(['security']);

// 복수 태그 (AND 조건)
const byMultipleTags = search.searchByTags(['security', 'owasp']);

// OR 조건
const byAnyTag = search.searchByTags(['security', 'performance'], { matchAll: false });
```

### 카테고리 검색

```typescript
// 정확한 카테고리
const codeStyle = search.searchByCategory('code/style');

// 상위 카테고리 (하위 포함)
const allCode = search.searchByCategory('code', { includeSubcategories: true });
// code/style, code/naming, code/typescript 모두 포함
```

### 복합 조건 검색

```typescript
const results = search.search({
  keyword: 'strict',
  category: 'code',
  tags: ['typescript'],
  severity: 'error',
  enabled: true,
  minScore: 30,
});

console.log(`${results.length}개 결과`);
```

### 유사 규칙 찾기

```typescript
// 기준 규칙과 유사한 규칙 찾기
const similar = search.findSimilar(targetRule, {
  threshold: 0.5,  // 최소 유사도 (0-1)
  limit: 5,        // 최대 결과 수
});

similar.forEach(({ rule, similarity }) => {
  console.log(`${rule.id}: ${(similarity * 100).toFixed(1)}% 유사`);
});
```

### 유사도 계산

```typescript
// 두 규칙 간 유사도 계산
const similarity = search.calculateSimilarity(ruleA, ruleB);
console.log(`유사도: ${(similarity * 100).toFixed(1)}%`);

// 유사도 계산 방식:
// - 이름: n-gram 유사도 (0.3 가중치)
// - 설명: n-gram 유사도 (0.2 가중치)
// - 태그: Jaccard 유사도 (0.3 가중치)
// - 카테고리: 일치 여부 (0.2 가중치)
```

### 통계

```typescript
import { getRuleStats, groupRulesByCategory } from 'monol-rulebook/lib';

const stats = getRuleStats(loaded.rules);
console.log('총 규칙 수:', stats.total);
console.log('심각도별:', stats.bySeverity);
console.log('상태별:', stats.byStatus);

const grouped = groupRulesByCategory(loaded.rules);
// { 'code/style': Rule[], 'code/naming': Rule[], ... }
```

---

## 3. RuleVersioning - 버전 관리

### 초기화

```typescript
const versioning = new RuleVersioning(workspacePath);
```

### 버전 생성

```typescript
// 규칙 수정 후 새 버전 생성
const updatedRule = await versioning.createVersion(
  rule,
  '상수 네이밍 규칙 추가',
  '@kent'
);

console.log(`새 버전: ${updatedRule.metadata?.version}`);
// → "1.1.0" (minor 증가)

// 버전 타입 지정
const majorUpdate = await versioning.createVersion(
  rule,
  '규칙 전면 개편',
  '@kent',
  'major'  // 'major' | 'minor' | 'patch'
);
// → "2.0.0"
```

### 이력 조회

```typescript
const history = await versioning.getHistory('naming-001');

history.forEach(entry => {
  console.log(`v${entry.version} (${entry.date}) - ${entry.author}`);
  console.log(`  ${entry.changes}`);
});
```

### 버전 비교

```typescript
const diff = await versioning.diff('naming-001', '1.0.0', '1.2.0');

console.log('변경된 필드:', Object.keys(diff.changes));
diff.changes.forEach(change => {
  console.log(`${change.field}:`);
  console.log(`  - ${JSON.stringify(change.oldValue)}`);
  console.log(`  + ${JSON.stringify(change.newValue)}`);
});
```

### 롤백

```typescript
// 특정 버전으로 롤백
const rolledBack = await versioning.rollback('naming-001', '1.1.0');

// 롤백도 새 버전으로 기록됨 (1.2.0 → 1.2.1)
console.log(`롤백 후 버전: ${rolledBack.metadata?.version}`);
```

### 버전 유틸리티

```typescript
import { parseVersion, formatDiff } from 'monol-rulebook/lib';

// 버전 파싱
const version = parseVersion('1.2.3');
// { major: 1, minor: 2, patch: 3 }

// 버전 증가
const newVersion = versioning.incrementVersion('1.2.3', 'minor');
// → "1.3.0"

// 버전 비교
const comparison = versioning.compareVersions('1.2.0', '1.10.0');
// → -1 (첫 번째가 더 낮음)

// Diff 포맷팅
const formatted = formatDiff(diff);
console.log(formatted);
```

---

## 4. SyncManager - 플랫폼 동기화

### 초기화

```typescript
const syncManager = new SyncManager(workspacePath);
```

### Push (로컬 → 플랫폼)

```typescript
const result = await syncManager.sync('cursor', 'push');

if (result.success) {
  console.log(`동기화 완료: ${result.outputPath}`);
  console.log(`규칙 수: ${result.rulesCount}`);
} else {
  console.error(`동기화 실패: ${result.error}`);
}
```

### Pull (플랫폼 → 로컬)

```typescript
const rules = await syncManager.pullFromPlatform('cursor');

console.log(`가져온 규칙: ${rules.length}개`);

// 로컬에 저장
for (const rule of rules) {
  await manager.saveRule(rule, 'imported');
}
```

### Diff (차이점 비교)

```typescript
const diff = await syncManager.diff('cursor');

console.log('로컬에만 있는 규칙:', diff.localOnly);
console.log('플랫폼에만 있는 규칙:', diff.remoteOnly);
console.log('내용이 다른 규칙:', diff.different.map(d => d.ruleId));
console.log('동일한 규칙:', diff.identical);

// 포맷팅
import { formatSyncDiff } from 'monol-rulebook/lib';
console.log(formatSyncDiff(diff));
```

### 양방향 동기화

```typescript
const result = await syncManager.sync('cursor', 'both');

if (result.conflicts.length > 0) {
  console.log('충돌 발견:', result.conflicts.length);

  // 충돌 해결 (예: 로컬 우선)
  const resolved = result.conflicts.map(conflict => ({
    ruleId: conflict.ruleId,
    resolution: 'local' as const,
  }));

  // 해결된 충돌로 다시 동기화
  const finalResult = await syncManager.resolveAndSync('cursor', resolved);
}
```

### 병합 (수동)

```typescript
const localRules = loaded.rules;
const remoteRules = await syncManager.pullFromPlatform('cursor');

const { merged, conflicts } = syncManager.merge(localRules, remoteRules);

if (conflicts.length > 0) {
  import { formatConflicts } from 'monol-rulebook/lib';
  console.log(formatConflicts(conflicts));
}
```

---

## 5. Platform Adapters - 플랫폼 어댑터

### 어댑터 사용

```typescript
import { getAdapter, getAvailableAdapters } from 'monol-rulebook/lib';

// 사용 가능한 어댑터 목록
const adapters = getAvailableAdapters();
// → ['cursor', 'claude']

// 어댑터 가져오기
const cursorAdapter = getAdapter('cursor', workspacePath);

// 규칙 포맷팅
const formatted = cursorAdapter.format(loaded.rules);
console.log(formatted);  // Markdown 형식

// 파일 쓰기
await cursorAdapter.write(loaded.rules);
// → .cursorrules 파일 생성

// 파일 읽기
const content = await cursorAdapter.read();
```

### 커스텀 어댑터

```typescript
import { BasePlatformAdapter, registerAdapter } from 'monol-rulebook/lib';

class MyPlatformAdapter extends BasePlatformAdapter {
  readonly platformName = 'myplatform';
  readonly outputPath = '.myplatform-rules';

  format(rules: Rule[]): string {
    // 커스텀 포맷으로 변환
    return rules.map(r => `[${r.id}] ${r.name}`).join('\n');
  }

  parse(content: string): Rule[] {
    // 커스텀 포맷 파싱
    const lines = content.split('\n');
    return lines.map(line => {
      const match = line.match(/\[(.+)\] (.+)/);
      if (match) {
        return {
          id: match[1],
          name: match[2],
          // ... 기본값
        } as Rule;
      }
      return null;
    }).filter(Boolean) as Rule[];
  }
}

// 어댑터 등록
registerAdapter('myplatform', MyPlatformAdapter);

// 사용
const myAdapter = getAdapter('myplatform', workspacePath);
```

---

## 6. 에러 처리

### 에러 타입

```typescript
import {
  RulebookError,
  YAMLParseError,
  ValidationError,
  DependencyError,
  SyncError,
  VersionError,
  isRulebookError,
  categorizeError,
  formatError,
} from 'monol-rulebook/lib';

try {
  await manager.loadRulesForPath(workspacePath);
} catch (error) {
  if (isRulebookError(error)) {
    // 구조화된 에러 처리
    console.error('코드:', error.code);
    console.error('메시지:', error.message);
    console.error('파일:', error.context.file);
    console.error('라인:', error.context.line);
    console.error('제안:', error.context.suggestion);

    // 포맷된 출력
    console.error(error.format());

    // 에러 분류
    const category = categorizeError(error);
    // → 'yaml' | 'validation' | 'dependency' | 'sync' | 'version' | 'unknown'
  } else {
    // 일반 에러
    console.error(error);
  }
}
```

### YAML 파싱 에러

```typescript
try {
  const rules = await manager.loadRulesFromFile('rules/invalid.yaml');
} catch (error) {
  if (error instanceof YAMLParseError) {
    console.error('YAML 파싱 실패');
    console.error('파일:', error.context.file);
    console.error('라인:', error.context.line);
    console.error('스니펫:', error.context.snippet);
    // 문제 부분 미리보기:
    // "  - invalid_yaml:
    //      missing: colon here"
  }
}
```

### 검증 에러

```typescript
const validation = validateRule(rule);

if (!validation.valid) {
  validation.errors.forEach(error => {
    if (error instanceof ValidationError) {
      console.error(`필드: ${error.context.field}`);
      console.error(`예상: ${error.context.expected}`);
      console.error(`실제: ${error.context.received}`);
    }
  });
}
```

### 의존성 에러

```typescript
try {
  manager.validateAllDependencies();
} catch (error) {
  if (error instanceof DependencyError) {
    if (error.code === 'CIRCULAR_DEPENDENCY') {
      console.error('순환 의존성:', error.context.cycle?.join(' → '));
    } else if (error.code === 'MISSING_DEPENDENCY') {
      console.error('누락된 의존성:', error.context.missing);
    } else if (error.code === 'RULE_CONFLICT') {
      console.error('충돌:', error.context.conflictPair);
    }
  }
}
```

### 동기화 에러

```typescript
try {
  await syncManager.sync('cursor', 'push');
} catch (error) {
  if (error instanceof SyncError) {
    console.error('동기화 실패');
    console.error('플랫폼:', error.context.platform);
    console.error('방향:', error.context.direction);
    console.error('원인:', error.message);
  }
}
```

---

## 7. 전체 예시: 규칙 관리 스크립트

```typescript
import {
  RulebookManager,
  RuleSearch,
  RuleVersioning,
  SyncManager,
  getAdapter,
  isRulebookError,
  formatError,
} from 'monol-rulebook/lib';

async function main() {
  const workspacePath = process.cwd();

  // 1. 매니저 초기화
  const manager = new RulebookManager(workspacePath);
  const versioning = new RuleVersioning(workspacePath);
  const syncManager = new SyncManager(workspacePath);

  try {
    // 2. 규칙 로드
    console.log('규칙 로드 중...');
    const loaded = await manager.loadRulesForPath(workspacePath);
    console.log(`${loaded.rules.length}개 규칙 로드됨`);

    // 에러 확인
    if (loaded.errors.length > 0) {
      console.warn('로드 중 에러 발생:');
      loaded.errors.forEach(e => console.warn(`  - ${e.file}: ${e.message}`));
    }

    // 3. 의존성 검증
    console.log('\n의존성 검증 중...');
    const cycles = manager.detectCircularDependencies();
    if (cycles.length > 0) {
      console.error('순환 의존성 발견!');
      cycles.forEach(c => console.error(`  ${c.join(' → ')}`));
      process.exit(1);
    }
    console.log('의존성 검증 통과');

    // 4. 검색 예시
    console.log('\n보안 관련 규칙 검색...');
    const search = new RuleSearch(loaded.rules);
    const securityRules = search.searchByTags(['security']);
    console.log(`${securityRules.length}개 보안 규칙 발견`);

    // 5. 플랫폼 동기화
    console.log('\nCursor에 동기화 중...');
    const syncResult = await syncManager.sync('cursor', 'push');
    if (syncResult.success) {
      console.log(`동기화 완료: ${syncResult.outputPath}`);
    }

    // 6. 변경 이력 출력
    console.log('\n최근 변경된 규칙:');
    for (const rule of loaded.rules.slice(0, 3)) {
      const history = await versioning.getHistory(rule.id);
      if (history.length > 0) {
        const latest = history[0];
        console.log(`  ${rule.id} v${latest.version}: ${latest.changes}`);
      }
    }

  } catch (error) {
    if (isRulebookError(error)) {
      console.error(formatError(error));
    } else {
      console.error('예상치 못한 에러:', error);
    }
    process.exit(1);
  }
}

main();
```

---

## 다음 단계

- [실전 워크플로우](./05-workflows.md) - 팀에서 규칙 관리하기
