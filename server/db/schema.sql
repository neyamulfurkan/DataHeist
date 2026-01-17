-- server/db/schema.sql
-- DataHeist PostgreSQL Database Schema
-- Version: 1.0.0
-- Purpose: User accounts, save data persistence, and leaderboard tracking

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- SAVE_DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS save_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  save_type VARCHAR(20) NOT NULL,
  data_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT save_type_valid CHECK (save_type IN ('current_run', 'meta_progression', 'settings')),
  CONSTRAINT data_json_not_empty CHECK (data_json != '{}'::jsonb AND data_json IS NOT NULL),
  UNIQUE(user_id, save_type)
);

CREATE INDEX idx_save_data_user_type ON save_data(user_id, save_type);
CREATE INDEX idx_save_data_updated ON save_data(updated_at DESC);
CREATE INDEX idx_save_data_json_runid ON save_data USING gin((data_json->'runId'));
CREATE INDEX idx_save_data_json_version ON save_data USING gin((data_json->'version'));

-- ============================================================================
-- LEADERBOARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  runner_id VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  act_reached INTEGER NOT NULL DEFAULT 1,
  total_turns INTEGER NOT NULL DEFAULT 0,
  max_trace_reached INTEGER NOT NULL DEFAULT 0,
  total_damage_dealt INTEGER NOT NULL DEFAULT 0,
  victory BOOLEAN NOT NULL DEFAULT FALSE,
  run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT runner_id_valid CHECK (runner_id IN ('ghost', 'demon', 'architect')),
  CONSTRAINT act_reached_valid CHECK (act_reached >= 1 AND act_reached <= 3),
  CONSTRAINT score_valid CHECK (score >= 0),
  CONSTRAINT total_turns_valid CHECK (total_turns >= 0)
);

CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);
CREATE INDEX idx_leaderboards_user ON leaderboards(user_id);
CREATE INDEX idx_leaderboards_runner ON leaderboards(runner_id);
CREATE INDEX idx_leaderboards_victory ON leaderboards(victory, score DESC);
CREATE INDEX idx_leaderboards_date ON leaderboards(run_date DESC);
CREATE INDEX idx_leaderboards_composite ON leaderboards(runner_id, victory, score DESC);

-- ============================================================================
-- ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_achievements_id ON user_achievements(achievement_id);
CREATE INDEX idx_achievements_date ON user_achievements(earned_at DESC);

-- ============================================================================
-- STATISTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_statistics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_victories INTEGER NOT NULL DEFAULT 0,
  total_defeats INTEGER NOT NULL DEFAULT 0,
  total_damage_dealt BIGINT NOT NULL DEFAULT 0,
  total_damage_taken BIGINT NOT NULL DEFAULT 0,
  total_cards_played INTEGER NOT NULL DEFAULT 0,
  total_combats_won INTEGER NOT NULL DEFAULT 0,
  total_turns_played INTEGER NOT NULL DEFAULT 0,
  fastest_run_turns INTEGER DEFAULT NULL,
  highest_trace_reached INTEGER NOT NULL DEFAULT 0,
  favorite_runner VARCHAR(50) DEFAULT NULL,
  most_played_card VARCHAR(50) DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT total_runs_valid CHECK (total_runs >= 0),
  CONSTRAINT total_victories_valid CHECK (total_victories >= 0 AND total_victories <= total_runs),
  CONSTRAINT total_defeats_valid CHECK (total_defeats >= 0 AND total_defeats <= total_runs)
);

CREATE INDEX idx_statistics_user ON user_statistics(user_id);
CREATE INDEX idx_statistics_victories ON user_statistics(total_victories DESC);
CREATE INDEX idx_statistics_fastest ON user_statistics(fastest_run_turns ASC) WHERE fastest_run_turns IS NOT NULL;

-- ============================================================================
-- SESSION TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT token_not_empty CHECK (char_length(token) > 0)
);

CREATE INDEX idx_session_tokens_token ON session_tokens(token);
CREATE INDEX idx_session_tokens_user ON session_tokens(user_id);
CREATE INDEX idx_session_tokens_expires ON session_tokens(expires_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_save_data_updated_at
  BEFORE UPDATE ON save_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTION FOR EXPIRED SESSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM session_tokens WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW leaderboard_top_100 AS
SELECT 
  l.id,
  u.username,
  l.runner_id,
  l.score,
  l.act_reached,
  l.total_turns,
  l.victory,
  l.run_date,
  ROW_NUMBER() OVER (ORDER BY l.score DESC) AS rank
FROM leaderboards l
JOIN users u ON l.user_id = u.id
WHERE l.victory = TRUE
ORDER BY l.score DESC
LIMIT 100;

CREATE OR REPLACE VIEW user_best_scores AS
SELECT DISTINCT ON (user_id, runner_id)
  user_id,
  runner_id,
  score,
  act_reached,
  total_turns,
  victory,
  run_date
FROM leaderboards
ORDER BY user_id, runner_id, score DESC;

-- ============================================================================
-- SAMPLE DATA INSERT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION insert_sample_user()
RETURNS void AS $$
BEGIN
  INSERT INTO users (username, email, password_hash)
  VALUES ('test_user', 'test@dataheist.com', '$2b$10$samplehashfordemopurposes')
  ON CONFLICT (username) DO NOTHING;
  
  INSERT INTO user_statistics (user_id, total_runs, total_victories)
  SELECT id, 0, 0 FROM users WHERE username = 'test_user'
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (ADJUST BASED ON YOUR USER SETUP)
-- ============================================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dataheist_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dataheist_user;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version) VALUES ('1.0.0');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================