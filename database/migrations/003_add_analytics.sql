-- Migration 003: Operational, Approval & Analytics Tables for CampNova
-- Creates user_activity, content_updates, audit_logs

CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g. 'search', 'explore', 'view', 'compare'
    module VARCHAR(100) NOT NULL,      -- e.g. 'colleges', 'courses', 'domains', 'exams'
    record_id VARCHAR(100),
    search_query VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_updates (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    module_name VARCHAR(100) NOT NULL, -- e.g. 'colleges', 'courses', 'exams'
    record_id VARCHAR(100),
    action VARCHAR(50) NOT NULL,       -- 'create', 'update', 'delete'
    old_data JSONB,
    new_data JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
