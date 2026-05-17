/**
 * Phase 1 Tier & Quota 型別定義
 */

export type UserTier = 'FREE' | 'PAID';

export type QuotaDimensionName =
  | 'MEMBER_COUNT'
  | 'MONTHLY_SEND'
  | 'AI_QUESTION_GEN'
  | 'AI_DATA_ANALYSIS'
  | 'AI_NEWSLETTER_GEN'
  | 'ACTIVE_CAMPAIGNS'
  | 'SURVEY_COUNT';

export type QuotaResetPeriodName = 'MONTHLY' | 'NEVER';

export interface QuotaItem {
  dimension: QuotaDimensionName;
  limit: number;
  used: number;
  remaining: number;
  resetPeriod: QuotaResetPeriodName;
}

/** 講師配額快照 — GET /api/quota/snapshot 回傳 */
export interface QuotaSnapshot {
  tier: UserTier;
  periodStart: string;
  periodEnd: string;
  daysUntilReset: number;
  items: QuotaItem[];
}

/** 配額政策 — GET /api/admin/quota-policies 回傳 */
export interface QuotaPolicy {
  id: number;
  tier: UserTier;
  dimension: QuotaDimensionName;
  limitValue: number;
  resetPeriod: QuotaResetPeriodName;
}

/** ADMIN 升降級請求 — PUT /api/admin/users/{id}/tier body */
export interface TierChangeRequest {
  targetTier: UserTier;
  expiresAt?: string | null;
  reason?: string;
}

/** 升降級歷史 DTO — GET /api/admin/users/{id}/tier-history 回傳 */
export interface TierChangeLog {
  id: number;
  fromTier: UserTier;
  toTier: UserTier;
  changedAt: string;
  expiresAt: string | null;
  reason: string | null;
  changedById: number | null;
  changedByName: string | null;
}
