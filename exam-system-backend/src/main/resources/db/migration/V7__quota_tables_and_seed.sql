-- V7: 配額系統三張表 + 種子資料

CREATE TABLE quota_policy (
    id BIGSERIAL PRIMARY KEY,
    tier VARCHAR(10) NOT NULL,
    dimension VARCHAR(30) NOT NULL,
    limit_value INTEGER NOT NULL,
    reset_period VARCHAR(10) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quota_policy_tier_dim UNIQUE (tier, dimension)
);

CREATE TABLE quota_usage (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    dimension VARCHAR(30) NOT NULL,
    period_start_date DATE NOT NULL,
    used_value INTEGER NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quota_usage_owner_dim_period UNIQUE (owner_id, dimension, period_start_date),
    CONSTRAINT fk_quota_usage_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_quota_usage_owner_dim ON quota_usage (owner_id, dimension);

CREATE TABLE tier_change_log (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    from_tier VARCHAR(10) NOT NULL,
    to_tier VARCHAR(10) NOT NULL,
    changed_by BIGINT,
    reason VARCHAR(500),
    expires_at TIMESTAMP,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tier_log_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_tier_log_owner ON tier_change_log (owner_id);

-- 種子資料：FREE / PAID 兩階配額
INSERT INTO quota_policy (tier, dimension, limit_value, reset_period) VALUES
    ('FREE', 'MEMBER_COUNT', 100, 'NEVER'),
    ('FREE', 'MONTHLY_SEND', 200, 'MONTHLY'),
    ('FREE', 'AI_QUESTION_GEN', 0, 'MONTHLY'),
    ('FREE', 'AI_DATA_ANALYSIS', 0, 'MONTHLY'),
    ('FREE', 'AI_NEWSLETTER_GEN', 0, 'MONTHLY'),
    ('FREE', 'ACTIVE_CAMPAIGNS', 0, 'NEVER'),
    ('FREE', 'SURVEY_COUNT', 3, 'NEVER'),
    ('PAID', 'MEMBER_COUNT', 5000, 'NEVER'),
    ('PAID', 'MONTHLY_SEND', 20000, 'MONTHLY'),
    ('PAID', 'AI_QUESTION_GEN', 500, 'MONTHLY'),
    ('PAID', 'AI_DATA_ANALYSIS', 50, 'MONTHLY'),
    ('PAID', 'AI_NEWSLETTER_GEN', 10, 'MONTHLY'),
    ('PAID', 'ACTIVE_CAMPAIGNS', 10, 'NEVER'),
    ('PAID', 'SURVEY_COUNT', 50, 'NEVER');
