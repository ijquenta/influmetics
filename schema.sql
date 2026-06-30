-- 1. Tipos de usuario
CREATE TABLE user_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- 2. Usuarios internos
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    country VARCHAR(100),
    user_type_id INTEGER NOT NULL REFERENCES user_type (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Redes sociales
CREATE TABLE social_platform (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'tiktok', 'instagram'
    name VARCHAR(100) NOT NULL
);

-- 4. Influencers
CREATE TABLE "Influencer" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    birth_date DATE,
    niche VARCHAR(150),
    referral_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cuentas de influencers por red social
CREATE TABLE influencer_social_account (
    id SERIAL PRIMARY KEY,
    influencer_id INTEGER NOT NULL REFERENCES influencer (id),
    social_platform_id INTEGER NOT NULL REFERENCES social_platform (id),
    handle VARCHAR(150) NOT NULL,
    profile_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (
        influencer_id,
        social_platform_id
    )
);

-- 6. Tipos de objetivo de campaña
CREATE TABLE campaign_goal_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'awareness', 'acquisition', 'roi'
    name VARCHAR(100) NOT NULL
);

-- 7. Campañas
CREATE TABLE campaign (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    country VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    primary_goal_type_id INTEGER REFERENCES campaign_goal_type (id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Relación Influencer-Campaign (N–N)
CREATE TABLE influencer_campaign (
    id SERIAL PRIMARY KEY,
    influencer_id INTEGER NOT NULL REFERENCES influencer (id),
    campaign_id INTEGER NOT NULL REFERENCES campaign (id),
    agreed_cost NUMERIC(12, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (influencer_id, campaign_id)
);

-- 9. Tipos de contenido
CREATE TABLE content_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'video', 'reel', 'story'
    name VARCHAR(100) NOT NULL
);

-- 10. Posts / piezas de contenido
CREATE TABLE post (
    id SERIAL PRIMARY KEY,
    influencer_id INTEGER NOT NULL REFERENCES influencer (id),
    campaign_id INTEGER REFERENCES campaign (id),
    social_platform_id INTEGER NOT NULL REFERENCES social_platform (id),
    content_type_id INTEGER REFERENCES content_type (id),
    url TEXT NOT NULL,
    caption TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    is_takenos_content BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_influencer ON post (influencer_id);

CREATE INDEX idx_post_campaign ON post (campaign_id);

CREATE INDEX idx_post_platform ON post (social_platform_id);

CREATE INDEX idx_post_published_at ON post (published_at);

-- 11. Métricas de posts (versionadas en el tiempo)
CREATE TABLE post_metric_snapshot (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES post (id),
    snapshot_date DATE NOT NULL,
    views BIGINT,
    likes BIGINT,
    shares BIGINT,
    clicks BIGINT,
    conversions BIGINT,
    revenue NUMERIC(14, 2),
    roi NUMERIC(10, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, snapshot_date)
);

CREATE INDEX idx_pms_post_date ON post_metric_snapshot (post_id, snapshot_date);

-- 12. Tipos de métricas internas (NUA, NU, NAU, etc.)
CREATE TABLE internal_metric_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'NUA', 'NU', 'NAU', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 13. Métricas internas
CREATE TABLE internal_metric (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaign (id),
    influencer_id INTEGER REFERENCES influencer (id),
    metric_type_id INTEGER NOT NULL REFERENCES internal_metric_type (id),
    metric_date DATE NOT NULL,
    value NUMERIC(14, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (
        campaign_id,
        influencer_id,
        metric_type_id,
        metric_date
    )
);

CREATE INDEX idx_internal_metric_campaign_date ON internal_metric (campaign_id, metric_date);