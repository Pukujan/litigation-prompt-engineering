CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county TEXT NOT NULL,
  court TEXT,
  index_number TEXT NOT NULL,
  case_name TEXT,
  case_type TEXT,
  judge_name TEXT,
  part_name TEXT,
  current_phase TEXT,
  current_mini_phase TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (county, index_number)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  nyscef_doc_no INTEGER,
  title TEXT,
  document_type TEXT,
  filed_date TIMESTAMP,
  filed_by TEXT,
  source_file_name TEXT,
  page_count INTEGER,
  extraction_status TEXT,
  text_review_status TEXT DEFAULT 'unreviewed',
  embedded_text_usable BOOLEAN,
  ocr_needed BOOLEAN,
  ocr_used BOOLEAN,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (case_id, nyscef_doc_no)
);

CREATE TABLE document_text_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  version_type TEXT NOT NULL,
  text_content TEXT,
  structured_json JSONB,
  extraction_method TEXT,
  review_status TEXT DEFAULT 'unreviewed',
  created_by TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE document_text_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  text_version_id UUID REFERENCES document_text_versions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  actor_type TEXT,
  actor_name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  task_description TEXT NOT NULL,
  task_type TEXT,
  responsible_party TEXT,
  due_date TIMESTAMP,
  due_date_status TEXT,
  status TEXT DEFAULT 'ai_extracted_unreviewed',
  docketing_note TEXT,
  source_page INTEGER,
  confidence TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id),
  deadline_name TEXT NOT NULL,
  due_date TIMESTAMP NOT NULL,
  calculation_method TEXT,
  controlling_source TEXT,
  source_doc_no INTEGER,
  source_page INTEGER,
  risk_level TEXT,
  status TEXT DEFAULT 'ai_extracted_unreviewed',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE human_review_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  nyscef_doc_no INTEGER,
  page_number INTEGER,
  location TEXT,
  issue TEXT,
  reason TEXT,
  suggested_action TEXT,
  crop_file_path TEXT,
  blocking BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  reviewed_value TEXT,
  reviewer_note TEXT,
  created_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP
);

CREATE TABLE case_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  after_doc_no INTEGER,
  current_phase TEXT,
  current_mini_phase TEXT,
  snapshot_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  run_type TEXT NOT NULL,
  status TEXT NOT NULL,
  input_summary JSONB,
  output_summary JSONB,
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE TABLE pipeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input_json JSONB,
  output_json JSONB,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);
