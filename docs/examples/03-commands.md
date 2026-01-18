# 커맨드 사용 예시

monol-rulebook의 5가지 핵심 커맨드 사용법을 상세히 설명합니다.

> **참고**: 모든 커맨드는 **Cursor 또는 Claude Code**에서 실행할 수 있습니다.
> 규칙은 `rules/*.yaml`에 저장되며, 두 도구 모두 같은 규칙을 읽습니다.

## 목차

1. [/rule - 규칙 조회](#1-rule---규칙-조회)
2. [/rule-add - 규칙 추가](#2-rule-add---규칙-추가)
3. [/rule-search - 규칙 검색](#3-rule-search---규칙-검색)
4. [/rule-sync - 플랫폼 형식 출력](#4-rule-sync---플랫폼-형식-출력)
5. [/rule-history - 변경 이력](#5-rule-history---변경-이력)

---

## 1. /rule - 규칙 조회

### 전체 목록 조회

```
/rule
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 규칙 목록
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

총 8개 규칙

code/naming (1개)
  ⚠️ naming-001: 변수명 규칙

code/style (2개)
  ⚠️ style-001: 코드 포맷팅 규칙
  ⚠️ import-order-001: Import 정렬 규칙

code/typescript (1개)
  🚫 ts-strict-001: TypeScript Strict 모드 필수

security (2개)
  🚫 security-secrets-001: 시크릿 노출 방지
  🚫 security-sql-001: SQL Injection 방지

workflow (2개)
  🚫 git-001: 커밋 메시지 규칙
  ⚠️ workflow-branch-001: 브랜치 네이밍 규칙

범례: 🚫 error  ⚠️ warning  ℹ️ info
```

### 카테고리별 필터링

```
/rule --category code
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 규칙 목록 (카테고리: code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

총 4개 규칙

code/naming (1개)
  ⚠️ naming-001: 변수명 규칙

code/style (2개)
  ⚠️ style-001: 코드 포맷팅 규칙
  ⚠️ import-order-001: Import 정렬 규칙

code/typescript (1개)
  🚫 ts-strict-001: TypeScript Strict 모드 필수
```

### 심각도별 필터링

```
/rule --severity error
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 규칙 목록 (심각도: error)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

총 4개 규칙

  🚫 ts-strict-001: TypeScript Strict 모드 필수
  🚫 security-secrets-001: 시크릿 노출 방지
  🚫 security-sql-001: SQL Injection 방지
  🚫 git-001: 커밋 메시지 규칙
```

### 특정 규칙 상세 조회

```
/rule naming-001
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 규칙 상세: naming-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이름: 변수명 규칙
카테고리: code/naming
심각도: ⚠️ warning
상태: active
버전: 1.0.0

설명:
  변수명, 함수명, 클래스명에 대한 네이밍 컨벤션입니다.

  - 변수/함수: camelCase
  - 클래스/타입: PascalCase
  - 상수: SCREAMING_SNAKE_CASE
  - 파일명: kebab-case

태그: naming, variables, functions, classes

✅ 좋은 예:
  const userName = 'kent';
  function getUserById(id: string) { }
  class UserService { }
  const MAX_RETRY_COUNT = 3;

❌ 나쁜 예:
  const user_name = 'kent';
  function GetUserById(id) { }
  class user_service { }
  const maxRetryCount = 3;

예외:
  - 외부 API 응답 객체의 snake_case 필드
  - 레거시 코드와의 호환성이 필요한 경우

관련 규칙: style-001
```

### 통계 조회

```
/rule --stats
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 규칙 통계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

총 규칙 수: 8개

심각도별:
  🚫 error: 4개 (50%)
  ⚠️ warning: 3개 (37.5%)
  ℹ️ info: 1개 (12.5%)

카테고리별:
  code: 4개
  security: 2개
  workflow: 2개

상태별:
  active: 7개
  draft: 1개
  deprecated: 0개

플랫폼 활성화:
  cursor: 8개
  claude: 8개
```

---

## 2. /rule-add - 규칙 추가

### 대화형 추가 (기본)

```
/rule-add
```

**대화 흐름:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 새 규칙 추가
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? 규칙 이름을 입력하세요:
> async/await 일관성 규칙

? 카테고리를 선택하세요:
  [1] code/style
  [2] code/naming
  [3] workflow
  [4] security
  [5] 직접 입력
> 1

? 규칙 설명을 입력하세요 (여러 줄 입력 가능, 빈 줄로 종료):
> Promise와 async/await를 혼용하지 마세요.
> 하나의 함수에서는 일관된 비동기 패턴을 사용합니다.
>

? 심각도를 선택하세요:
  [1] error - 반드시 수정 필요
  [2] warning - 권장 사항
  [3] info - 참고 정보
> 2

? 태그를 입력하세요 (쉼표로 구분):
> async, await, promise, consistency

? 좋은 예시를 입력하세요 (여러 줄 입력 가능, 빈 줄로 종료):
> async function fetchUser(id) {
>   const user = await api.getUser(id);
>   const posts = await api.getPosts(user.id);
>   return { user, posts };
> }
>

? 나쁜 예시를 입력하세요 (여러 줄 입력 가능, 빈 줄로 종료):
> async function fetchUser(id) {
>   const user = await api.getUser(id);
>   return api.getPosts(user.id).then(posts => ({ user, posts }));
> }
>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 유사한 규칙 발견
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다음 규칙과 유사합니다:
  - style-001 (유사도: 45%)

계속 진행하시겠습니까? [Y/n]
> Y

✅ 규칙이 생성되었습니다!

  ID: async-await-001
  파일: rules/code/async-await.yaml

💡 동기화: /rule-sync cursor
```

### 빠른 추가

```
/rule-add --quick "함수 최대 라인 수 제한" --category code/style --severity warning
```

**출력:**

```
✅ 규칙이 생성되었습니다!

  ID: func-lines-001
  이름: 함수 최대 라인 수 제한
  카테고리: code/style
  심각도: warning
  파일: rules/code/func-lines.yaml

⚠️ 설명이 비어 있습니다. 나중에 편집하세요.
   /rule edit func-lines-001
```

### 템플릿 기반 추가

```
/rule-add --template security
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 보안 규칙 템플릿
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

기본 필드가 설정된 보안 규칙 템플릿을 사용합니다.

- 카테고리: security
- 심각도: error
- 태그: security, owasp

? 규칙 이름을 입력하세요:
> ...
```

---

## 3. /rule-search - 규칙 검색

### 키워드 검색

```
/rule-search naming
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 검색 결과: "naming"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3개 결과 (관련도순)

1. naming-001: 변수명 규칙 (점수: 95)
   카테고리: code/naming
   매칭: 이름, 카테고리, 태그

2. workflow-branch-001: 브랜치 네이밍 규칙 (점수: 72)
   카테고리: workflow/git
   매칭: 이름, 설명

3. style-001: 코드 포맷팅 규칙 (점수: 35)
   카테고리: code/style
   매칭: 설명 일부
```

### 태그 검색

```
/rule-search --tags security,owasp
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 태그 검색: security, owasp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2개 결과

1. security-secrets-001: 시크릿 노출 방지
   태그: security, secrets, credentials

2. security-sql-001: SQL Injection 방지
   태그: security, sql, injection
```

### 복합 조건 검색

```
/rule-search --category code --severity error --tags typescript
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 복합 검색
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

조건:
  카테고리: code
  심각도: error
  태그: typescript

1개 결과

1. ts-strict-001: TypeScript Strict 모드 필수
   카테고리: code/typescript
   심각도: error
```

### 유사 규칙 검색

```
/rule-search --similar naming-001
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 유사 규칙: naming-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

기준 규칙: naming-001 (변수명 규칙)

유사한 규칙 2개:

1. workflow-branch-001 (유사도: 68%)
   브랜치 네이밍 규칙
   공통 태그: naming

2. style-001 (유사도: 52%)
   코드 포맷팅 규칙
   관련 규칙으로 지정됨
```

---

## 4. /rule-sync - 플랫폼 형식 출력

규칙을 플랫폼 전용 형식으로 출력합니다.

> **참고**: 일반적으로 `rules/*.yaml`만으로 충분합니다.
> `/rule-sync`는 플랫폼 네이티브 파일이 필요한 경우에 사용합니다.

### 지원 플랫폼

| 플랫폼 | 출력 경로 | 형식 | 용도 |
|--------|----------|------|------|
| `cursor` | `.cursorrules` | Markdown | Cursor 네이티브 형식 |
| `claude` | `.claude/rules/` | MDC | Claude Code 네이티브 형식 |
| `all` | 모두 | - | 전체 출력 |

### Cursor 형식으로 출력

```
/rule-sync cursor
```

또는

```
/rule-sync cursor --push
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Cursor 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 동기화 완료!

  플랫폼: cursor
  규칙 수: 8개
  출력 파일: .cursorrules

포함된 규칙:
  - naming-001: 변수명 규칙
  - style-001: 코드 포맷팅 규칙
  - import-order-001: Import 정렬 규칙
  - ts-strict-001: TypeScript Strict 모드 필수
  - security-secrets-001: 시크릿 노출 방지
  - security-sql-001: SQL Injection 방지
  - git-001: 커밋 메시지 규칙
  - workflow-branch-001: 브랜치 네이밍 규칙

📝 변경된 파일:
  M .cursorrules

💡 커밋하려면: /commit -m "chore: sync rulebook"
```

### Claude에 동기화

```
/rule-sync claude
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Claude 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 동기화 완료!

  플랫폼: claude
  규칙 수: 8개
  출력 디렉토리: .claude/rules/

생성된 파일:
  - .claude/rules/_index.md
  - .claude/rules/code.mdc
  - .claude/rules/security.mdc
  - .claude/rules/workflow.mdc
```

### 플랫폼에서 Pull

```
/rule-sync cursor --pull
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Cursor에서 규칙 가져오기
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

소스 파일: .cursorrules

✅ 가져오기 완료!

  가져온 규칙: 10개
  새 규칙: 2개
  업데이트된 규칙: 0개
  충돌: 0개

새로 추가된 규칙:
  + imported-001: API 엔드포인트 규칙
  + imported-002: 에러 처리 규칙

저장 위치: rules/imported/
```

### 차이점 비교 (Diff)

```
/rule-sync cursor --diff
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Cursor와 비교
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

플랫폼: cursor

📤 로컬에만 있는 규칙 (2개):
  + workflow-branch-001
  + async-await-001

📥 플랫폼에만 있는 규칙 (1개):
  - imported-api-rules

🔄 내용이 다른 규칙 (1개):
  ~ naming-001
    description: 변경됨
    tags: 변경됨 ([naming, variables] → [naming, variables, functions])

✅ 동일한 규칙 (5개)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 동기화: /rule-sync cursor --push
💡 가져오기: /rule-sync cursor --pull
```

### Dry Run (미리보기)

```
/rule-sync cursor --dry-run
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Dry Run: Cursor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

출력 예정 파일: .cursorrules
규칙 수: 8개

미리보기 (처음 50줄):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Project Rules

> Auto-generated by Monol Rulebook
> Last updated: 2025-01-18T12:00:00Z

## Overview

Total rules: 8

---

## 🚫 TypeScript Strict 모드 필수

**ID:** ts-strict-001
**Category:** code/typescript
**Severity:** error
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Dry run 모드입니다. 파일이 생성되지 않았습니다.
   실제 동기화: /rule-sync cursor
```

### 전체 플랫폼 동기화

```
/rule-sync all
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 전체 플랫폼 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cursor:
  ✅ 동기화 완료 (.cursorrules)
  규칙 수: 8개

claude:
  ✅ 동기화 완료 (.claude/rules/)
  규칙 수: 8개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 모든 플랫폼 동기화 완료!
```

### 충돌 해결 (양방향 동기화)

```
/rule-sync cursor --both
```

**충돌 발생 시:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 충돌 발견 (2개)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/2] naming-001:

  description:
    로컬: "변수명은 camelCase를 사용합니다"
    원격: "변수명, 함수명에 대한 네이밍 규칙"

  tags:
    로컬: ["naming", "variables"]
    원격: ["naming", "variables", "functions"]

? 어떻게 해결하시겠습니까?
  [1] 로컬 우선 (내 변경사항 유지)
  [2] 원격 우선 (플랫폼 변경사항 적용)
  [3] 수동 병합 (충돌 부분만 선택)
  [4] 건너뛰기
> 3

? description - 어떤 값을 사용하시겠습니까?
  [1] 로컬: "변수명은 camelCase를 사용합니다"
  [2] 원격: "변수명, 함수명에 대한 네이밍 규칙"
> 2

? tags - 어떤 값을 사용하시겠습니까?
  [1] 로컬: ["naming", "variables"]
  [2] 원격: ["naming", "variables", "functions"]
  [3] 병합: ["naming", "variables", "functions"]
> 3

✅ naming-001 충돌 해결됨

[2/2] style-001:
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 양방향 동기화 완료!

  해결된 충돌: 2개
  로컬 업데이트: 1개
  플랫폼 업데이트: 1개
```

---

## 5. /rule-history - 변경 이력

### 이력 조회

```
/rule-history naming-001
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 규칙 이력: naming-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이름: 변수명 규칙
현재 버전: 1.2.0

변경 이력:

v1.2.0 (2025-01-18) - @kent
  상수 네이밍 규칙 추가 (SCREAMING_SNAKE_CASE)

v1.1.0 (2025-01-15) - @jane
  클래스 네이밍 규칙 추가 (PascalCase)

v1.0.0 (2025-01-10) - @kent
  초기 버전 생성

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 버전 비교: /rule-history naming-001 --diff 1.0.0 1.2.0
💡 롤백: /rule-history naming-001 --rollback 1.1.0
```

### 버전 간 비교 (Diff)

```
/rule-history naming-001 --diff 1.0.0 1.2.0
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 버전 비교: naming-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

v1.0.0 → v1.2.0

변경된 필드:

description:
  - 변수명, 함수명에 대한 네이밍 컨벤션입니다.
  + 변수명, 함수명, 클래스명에 대한 네이밍 컨벤션입니다.
  +
  + - 변수/함수: camelCase
  + - 클래스/타입: PascalCase
  + - 상수: SCREAMING_SNAKE_CASE
  + - 파일명: kebab-case

tags:
  - ["naming", "variables"]
  + ["naming", "variables", "functions", "classes"]

examples.good:
  + "class UserService { }"
  + "const MAX_RETRY_COUNT = 3;"

examples.bad:
  + "class user_service { }"
  + "const maxRetryCount = 3;  // 상수는 SCREAMING_CASE"
```

### 롤백

```
/rule-history naming-001 --rollback 1.1.0
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏪ 롤백: naming-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

현재 버전: 1.2.0
롤백 대상: 1.1.0

변경될 내용:
  - description: 상수 관련 내용 제거
  - tags: "classes" 태그 제거
  - examples: 상수 관련 예시 제거

? 롤백을 진행하시겠습니까? [Y/n]
> Y

✅ 롤백 완료!

  새 버전: 1.2.1 (롤백에서 자동 증가)
  변경 내용: "v1.1.0으로 롤백"

📝 변경된 파일:
  M rules/code/naming.yaml

💡 동기화: /rule-sync cursor
```

### 전체 규칙 이력 요약

```
/rule-history --all
```

**출력:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 전체 규칙 이력 요약
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

최근 10개 변경:

2025-01-18 naming-001 v1.2.0 @kent
  상수 네이밍 규칙 추가

2025-01-17 style-001 v1.1.0 @jane
  세미콜론 규칙 강화

2025-01-15 naming-001 v1.1.0 @jane
  클래스 네이밍 규칙 추가

2025-01-15 git-001 v1.0.1 @kent
  scope 필드 선택사항으로 변경

...

규칙별 버전 현황:
  naming-001: v1.2.0 (3개 버전)
  style-001: v1.1.0 (2개 버전)
  git-001: v1.0.1 (2개 버전)
  ts-strict-001: v1.0.0 (1개 버전)
  ...
```

---

## 다음 단계

- [라이브러리 API](./04-library-api.md) - 프로그래매틱 사용법
- [실전 워크플로우](./05-workflows.md) - 팀에서 규칙 관리하기
