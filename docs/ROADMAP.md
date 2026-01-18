# Monol Rulebook Roadmap

## v0.2.x - 마이그레이션 시스템

### 배경
- 규칙 ID 체계가 `{주제}-{번호}`에서 `{주제}-{세부}-{번호}`로 변경됨
- 기존 사용자들이 레거시 방식으로 등록한 규칙들이 있음
- 플러그인 업데이트 시 기존 규칙을 신규 방식으로 마이그레이션 필요

### 기능 요구사항

#### 1. 마이그레이션 감지
- [ ] 플러그인 로드 시 레거시 규칙 형식 자동 감지
- [ ] 마이그레이션 필요 여부 판단 로직
- [ ] 영향받는 파일 목록 수집

#### 2. 마이그레이션 맵
```yaml
# rules/.migrations/001-id-restructure.yaml
version: "001"
name: "ID 체계 변경"
description: "{주제}-{번호} → {주제}-{세부}-{번호}"
mappings:
  - from: naming-001
    to: naming-variable-001
  - from: style-001
    to: style-format-001
  - from: git-001
    to: git-commit-001
  - from: planning-001
    to: planning-scenario-001
  - from: planning-002
    to: planning-reinforcement-001
  - from: deploy-001
    to: deploy-claude-plugin-001
```

#### 3. 사용자 확인 플로우
```
┌─────────────────────────────────────────────────────────────┐
│  monol-rulebook 업데이트 감지                                │
│                                                             │
│  레거시 규칙이 발견되었습니다:                                │
│    - naming-001 → naming-variable-001                       │
│    - style-001 → style-format-001                           │
│    ...                                                      │
│                                                             │
│  영향받는 파일:                                              │
│    - rules/code/naming.yaml                                 │
│    - rules/.history/naming-001.yaml                         │
│    - .cursorrules                                           │
│                                                             │
│  마이그레이션을 진행하시겠습니까?                             │
│  [1] 자동 마이그레이션 (권장)                                │
│  [2] 항목별 확인 후 진행                                     │
│  [3] 나중에 하기 (레거시 모드 유지)                          │
│  [4] 무시 (다시 묻지 않음)                                   │
└─────────────────────────────────────────────────────────────┘
```

#### 4. 마이그레이션 CLI
```bash
# 마이그레이션 상태 확인
monol-rulebook migrate status

# dry-run (변경 미리보기)
monol-rulebook migrate --dry-run

# 자동 마이그레이션
monol-rulebook migrate

# 대화형 마이그레이션 (항목별 확인)
monol-rulebook migrate --interactive

# 특정 규칙만 마이그레이션
monol-rulebook migrate naming-001
```

#### 5. 마이그레이션 대상
- [ ] 규칙 파일 (`rules/**/*.yaml`)
  - id 필드
  - related 필드의 참조
- [ ] 히스토리 파일 (`rules/.history/*.yaml`)
  - 파일명
  - 내부 ID 참조
- [ ] 설정 파일 (`rules/.rulebook-config.yaml`)
  - 규칙 참조
- [ ] 동기화 출력 파일
  - `.cursorrules`
  - `.claude/rules/`

#### 6. 레거시 모드 지원
- [ ] 마이그레이션 전까지 레거시 ID로 계속 작동
- [ ] 경고 메시지 표시 (마이그레이션 권장)
- [ ] 점진적 마이그레이션 지원

#### 7. 롤백 지원
- [ ] 마이그레이션 전 백업 생성
- [ ] 롤백 명령어: `monol-rulebook migrate rollback`

### 구현 우선순위
1. 마이그레이션 맵 정의 스키마
2. 레거시 규칙 감지 로직
3. CLI migrate 명령어
4. 사용자 확인 플로우 (AskUserQuestion 연동)
5. 자동 마이그레이션 실행
6. 롤백 기능

---

## v0.3.x - 규칙 공유 및 배포

### 기능 예정
- [ ] 규칙 패키지 퍼블리싱 (npm)
- [ ] 팀 공유 규칙 저장소
- [ ] 규칙 import/export

---

## v0.4.x - 고급 기능

### 기능 예정
- [ ] 규칙 자동 추천 (컨텍스트 기반)
- [ ] 규칙 충돌 해결 UI
- [ ] 규칙 통계 대시보드

---

## 완료된 기능

### v0.1.x
- [x] 기본 규칙 로드/저장
- [x] Cursor/Claude 플랫폼 동기화
- [x] 계층적 규칙 병합 (글로벌 → 프로젝트 → 로컬)
- [x] CLI 도구 (`monol-rulebook init/sync`)
- [x] Claude Code 플러그인 배포 (`/rule`, `/rule-add`, `/rule-search`, `/rule-sync`)
