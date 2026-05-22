CREATE TABLE IF NOT EXISTS gpt54_token_usage (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	created_at INTEGER NOT NULL,
	tokens INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gpt54_token_usage_created_at
	ON gpt54_token_usage (created_at);
