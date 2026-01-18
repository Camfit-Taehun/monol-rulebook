/**
 * Monol Rulebook - Rule Search
 *
 * 태그, 키워드, 의미 기반 규칙 검색
 */

import type {
  Rule,
  SearchOptions,
  SearchResult,
  SimilarityResult,
  TagIndex,
} from './types.js';

// ============================================================================
// RuleSearch Class
// ============================================================================

export class RuleSearch {
  private rules: Rule[];
  private tagIndex: TagIndex;
  private keywordIndex: Map<string, Set<string>>;

  constructor(rules: Rule[] = []) {
    this.rules = rules;
    this.tagIndex = new Map();
    this.keywordIndex = new Map();
    this.buildIndices();
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * 규칙 목록 업데이트
   */
  updateRules(rules: Rule[]): void {
    this.rules = rules;
    this.buildIndices();
  }

  /**
   * 태그 기반 검색
   */
  searchByTags(tags: string[], matchAll = false): Rule[] {
    if (tags.length === 0) return [];

    const tagSets = tags.map(tag => this.tagIndex.get(tag.toLowerCase()) || new Set<string>());

    let matchingIds: Set<string>;
    if (matchAll) {
      // 모든 태그와 매칭되는 규칙
      matchingIds = tagSets.reduce((acc, set) => {
        return new Set([...acc].filter(id => set.has(id)));
      }, tagSets[0] || new Set());
    } else {
      // 하나라도 매칭되는 규칙
      matchingIds = new Set(tagSets.flatMap(set => [...set]));
    }

    return this.rules.filter(r => matchingIds.has(r.id));
  }

  /**
   * 키워드 검색
   */
  searchByKeyword(keyword: string): SearchResult[] {
    const lowerKeyword = keyword.toLowerCase();
    const results: SearchResult[] = [];

    for (const rule of this.rules) {
      const score = this.calculateKeywordScore(rule, lowerKeyword);
      if (score > 0) {
        results.push({
          rule,
          score,
          matchedFields: this.getMatchedFields(rule, lowerKeyword),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * 복합 검색
   */
  search(options: SearchOptions): SearchResult[] {
    let candidates = this.rules;

    // 태그 필터
    if (options.tags && options.tags.length > 0) {
      candidates = this.searchByTags(options.tags);
    }

    // 카테고리 필터
    if (options.category) {
      candidates = candidates.filter(r => r.category.startsWith(options.category!));
    }

    // 심각도 필터
    if (options.severity) {
      candidates = candidates.filter(r => r.severity === options.severity);
    }

    // 활성화 필터
    if (options.enabledOnly) {
      candidates = candidates.filter(r => r.enabled !== false);
    }

    // 키워드 검색 (점수 계산)
    let results: SearchResult[];
    if (options.keyword) {
      const lowerKeyword = options.keyword.toLowerCase();
      results = candidates
        .map(rule => ({
          rule,
          score: this.calculateKeywordScore(rule, lowerKeyword),
          matchedFields: this.getMatchedFields(rule, lowerKeyword),
        }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score);
    } else {
      results = candidates.map(rule => ({
        rule,
        score: 1,
        matchedFields: [],
      }));
    }

    // 결과 제한
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * 유사 규칙 찾기 (중복 감지)
   */
  findSimilar(rule: Rule, threshold = 0.5): SimilarityResult[] {
    const results: SimilarityResult[] = [];

    for (const candidate of this.rules) {
      if (candidate.id === rule.id) continue;

      const similarity = this.calculateSimilarity(rule, candidate);
      if (similarity >= threshold) {
        results.push({
          rule: candidate,
          similarity,
          matchingAspects: this.getMatchingAspects(rule, candidate),
        });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 유사도 계산
   */
  calculateSimilarity(a: Rule, b: Rule): number {
    const weights = {
      name: 0.2,
      description: 0.3,
      tags: 0.25,
      category: 0.15,
      examples: 0.1,
    };

    let totalScore = 0;

    // 이름 유사도
    totalScore += weights.name * this.stringSimilarity(a.name, b.name);

    // 설명 유사도
    totalScore += weights.description * this.stringSimilarity(a.description, b.description);

    // 태그 유사도
    totalScore += weights.tags * this.jaccardSimilarity(new Set(a.tags), new Set(b.tags));

    // 카테고리 유사도
    totalScore += weights.category * this.categorySimilarity(a.category, b.category);

    // 예시 유사도
    if (a.examples && b.examples) {
      const aExamples = [...(a.examples.good || []), ...(a.examples.bad || [])].join(' ');
      const bExamples = [...(b.examples.good || []), ...(b.examples.bad || [])].join(' ');
      totalScore += weights.examples * this.stringSimilarity(aExamples, bExamples);
    }

    return totalScore;
  }

  /**
   * 태그 자동완성
   */
  suggestTags(prefix: string): string[] {
    const lowerPrefix = prefix.toLowerCase();
    const allTags = Array.from(this.tagIndex.keys());
    return allTags
      .filter(tag => tag.startsWith(lowerPrefix))
      .slice(0, 10);
  }

  /**
   * 카테고리 목록
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    for (const rule of this.rules) {
      categories.add(rule.category);
      // 상위 카테고리도 추가
      const parts = rule.category.split('/');
      for (let i = 1; i < parts.length; i++) {
        categories.add(parts.slice(0, i).join('/'));
      }
    }
    return Array.from(categories).sort();
  }

  /**
   * 모든 태그 목록
   */
  getAllTags(): string[] {
    return Array.from(this.tagIndex.keys()).sort();
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private buildIndices(): void {
    this.tagIndex.clear();
    this.keywordIndex.clear();

    for (const rule of this.rules) {
      // 태그 인덱스
      for (const tag of rule.tags) {
        const lowerTag = tag.toLowerCase();
        if (!this.tagIndex.has(lowerTag)) {
          this.tagIndex.set(lowerTag, new Set());
        }
        this.tagIndex.get(lowerTag)!.add(rule.id);
      }

      // 키워드 인덱스 (이름, 설명에서 단어 추출)
      const words = this.extractWords(`${rule.name} ${rule.description}`);
      for (const word of words) {
        if (!this.keywordIndex.has(word)) {
          this.keywordIndex.set(word, new Set());
        }
        this.keywordIndex.get(word)!.add(rule.id);
      }
    }
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  private calculateKeywordScore(rule: Rule, keyword: string): number {
    let score = 0;

    // ID 매칭 (가장 높은 점수)
    if (rule.id.toLowerCase().includes(keyword)) {
      score += 10;
    }

    // 이름 매칭
    if (rule.name.toLowerCase().includes(keyword)) {
      score += 8;
    }

    // 태그 매칭
    for (const tag of rule.tags) {
      if (tag.toLowerCase().includes(keyword)) {
        score += 5;
      }
    }

    // 카테고리 매칭
    if (rule.category.toLowerCase().includes(keyword)) {
      score += 3;
    }

    // 설명 매칭
    if (rule.description.toLowerCase().includes(keyword)) {
      score += 2;
    }

    // 예시 매칭
    if (rule.examples) {
      const examples = [...(rule.examples.good || []), ...(rule.examples.bad || [])].join(' ');
      if (examples.toLowerCase().includes(keyword)) {
        score += 1;
      }
    }

    return score;
  }

  private getMatchedFields(rule: Rule, keyword: string): string[] {
    const fields: string[] = [];

    if (rule.id.toLowerCase().includes(keyword)) fields.push('id');
    if (rule.name.toLowerCase().includes(keyword)) fields.push('name');
    if (rule.description.toLowerCase().includes(keyword)) fields.push('description');
    if (rule.category.toLowerCase().includes(keyword)) fields.push('category');
    if (rule.tags.some(t => t.toLowerCase().includes(keyword))) fields.push('tags');

    return fields;
  }

  private getMatchingAspects(a: Rule, b: Rule): string[] {
    const aspects: string[] = [];

    if (this.stringSimilarity(a.name, b.name) > 0.5) aspects.push('name');
    if (this.stringSimilarity(a.description, b.description) > 0.5) aspects.push('description');
    if (this.jaccardSimilarity(new Set(a.tags), new Set(b.tags)) > 0.5) aspects.push('tags');
    if (a.category === b.category) aspects.push('category');
    if (a.severity === b.severity) aspects.push('severity');

    return aspects;
  }

  /**
   * 문자열 유사도 (Levenshtein distance 기반)
   */
  private stringSimilarity(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    if (aLower === bLower) return 1;
    if (aLower.length === 0 || bLower.length === 0) return 0;

    // 간단한 n-gram 기반 유사도
    const ngramSize = 2;
    const aNgrams = this.getNgrams(aLower, ngramSize);
    const bNgrams = this.getNgrams(bLower, ngramSize);

    return this.jaccardSimilarity(aNgrams, bNgrams);
  }

  private getNgrams(str: string, n: number): Set<string> {
    const ngrams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.add(str.slice(i, i + n));
    }
    return ngrams;
  }

  /**
   * Jaccard 유사도
   */
  private jaccardSimilarity<T>(a: Set<T>, b: Set<T>): number {
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * 카테고리 유사도
   */
  private categorySimilarity(a: string, b: string): number {
    const aParts = a.split('/');
    const bParts = b.split('/');

    let matching = 0;
    const maxLen = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      if (aParts[i] === bParts[i]) {
        matching++;
      } else {
        break;
      }
    }

    return maxLen === 0 ? 0 : matching / maxLen;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 빠른 태그 검색
 */
export function quickSearchByTags(rules: Rule[], tags: string[]): Rule[] {
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  return rules.filter(rule =>
    rule.tags.some(t => tagSet.has(t.toLowerCase()))
  );
}

/**
 * 빠른 카테고리 검색
 */
export function quickSearchByCategory(rules: Rule[], category: string): Rule[] {
  return rules.filter(rule => rule.category.startsWith(category));
}

/**
 * 규칙 그룹화
 */
export function groupRulesByCategory(rules: Rule[]): Map<string, Rule[]> {
  const groups = new Map<string, Rule[]>();

  for (const rule of rules) {
    const category = rule.category.split('/')[0];
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(rule);
  }

  return groups;
}

/**
 * 규칙 통계
 */
export function getRuleStats(rules: Rule[]): {
  total: number;
  byCategory: Map<string, number>;
  bySeverity: Map<string, number>;
  byTag: Map<string, number>;
} {
  const byCategory = new Map<string, number>();
  const bySeverity = new Map<string, number>();
  const byTag = new Map<string, number>();

  for (const rule of rules) {
    // 카테고리
    const category = rule.category.split('/')[0];
    byCategory.set(category, (byCategory.get(category) || 0) + 1);

    // 심각도
    bySeverity.set(rule.severity, (bySeverity.get(rule.severity) || 0) + 1);

    // 태그
    for (const tag of rule.tags) {
      byTag.set(tag, (byTag.get(tag) || 0) + 1);
    }
  }

  return {
    total: rules.length,
    byCategory,
    bySeverity,
    byTag,
  };
}

export default RuleSearch;
