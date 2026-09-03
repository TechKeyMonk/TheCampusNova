-- ==============================================================================
-- CampNova Seed Data
-- ==============================================================================

-- 1. USERS
-- Default admin (Password: 'CampNova@Admin2026') and default student user
INSERT INTO users (name, email, password_hash, role, status) VALUES
('Super Administrator', 'admin@thecampusnova.com', 'scrypt:32768:8:1$vDqj9F6E2hL8vK$a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 'admin', 'active'),
('Institutional Moderator', 'moderator@thecampusnova.com', 'scrypt:32768:8:1$m9N8b7V6c5X4z3$b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3', 'moderator', 'active'),
('Arjun Sharma', 'arjun.sharma@gmail.com', 'scrypt:32768:8:1$z1X2c3V4b5N6m7$c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4', 'user', 'active')
ON CONFLICT (email) DO NOTHING;

-- 2. DOMAINS
INSERT INTO domains (id, domain_name, description, skills, career_scope, status) VALUES
(1, 'Artificial Intelligence & Machine Learning', 'Foundational intelligence models, natural language understanding, neural networks, and automated reasoning pipelines.', 'Python, PyTorch, TensorFlow, LLMs, Computer Vision, MLOps, LangChain', 'Highest industry demand with ₹14L - ₹45L starting CTC across Tier-1 product MNCs and AI research labs.', 'active'),
(2, 'Data Science & Advanced Analytics', 'Statistical data mining, predictive modelling, business intelligence, and real-time streaming architectures.', 'SQL, Python, R, Spark, Snowflake, Tableau, BigQuery, Statistical Inference', 'Surging across FinTech, E-commerce, and healthcare analytics with 38% YoY growth.', 'active'),
(3, 'Web & Full-Stack Cloud Development', 'End-to-end modern web systems, distributed microservices, scalable frontend frameworks, and cloud architectures.', 'TypeScript, React, Next.js, Node.js, Go, Docker, AWS, PostgreSQL, Redis', 'Evergreen core domain powering digital products globally with top placement volumes.', 'active'),
(4, 'Cyber Security & Network Defense', 'Enterprise security operations, penetration testing, threat hunting, cryptography, and zero-trust infrastructure.', 'Network Forensics, Kali Linux, OWASP, Wireshark, SIEM, Cloud Security, Ethical Hacking', 'Critical high-security roles across BFSI, Defense, and global technology infrastructure.', 'active'),
(5, 'Cloud & DevOps Infrastructure', 'Continuous integration, container orchestration, infrastructure as code, and site reliability engineering.', 'AWS, Azure, GCP, Kubernetes, Terraform, Docker, Linux, CI/CD Pipelines, Prometheus', 'High premium trajectory with senior SRE compensation packages exceeding ₹35L / yr.', 'active'),
(6, 'FinTech & Quantitative Finance', 'Algorithmic trading engines, financial modelling, risk analytics, and quantitative trading systems.', 'C++, Python, Stochastic Calculus, Time-Series Models, Market Microstructure, Pandas', 'Top tier campus recruiting at IITs and IIMs with packages from ₹20L to ₹65L / yr.', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. EXAMS
INSERT INTO exams (id, exam_name, exam_type, conducting_body, eligibility, application_start, application_end, exam_date, official_website, description, status) VALUES
(1, 'JEE Main', 'National Engineering Entrance', 'National Testing Agency (NTA)', '10+2 with Physics, Mathematics, and Chemistry/Biology/CS (Min. 75% for NITs/IITs)', '01 Nov 2025', '04 Dec 2025', '22 Jan 2026', 'https://jeemain.nta.ac.in', 'Premier national entrance exam for admission into NITs, IIITs, CFTIs, and qualification for JEE Advanced.', 'active'),
(2, 'JEE Advanced', 'Premier IIT Engineering Entrance', 'IIT Joint Admission Board (JAB)', 'Top 2,50,000 rankers in JEE Main with 10+2 qualification', '23 Apr 2026', '07 May 2026', '17 May 2026', 'https://jeeadv.ac.in', 'The ultimate entrance examination for undergraduate B.Tech and Dual Degree admissions across 23 IITs.', 'active'),
(3, 'NEET UG', 'National Medical Entrance', 'National Testing Agency (NTA)', '10+2 with Physics, Chemistry, Biology/Biotech with min. 50% marks', '09 Feb 2026', '16 Mar 2026', '03 May 2026', 'https://neet.nta.nic.in', 'Mandatory single national entrance examination for MBBS, BDS, AYUSH, and veterinary admissions across India.', 'active'),
(4, 'CAT', 'Premier Management Entrance', 'Indian Institutes of Management (IIMs)', 'Bachelor degree in any discipline with minimum 50% aggregate (45% for reserved)', '02 Aug 2026', '20 Sep 2026', '29 Nov 2026', 'https://iimcat.ac.in', 'Computer-based national aptitude test for MBA / PGDM admissions across 21 IIMs and 100+ top B-schools.', 'active'),
(5, 'GATE', 'National Graduate Engineering Entrance', 'IISc / IIT Consortium', 'B.E. / B.Tech / M.Sc / MCA or final year enrolled students', '28 Aug 2025', '29 Sep 2025', '07 Feb 2026', 'https://gate.iisc.ac.in', 'National entrance exam testing comprehensive understanding of undergraduate engineering subjects for M.Tech & PSU recruitments.', 'active'),
(6, 'CLAT UG', 'National Law Entrance', 'Consortium of National Law Universities', '10+2 passed with minimum 45% aggregate (40% for SC/ST candidates)', '15 Jul 2025', '03 Nov 2025', '06 Dec 2026', 'https://consortiumofnlus.ac.in', 'Centralized national entrance test for 5-year integrated BA LLB / BBA LLB programs across 24 NLUs.', 'active'),
(7, 'CUET UG', 'Central Universities Entrance', 'National Testing Agency (NTA)', '10+2 passed from recognized board', '27 Feb 2026', '05 Apr 2026', '15 May 2026', 'https://cuetug.ntaonline.in', 'Common University Entrance Test for admission into undergraduate programs across 250+ Central, State, and Deemed universities.', 'active'),
(8, 'BITSAT', 'Premier Institute Entrance', 'BITS Pilani', '10+2 with min. 75% aggregate in PCM/PCB (min. 60% in each)', '15 Jan 2026', '15 Apr 2026', '20 May 2026', 'https://bitsadmission.com', 'Online computer-based test for integrated first-degree programs at BITS Pilani, Goa, and Hyderabad campuses.', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. EXAM PREPARATION
INSERT INTO exam_preparation (exam_id, exam_pattern, syllabus, subjects, preparation_tips, study_plan, resources) VALUES
(1, 'Computer-based Test (CBT), 90 Questions (Attempt 75), 300 Marks, 3 Hours duration. +4 for correct, -1 for incorrect.', 'Complete NCERT Class 11 & 12 Physics, Chemistry, and Mathematics.', 'Physics (25 Qs), Chemistry (25 Qs), Mathematics (25 Qs)', 'Focus 70% time on solving 15 years chapterwise PYQs. Memorize all NCERT chemistry tables.', 'Phase 1: Conceptual clarity & NCERT (Months 1-5). Phase 2: PYQ Drill & Timed Mocks (Months 6-8). Phase 3: Revision & Analysis (Final 60 Days).', 'NCERT Textbooks, HC Verma Concepts of Physics, MS Chouhan Organic Chemistry, Cengage Mathematics Series')
ON CONFLICT (exam_id) DO NOTHING;

-- 5. SCHOLARSHIPS
INSERT INTO scholarships (scholarship_name, provider, eligibility, amount, application_start, application_end, application_url, description, status) VALUES
('National Merit Scholarship Scheme', 'Ministry of Education, Govt. of India', 'Class 12 passed with >80th percentile in relevant board; Family income < ₹4.5 Lakh/yr', '₹20,000 / year', '01 Aug 2026', '31 Oct 2026', 'https://scholarships.gov.in', 'Financial support for meritorious underprivileged students pursuing regular degree courses in India.', 'active'),
('Reliance Foundation Undergraduate Scholarship', 'Reliance Foundation', 'First-year undergraduate students in any discipline with min. 60% in 12th; Family income < ₹15 Lakh/yr', 'Up to ₹2,00,000 over degree duration', '01 Sep 2026', '15 Oct 2026', 'https://scholarships.reliancefoundation.org', 'Merit-cum-means scholarship supporting leadership development and higher academic pursuit.', 'active'),
('Aditya Birla Group Scholarship', 'Aditya Birla Centre for Community Initiatives', 'Top rankers entering IITs, BITS Pilani, IIMs, and NLUs', '₹1,00,000 - ₹3,00,000 / year', '15 Jul 2026', '30 Aug 2026', 'https://adityabirlascholars.net', 'Prestigious corporate scholarship acknowledging academic brilliance and future leadership potential.', 'active'),
('Kishore Vaigyanik Protsahan Yojana (KVPY / INSPIRE)', 'Department of Science & Technology (DST)', 'Students pursuing Natural & Basic Sciences (B.Sc / BS / Int. M.Sc) in top 1% of 12th boards', '₹80,000 / year + ₹20,000 Mentorship grant', '01 Sep 2026', '15 Nov 2026', 'https://online-inspire.gov.in', 'Government scholarship nurturing young researchers and scientists in fundamental sciences.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence IDs
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('domains', 'id'), coalesce(max(id), 1)) FROM domains;
SELECT setval(pg_get_serial_sequence('exams', 'id'), coalesce(max(id), 1)) FROM exams;
SELECT setval(pg_get_serial_sequence('scholarships', 'id'), coalesce(max(id), 1)) FROM scholarships;
