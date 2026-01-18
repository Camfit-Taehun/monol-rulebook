# Monol Rulebook

YAML 기반 코딩 규칙을 Cursor, Claude Code 등 AI 코딩 도구에 동기화하는 CLI 도구입니다.

## 설치

### npm 글로벌 설치 (권장)

```bash
npm install -g monol-rulebook
```

### 로컬 설치 (개발용)

```bash
git clone https://github.com/kentjung/monol-rulebook.git
cd monol-rulebook
npm install
npm link  # 글로벌 명령어로 등록
```

## 사용법

### 1. 프로젝트 초기화

프로젝트 디렉토리에서:

```bash
monol-rulebook init
```

이 명령어는:
- `rules/` 폴더 생성 (없는 경우)
- `rules/.rulebook-config.yaml` 생성 (글로벌 규칙 상속 설정)
- `.cursorrules` 생성 (Cursor용)
- `CLAUDE.md` 생성/업데이트 (Claude Code용)

### 2. 규칙 작성

`rules/` 폴더에 YAML 형식으로 규칙을 작성합니다:

```yaml
# rules/code/naming.yaml
id: naming-001
name: 변수명 규칙
description: 변수명은 camelCase를 사용합니다
category: code/naming
tags: [naming, variables, style]
severity: warning  # error | warning | info
examples:
  good:
    - "const userName = 'kent'"
  bad:
    - "const user_name = 'kent'"
```

### 3. 동기화 (선택)

규칙을 플랫폼 형식으로 변환:

```bash
monol-rulebook sync        # 모든 플랫폼
monol-rulebook sync cursor # Cursor만
monol-rulebook sync claude # Claude Code만
```

> 일반적으로 `init`만 실행하면 됩니다. AI 도구가 `rules/` 폴더를 직접 읽습니다.

## 규칙 구조

```
rules/
├── .rulebook-config.yaml  # 설정 (글로벌 규칙 상속 등)
├── index.yaml             # 규칙 메타데이터 (선택)
├── code/                  # 코드 규칙
│   ├── naming.yaml
│   └── style.yaml
└── workflow/              # 워크플로우 규칙
    ├── git.yaml
    └── planning.yaml
```

## 계층적 규칙 상속

규칙은 다음 우선순위로 병합됩니다:

1. **패키지 레벨** (`./rules/`) - 최우선
2. **프로젝트 레벨** (`<project>/rules/`)
3. **글로벌 레벨** (`~/.config/monol/rules/`) - 기본값

`.rulebook-config.yaml`에서 상속 설정:

```yaml
inheritance:
  - path: ~/.config/monol/rules
    priority: 1
```

## 커맨드 (Claude Code 플러그인)

Claude Code에서 사용할 수 있는 슬래시 커맨드:

| 커맨드 | 설명 |
|--------|------|
| `/rule` | 규칙 조회 및 목록 |
| `/rule-add` | 대화형 규칙 추가 |
| `/rule-search <query>` | 규칙 검색 |
| `/rule-sync <platform>` | 플랫폼 동기화 |
| `/rule-history` | 변경 이력 조회 |

## 라이브러리 사용

```typescript
import { RulebookManager, RuleSearch } from 'monol-rulebook';

// 규칙 로드
const manager = new RulebookManager();
const rules = await manager.loadRulesForPath(process.cwd());

// 규칙 검색
const search = new RuleSearch(rules);
const results = search.searchByTags(['naming', 'style']);
```

## 개발

```bash
# 빌드
npm run build

# 타입 체크
npm run typecheck

# 배포 (빌드 + 타입체크)
npm run deploy
```

## 라이선스

MIT
