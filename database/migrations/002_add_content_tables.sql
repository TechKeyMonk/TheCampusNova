-- Migration 002: Content Tables for CampNova
-- Creates exam_preparation, study_materials, reviews, rankings, admissions, scholarships, facilities, careers, jobs, internships, placements

CREATE TABLE IF NOT EXISTS exam_preparation (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    exam_pattern TEXT,
    syllabus TEXT,
    subjects TEXT,
    preparation_tips TEXT,
    study_plan TEXT,
    resources TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_exam_prep UNIQUE(exam_id)
);

CREATE TABLE IF NOT EXISTS study_materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(150),
    category VARCHAR(100),
    file_url TEXT,
    external_url TEXT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    rating VARCHAR(50) DEFAULT '★★★★★',
    review_text TEXT NOT NULL,
    author_name VARCHAR(150),
    author_role VARCHAR(150),
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rankings (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    ranking_body VARCHAR(150) DEFAULT 'NIRF',
    category VARCHAR(100) DEFAULT 'Overall / Engineering',
    rank INTEGER NOT NULL,
    year INTEGER DEFAULT 2026,
    score VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admissions (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    admission_type VARCHAR(100) DEFAULT 'National Entrance / Counseling',
    eligibility TEXT,
    application_start VARCHAR(100),
    application_end VARCHAR(100),
    admission_process TEXT,
    fees VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scholarships (
    id SERIAL PRIMARY KEY,
    scholarship_name VARCHAR(255) NOT NULL,
    provider VARCHAR(255),
    eligibility TEXT,
    amount VARCHAR(100),
    application_start VARCHAR(100),
    application_end VARCHAR(100),
    application_url TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'upcoming')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    facility_name VARCHAR(150) NOT NULL,
    description TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS careers (
    id SERIAL PRIMARY KEY,
    career_name VARCHAR(255) NOT NULL,
    domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
    description TEXT,
    required_skills TEXT,
    salary_range VARCHAR(100),
    career_path TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
    location VARCHAR(150),
    job_type VARCHAR(100) DEFAULT 'Full-Time',
    experience VARCHAR(100),
    salary VARCHAR(100),
    application_url TEXT,
    deadline VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internships (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
    location VARCHAR(150),
    stipend VARCHAR(100),
    duration VARCHAR(100),
    eligibility TEXT,
    application_url TEXT,
    deadline VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS placements (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    year INTEGER DEFAULT 2026,
    highest_package VARCHAR(100),
    average_package VARCHAR(100),
    placement_percentage VARCHAR(50),
    total_placed INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
