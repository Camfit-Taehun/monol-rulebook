# Monol Rulebook 사용 예시

이 디렉토리에는 monol-rulebook 플러그인의 실제 사용 방법을 보여주는 예시들이 포함되어 있습니다.

## Monol Rulebook이란?

**로컬 머신에 자신만의 코딩 규칙을 등록하고, 어떤 AI 도구에서든 동일하게 적용받는 규칙 관리 시스템**입니다.

### 핵심 개념

```
로컬 머신
│
├── ~/.config/monol/rules/        # 글로벌 규칙 (모든 프로젝트에 적용)
│   ├── my-style.yaml
│   └── my-conventions.yaml
│
├── ~/work/project-a/
│   └── rules/                    # 프로젝트 A 전용 규칙
│
└── ~/work/project-b/
    └── rules/                    # 프로젝트 B 전용 규칙
```

**동작 방식:**
- 어느 경로에서 작업하든, 해당 경로에 맞는 규칙이 **계층적으로 로드**
- **Cursor에서든, Claude Code에서든** 같은 규칙이 적용
- 글로벌 규칙 + 프로젝트 규칙이 병합되어 적용

**설정 방식:**
- 글로벌 규칙 경로는 프로젝트의 `rules/.rulebook-config.yaml`에서 `inheritance`로 설정
- 한 번 설정하면 해당 프로젝트에서 글로벌 규칙이 자동 로드됨

### 왜 사용하나요?

| 상황 | Monol Rulebook |
|------|----------------|
| 내 코딩 스타일을 AI에게 알려주고 싶을 때 | 규칙으로 등록하면 어디서든 적용 |
| 프로젝트마다 다른 규칙이 필요할 때 | 프로젝트별 rules/ 폴더로 관리 |
| 팀 규칙을 공유하고 싶을 때 | Git으로 rules/ 공유 |
| Cursor와 Claude Code를 번갈아 사용할 때 | 같은 규칙이 양쪽에 적용 |

## 문서 목차

| 문서 | 설명 | 난이도 |
|------|------|--------|
| [01-quick-start.md](./01-quick-start.md) | 빠른 시작 가이드 | 초급 |
| [02-rule-definitions.md](./02-rule-definitions.md) | 규칙 정의 예시 | 초급~중급 |
| [03-commands.md](./03-commands.md) | 커맨드 사용 예시 | 중급 |
| [04-library-api.md](./04-library-api.md) | 라이브러리 API 예시 | 고급 |
| [05-workflows.md](./05-workflows.md) | 실전 워크플로우 예시 | 중급~고급 |

## 권장 학습 순서

### 처음 사용하는 경우

1. **[Quick Start](./01-quick-start.md)** - 3분 만에 첫 규칙 등록하기
2. **[Commands](./03-commands.md)** - 주요 커맨드 익히기
3. **[Rule Definitions](./02-rule-definitions.md)** - 다양한 규칙 작성법

### 심화 학습

4. **[Library API](./04-library-api.md)** - 프로그래매틱 사용법
5. **[Workflows](./05-workflows.md)** - 실전 시나리오

## 빠른 참조

### 주요 커맨드

```
/rule                    # 현재 경로의 규칙 목록 조회
/rule <id>              # 특정 규칙 상세 조회
/rule-add               # 대화형 규칙 추가
/rule-search <keyword>  # 규칙 검색
/rule-sync <platform>   # 플랫폼 형식으로 출력 (.cursorrules, .claude/rules/)
/rule-history <id>      # 변경 이력 조회
```

### 규칙 저장 위치

```
# 글로벌 규칙 (개인 규칙)
~/.config/monol/rules/
├── code/
└── workflow/

# 프로젝트 규칙 (해당 프로젝트만)
./rules/
├── .rulebook-config.yaml    # 글로벌 상속 등 설정
├── code/
├── workflow/
└── index.yaml
```

### 지원 플랫폼

| 플랫폼 | 설명 |
|--------|------|
| **Cursor** | Cursor IDE에서 규칙 자동 적용 |
| **Claude Code** | Claude Code CLI에서 규칙 자동 적용 |

두 도구 모두 같은 `rules/*.yaml`을 읽어서 동일한 규칙을 적용합니다.
