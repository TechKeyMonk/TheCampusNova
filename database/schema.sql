-- ==============================================================================
-- CampNova Centralized PostgreSQL Database Schema
-- Database Name: campnova
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'institution')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ------------------------------------------------------------------------------
-- 2. COLLEGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    aishe_code VARCHAR(50) UNIQUE NOT NULL,
    college_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    college_type VARCHAR(100),
    university VARCHAR(255),
    location VARCHAR(150),
    location_type VARCHAR(50),
    district VARCHAR(100),
    state VARCHAR(100),
    established_year INTEGER,
    accreditation VARCHAR(150),
    naac_grade VARCHAR(50),
    nirf_rank TEXT,
    description TEXT,
    address TEXT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    logo_url TEXT,
    badge TEXT,
    reviews_count TEXT,
    stream TEXT,
    fees TEXT,
    cutoff TEXT,
    placement TEXT,
    avg_placement TEXT,
    highest_placement TEXT,
    recruiters TEXT,
    internship_support TEXT,
    eligibility TEXT,
    facilities_list TEXT,
    scholarships_info TEXT,
    courses_list TEXT,
    domains_list TEXT,
    image_url TEXT,
    video_url TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_verification', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(college_name);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_district ON colleges(district);
CREATE INDEX IF NOT EXISTS idx_colleges_location_type ON colleges(location_type);
CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges(status);
CREATE INDEX IF NOT EXISTS idx_colleges_nirf ON colleges(nirf_rank);

-- ------------------------------------------------------------------------------
-- 3. COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(100),
    degree_type VARCHAR(100) DEFAULT 'Undergraduate (UG)',
    duration VARCHAR(100) DEFAULT '4 Years (8 Semesters)',
    eligibility TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(course_name);
CREATE INDEX IF NOT EXISTS idx_courses_degree ON courses(degree_type);

-- ------------------------------------------------------------------------------
-- 4. COLLEGE_COURSES RELATIONSHIP TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_courses (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    fees VARCHAR(100),
    seats INTEGER DEFAULT 60,
    eligibility TEXT,
    admission_status VARCHAR(100) DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_college_course UNIQUE(college_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_col_courses_col ON college_courses(college_id);
CREATE INDEX IF NOT EXISTS idx_col_courses_crs ON college_courses(course_id);

-- ------------------------------------------------------------------------------
-- 5. DOMAINS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    domain_name VARCHAR(255) NOT NULL,
    stream VARCHAR(150),
    description TEXT,
    skills TEXT,
    career_scope TEXT,
    roadmap TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(domain_name);

-- ------------------------------------------------------------------------------
-- 6. EXAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(100) DEFAULT 'National Entrance Examination',
    conducting_body VARCHAR(255),
    eligibility TEXT,
    application_start VARCHAR(100),
    application_end VARCHAR(100),
    exam_date VARCHAR(100),
    official_website VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_name ON exams(exam_name);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);

-- ------------------------------------------------------------------------------
-- 7. EXAM_PREPARATION TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_exam_prep_exam ON exam_preparation(exam_id);

-- ------------------------------------------------------------------------------
-- 8. STUDY_MATERIALS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_study_materials_subject ON study_materials(subject);
CREATE INDEX IF NOT EXISTS idx_study_materials_category ON study_materials(category);

-- ------------------------------------------------------------------------------
-- 9. REVIEWS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_reviews_college ON reviews(college_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ------------------------------------------------------------------------------
-- 10. RANKINGS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_rankings_college ON rankings(college_id);
CREATE INDEX IF NOT EXISTS idx_rankings_rank ON rankings(rank);

-- ------------------------------------------------------------------------------
-- 11. ADMISSIONS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_admissions_college ON admissions(college_id);

-- ------------------------------------------------------------------------------
-- 12. SCHOLARSHIPS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_scholarships_name ON scholarships(scholarship_name);

-- ------------------------------------------------------------------------------
-- 13. FACILITIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
    facility_name VARCHAR(150) NOT NULL,
    description TEXT,
    labs TEXT,
    sports TEXT,
    smart_classes TEXT,
    library TEXT,
    hostel TEXT,
    canteen TEXT,
    score VARCHAR(50),
    raw_details JSONB,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facilities_college ON facilities(college_id);

-- ------------------------------------------------------------------------------
-- 14. CAREERS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_careers_domain ON careers(domain_id);

-- ------------------------------------------------------------------------------
-- 15. JOBS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_jobs_domain ON jobs(domain_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_name);

-- ------------------------------------------------------------------------------
-- 16. INTERNSHIPS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_internships_domain ON internships(domain_id);

-- ------------------------------------------------------------------------------
-- 17. PLACEMENTS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_placements_college ON placements(college_id);

-- ------------------------------------------------------------------------------
-- 18. USER_ACTIVITY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g. 'search', 'explore', 'view', 'compare'
    module VARCHAR(100) NOT NULL,      -- e.g. 'colleges', 'courses', 'domains', 'exams'
    record_id VARCHAR(100),
    search_query VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_module ON user_activity(module);
CREATE INDEX IF NOT EXISTS idx_user_activity_query ON user_activity(search_query);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity(created_at);

-- ------------------------------------------------------------------------------
-- 19. CONTENT_UPDATES TABLE (Admin Approval Workflow)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_content_updates_status ON content_updates(status);
CREATE INDEX IF NOT EXISTS idx_content_updates_module ON content_updates(module_name);

-- ------------------------------------------------------------------------------
-- 20. AUDIT_LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

-- ------------------------------------------------------------------------------
-- 21. MENTORS TABLE
-- ------------------------------------------------------------------------------
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
    facebook_url TEXT DEFAULT NULL,
    instagram_url TEXT DEFAULT NULL,
    linkedin_url TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'approved', 'pending', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mentors_mentor_id ON mentors(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors(status);

-- ------------------------------------------------------------------------------
-- 22. MENTOR_ENQUIRIES TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 23. UPDATE_DETAILS_ACCESS_LOGS TABLE
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 24. EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    college_id VARCHAR(50),
    college_name VARCHAR(255),
    category VARCHAR(150),
    event_date VARCHAR(100),
    time VARCHAR(100),
    venue VARCHAR(255),
    description TEXT,
    registration_link TEXT,
    status VARCHAR(50) DEFAULT 'Upcoming',
    badge VARCHAR(100) DEFAULT 'Official Event',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_college ON events(college_name);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ------------------------------------------------------------------------------
-- 25. NEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    news_id VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    college_name VARCHAR(255),
    category VARCHAR(150),
    published_date VARCHAR(100),
    summary TEXT,
    content TEXT,
    source_url TEXT,
    badge VARCHAR(100) DEFAULT 'Official Bulletin',
    status VARCHAR(50) DEFAULT 'Published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_college ON news(college_name);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);

-- ------------------------------------------------------------------------------
-- 26. COMPARISONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comparisons (
    id SERIAL PRIMARY KEY,
    comparison_id VARCHAR(50) UNIQUE,
    college_1 VARCHAR(255) NOT NULL,
    college_2 VARCHAR(255) NOT NULL,
    category VARCHAR(150),
    metrics JSONB,
    verdict TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparisons_c1 ON comparisons(college_1);
CREATE INDEX IF NOT EXISTS idx_comparisons_c2 ON comparisons(college_2);

-- ------------------------------------------------------------------------------
-- 27. UPLOADED_MEDIA TABLE (Persistent Media Storage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploaded_media (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_uploaded_media_filename ON uploaded_media(filename);


