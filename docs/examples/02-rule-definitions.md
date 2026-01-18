# 규칙 정의 예시

다양한 카테고리와 시나리오에 맞는 규칙 정의 예시를 제공합니다.

## 기본 구조

모든 규칙은 다음 구조를 따릅니다:

```yaml
# 필수 필드
id: <unique-id>           # 고유 식별자
name: <규칙 이름>          # 사람이 읽기 쉬운 이름
description: |            # 상세 설명 (멀티라인)
  규칙에 대한 설명
category: <category>      # 카테고리 (예: code/style)
severity: error|warning|info

# 선택 필드
tags: []                  # 태그 목록
examples:                 # 좋은/나쁜 예시
  good: []
  bad: []
exceptions: []            # 예외 상황
related: []               # 관련 규칙 ID
enabled: true             # 활성화 여부
autoApply: false          # 자동 적용 여부

# 확장 필드 (v1.0+)
metadata:                 # 버전/작성자 정보
dependencies:             # 의존성/충돌
conditions:               # 조건부 적용
platforms:                # 플랫폼별 설정
```

---

## 카테고리별 예시

### 1. 코드 스타일 규칙

#### TypeScript Strict 모드

```yaml
id: ts-strict-001
name: TypeScript Strict 모드 필수
description: |
  모든 TypeScript 프로젝트는 strict 모드를 활성화해야 합니다.
  tsconfig.json에서 "strict": true 설정이 필요합니다.

category: code/typescript
tags:
  - typescript
  - strict
  - type-safety

severity: error

examples:
  good:
    - |
      // tsconfig.json
      {
        "compilerOptions": {
          "strict": true
        }
      }
  bad:
    - |
      // tsconfig.json
      {
        "compilerOptions": {
          "strict": false
        }
      }

exceptions:
  - 레거시 마이그레이션 중인 프로젝트
  - 서드파티 라이브러리 타입 호환성 이슈

metadata:
  version: "1.0.0"
  status: active
  author: "@kent"

conditions:
  filePatterns:
    - "**/tsconfig.json"
    - "**/tsconfig.*.json"
```

#### Import 정렬 규칙

```yaml
id: import-order-001
name: Import 정렬 규칙
description: |
  import 문은 다음 순서로 정렬합니다:
  1. 외부 패키지 (react, lodash 등)
  2. 내부 모듈 (@/components, @/utils 등)
  3. 상대 경로 (./component, ../utils)
  4. 스타일/에셋 (*.css, *.svg)

category: code/style
tags:
  - imports
  - organization
  - eslint

severity: warning

examples:
  good:
    - |
      // 외부 패키지
      import React from 'react';
      import { useState } from 'react';
      import lodash from 'lodash';

      // 내부 모듈
      import { Button } from '@/components';
      import { formatDate } from '@/utils';

      // 상대 경로
      import { Header } from './Header';
      import { useAuth } from '../hooks';

      // 스타일
      import './styles.css';
  bad:
    - |
      import './styles.css';
      import { Header } from './Header';
      import React from 'react';
      import { Button } from '@/components';

autoApply: true

metadata:
  version: "1.1.0"
  status: active
  changelog:
    - version: "1.1.0"
      date: "2025-01-18"
      author: "@kent"
      changes: "스타일 import 순서 추가"
    - version: "1.0.0"
      date: "2025-01-01"
      author: "@kent"
      changes: "초기 버전"
```

---

### 2. 문서화 규칙

#### JSDoc 필수 규칙

```yaml
id: jsdoc-required-001
name: 공개 API JSDoc 필수
description: |
  export되는 모든 함수, 클래스, 타입에는 JSDoc 주석이 필요합니다.

  필수 태그:
  - @description 또는 첫 줄 설명
  - @param (파라미터가 있는 경우)
  - @returns (반환값이 있는 경우)
  - @throws (예외를 던지는 경우)
  - @example (복잡한 함수의 경우)

category: docs/api
tags:
  - jsdoc
  - documentation
  - api

severity: warning

examples:
  good:
    - |
      /**
       * 사용자 정보를 조회합니다.
       * @param userId - 사용자 고유 ID
       * @returns 사용자 정보 객체
       * @throws {NotFoundError} 사용자가 존재하지 않는 경우
       * @example
       * const user = await getUser('user-123');
       */
      export async function getUser(userId: string): Promise<User> {
        // ...
      }
  bad:
    - |
      export async function getUser(userId: string): Promise<User> {
        // JSDoc 없음
      }

exceptions:
  - 테스트 파일
  - 내부 유틸리티 함수 (export 하지 않는 경우)

conditions:
  filePatterns:
    - "src/**/*.ts"
    - "lib/**/*.ts"
  excludePatterns:
    - "**/*.test.ts"
    - "**/*.spec.ts"
```

#### README 템플릿 규칙

```yaml
id: readme-template-001
name: README 필수 섹션
description: |
  모든 패키지/프로젝트의 README.md는 다음 섹션을 포함해야 합니다:

  1. 제목 및 설명
  2. 설치 방법
  3. 사용법 (예시 포함)
  4. API 레퍼런스 (해당되는 경우)
  5. 라이선스

category: docs/readme
tags:
  - readme
  - documentation
  - template

severity: info

examples:
  good:
    - |
      # 프로젝트 이름

      간단한 설명

      ## 설치

      ```bash
      npm install package-name
      ```

      ## 사용법

      ```typescript
      import { feature } from 'package-name';
      ```

      ## 라이선스

      MIT
```

---

### 3. 보안 규칙

#### 시크릿 노출 방지

```yaml
id: security-secrets-001
name: 시크릿 노출 방지
description: |
  코드에 하드코딩된 시크릿, API 키, 비밀번호를 금지합니다.

  환경 변수 또는 시크릿 매니저를 사용하세요:
  - process.env.API_KEY
  - AWS Secrets Manager
  - Vault

category: security
tags:
  - security
  - secrets
  - credentials

severity: error

examples:
  good:
    - |
      const apiKey = process.env.API_KEY;
      const dbPassword = await secretsManager.get('db-password');
  bad:
    - |
      const apiKey = 'sk-1234567890abcdef';
      const dbPassword = 'supersecretpassword';
      const awsKey = 'AKIA1234567890ABCDEF';

exceptions:
  - 테스트용 목 데이터
  - 공개 API 키 (예: Google Maps 브라우저 키)

metadata:
  version: "1.0.0"
  status: active

conditions:
  excludePatterns:
    - "**/*.test.ts"
    - "**/*.mock.ts"
    - "**/fixtures/**"
```

#### SQL Injection 방지

```yaml
id: security-sql-001
name: SQL Injection 방지
description: |
  SQL 쿼리에 사용자 입력을 직접 연결하지 마세요.
  항상 파라미터화된 쿼리 또는 ORM을 사용하세요.

category: security
tags:
  - security
  - sql
  - injection

severity: error

examples:
  good:
    - |
      // 파라미터화된 쿼리
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      // ORM 사용
      const user = await User.findOne({ where: { id: userId } });
  bad:
    - |
      // 문자열 연결 - 위험!
      const result = await db.query(
        `SELECT * FROM users WHERE id = '${userId}'`
      );

related:
  - security-secrets-001
```

---

### 4. 성능 규칙

#### N+1 쿼리 방지

```yaml
id: perf-n-plus-1-001
name: N+1 쿼리 방지
description: |
  반복문 내에서 데이터베이스 쿼리를 실행하지 마세요.
  대신 일괄 조회(batch query) 또는 조인을 사용하세요.

category: performance/database
tags:
  - performance
  - database
  - n+1

severity: warning

examples:
  good:
    - |
      // 일괄 조회
      const users = await User.find({ where: { id: In(userIds) } });

      // 조인 사용
      const posts = await Post.find({
        relations: ['author'],
        where: { published: true }
      });
  bad:
    - |
      // N+1 문제
      const posts = await Post.find();
      for (const post of posts) {
        post.author = await User.findOne(post.authorId);  // N번 쿼리!
      }

conditions:
  filePatterns:
    - "src/**/*.ts"
    - "src/**/*.js"
  excludePatterns:
    - "**/migrations/**"
```

#### 무한 루프 감지

```yaml
id: perf-infinite-loop-001
name: 무한 루프 위험 감지
description: |
  while(true) 또는 종료 조건이 불명확한 루프를 사용할 때
  반드시 탈출 조건과 최대 반복 횟수를 설정하세요.

category: performance
tags:
  - performance
  - loop
  - infinite

severity: warning

examples:
  good:
    - |
      let attempts = 0;
      const maxAttempts = 100;

      while (attempts < maxAttempts) {
        if (condition) break;
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Max attempts exceeded');
      }
  bad:
    - |
      while (true) {
        // 탈출 조건이 불명확
        if (someCondition) break;
      }
```

---

### 5. 워크플로우 규칙

#### PR 템플릿 규칙

```yaml
id: workflow-pr-001
name: PR 템플릿 준수
description: |
  모든 Pull Request는 다음 섹션을 포함해야 합니다:

  1. 변경 사항 요약
  2. 관련 이슈 번호
  3. 테스트 방법
  4. 체크리스트

category: workflow/pr
tags:
  - workflow
  - pull-request
  - template

severity: info

examples:
  good:
    - |
      ## 변경 사항
      - 사용자 프로필 페이지 추가
      - 프로필 이미지 업로드 기능

      ## 관련 이슈
      Closes #123

      ## 테스트 방법
      1. /profile 페이지 접속
      2. 이미지 업로드 버튼 클릭
      3. 이미지 선택 후 저장

      ## 체크리스트
      - [x] 테스트 작성
      - [x] 문서 업데이트
      - [x] 린트 통과
```

#### 브랜치 네이밍 규칙

```yaml
id: workflow-branch-001
name: 브랜치 네이밍 규칙
description: |
  브랜치 이름은 다음 형식을 따릅니다:

  <type>/<issue-number>-<short-description>

  타입:
  - feature: 새 기능
  - fix: 버그 수정
  - refactor: 리팩토링
  - docs: 문서
  - chore: 설정/빌드

category: workflow/git
tags:
  - git
  - branch
  - naming

severity: warning

examples:
  good:
    - "feature/123-user-profile"
    - "fix/456-login-error"
    - "refactor/789-api-cleanup"
    - "docs/101-readme-update"
  bad:
    - "my-branch"
    - "fix-bug"
    - "feature_user_profile"
    - "john/working"

related:
  - git-001
```

---

## 의존성/충돌 예시

### extends 사용 예시

```yaml
# rules/code/base-rules.yaml
id: base-rules-001
name: 기본 코드 규칙
description: 모든 코드 규칙의 기반
category: code
severity: warning
```

```yaml
# rules/code/strict-rules.yaml
id: strict-rules-001
name: 엄격한 코드 규칙
description: 프로덕션 코드에 적용되는 엄격한 규칙

dependencies:
  extends: base-rules-001  # 기본 규칙 상속

category: code
severity: error

conditions:
  environments:
    - production
```

### requires 체인 예시

```yaml
# 순서: eslint-base → eslint-typescript → eslint-react

# rules/linting/eslint-base.yaml
id: eslint-base-001
name: ESLint 기본 설정
category: linting

# rules/linting/eslint-typescript.yaml
id: eslint-ts-001
name: ESLint TypeScript 설정
dependencies:
  requires:
    - eslint-base-001  # 먼저 적용 필요

# rules/linting/eslint-react.yaml
id: eslint-react-001
name: ESLint React 설정
dependencies:
  requires:
    - eslint-base-001
    - eslint-ts-001    # 두 규칙 모두 필요
```

### conflicts 예시

```yaml
# rules/code/strict-mode.yaml
id: strict-mode-001
name: Strict 모드
dependencies:
  conflicts:
    - loose-mode-001   # 동시 사용 불가

# rules/code/loose-mode.yaml
id: loose-mode-001
name: Loose 모드
dependencies:
  conflicts:
    - strict-mode-001  # 동시 사용 불가
```

---

## 조건부 적용 예시

### 파일 패턴 기반

```yaml
conditions:
  filePatterns:
    - "src/**/*.ts"
    - "src/**/*.tsx"
  excludePatterns:
    - "**/*.test.ts"
    - "**/*.spec.ts"
    - "**/node_modules/**"
```

### 환경 기반

```yaml
conditions:
  environments:
    - production
    - staging
  # development에서는 적용 안 됨
```

### 브랜치 기반

```yaml
conditions:
  branches:
    - main
    - release/*
  # feature 브랜치에서는 적용 안 됨
```

### 기간 기반

```yaml
conditions:
  activeFrom: "2025-01-01"
  activeUntil: "2025-12-31"
  # 2025년에만 적용
```

---

## 다음 단계

- [커맨드 사용 예시](./03-commands.md) - 규칙 관리 커맨드
- [라이브러리 API](./04-library-api.md) - 프로그래매틱 접근
