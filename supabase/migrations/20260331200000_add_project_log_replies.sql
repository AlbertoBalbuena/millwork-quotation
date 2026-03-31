CREATE TABLE project_log_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id      UUID NOT NULL REFERENCES project_logs(id) ON DELETE CASCADE,
  comment     TEXT NOT NULL,
  author_id   UUID REFERENCES team_members(id) ON DELETE SET NULL,
  author_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_log_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on project_log_replies"
  ON project_log_replies FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_project_log_replies_log_id ON project_log_replies(log_id);
