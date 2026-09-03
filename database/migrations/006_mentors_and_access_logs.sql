-- ==============================================================================
-- Migration 006: Mentors, Mentor Enquiries, and Update Details Access Logs
-- ==============================================================================

-- 1. Mentors Table
CREATE TABLE IF NOT EXISTS mentors (
    id SERIAL PRIMARY KEY,
    mentor_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    profession VARCHAR(255),
    domains TEXT,
    email VARCHAR(255),
    mobile_number VARCHAR(50),
    profile_image TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentors_mentor_id ON mentors(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors(status);

-- 2. Mentor Enquiries Table
CREATE TABLE IF NOT EXISTS mentor_enquiries (
    id SERIAL PRIMARY KEY,
    enquiry_id VARCHAR(50) UNIQUE NOT NULL,
    mentor_id VARCHAR(50) REFERENCES mentors(mentor_id) ON DELETE SET NULL,
    mentor_name VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_mobile VARCHAR(50) NOT NULL,
    terms_accepted BOOLEAN DEFAULT TRUE,
    enquiry_date VARCHAR(50),
    enquiry_time VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reviewed')),
    approval_status VARCHAR(50) DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentor_enquiries_status ON mentor_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_mentor_enquiries_date ON mentor_enquiries(created_at);

-- 3. Update Details Access Logs Table
CREATE TABLE IF NOT EXISTS update_details_access_logs (
    id SERIAL PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    authorized_email VARCHAR(255) NOT NULL,
    aishe_code VARCHAR(100),
    access_date VARCHAR(50) NOT NULL,
    access_time VARCHAR(50) NOT NULL,
    access_status VARCHAR(50) DEFAULT 'Granted',
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_logs_college ON update_details_access_logs(college_name);
CREATE INDEX IF NOT EXISTS idx_access_logs_email ON update_details_access_logs(authorized_email);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON update_details_access_logs(created_at);


-- Dummy seed mentors removed. Only real mentors added via the Admin Panel are stored.

