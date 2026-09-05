import sys, os, time, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import translation_service

CORE_PHRASES = [
    # Navigation & 19 Modules
    "Explore", "Colleges", "Courses", "Domains", "Exams", "Study Materials",
    "Reviews", "Rankings", "Careers", "Placements", "Jobs", "Internships",
    "Admissions", "Scholarships", "Facilities", "Entrance Exams", "Comparison",
    "Mentors", "Events", "News", "Home", "Login", "Register", "Menu", "Profile",
    
    # Common UI Actions
    "Search", "Filter", "All", "View Details", "Apply Now", "Download",
    "Compare", "Enquire", "Enquire Now", "Update Details", "Submit", "Cancel",
    "Save", "Close", "Back", "Next", "Previous", "Read More", "Learn More",
    "Official Website", "Sort By", "Clear All", "Reset Filters",

    # Hero & Branding
    "THE CLEARER WAY FORWARD", "Find the Right College", "Unlock Your Future",
    "From your first question to your first offer. Explore education with the clarity you deserve.",
    "Top Colleges Across India", "Popular Courses", "Leading Mentors",

    # Categories & Streams
    "All Streams", "Engineering", "Management", "Medical", "Arts & Science",
    "Commerce", "Law", "Pharmacy", "Design", "Agriculture", "Architecture",
    "Computer Science / CSE", "Information Technology", "Mechanical Engineering",
    "Civil Engineering", "Electrical Engineering", "Electronics & Communication",

    # Details & Metrics
    "NIRF Rank", "Fees", "Average Package", "Highest Package", "Eligibility",
    "Duration", "Location", "Accreditation", "Verified", "Top Recruiters",
    "Placement Statistics", "Campus Facilities", "Scholarship Opportunities",
    "Admission Process", "Key Dates", "Exam Date", "Undergraduate (UG)",
    "Postgraduate (PG)", "Diploma", "Doctorate (Ph.D)", "Full Time", "Part Time",
    "Years", "Annual Tuition Fees", "Cutoff", "Reviews Count", "Rating"
]

print(f"Total core phrases to verify: {len(CORE_PHRASES)}")

py_map = translation_service.LANGUAGE_MAP
print(f"Total target languages: {len(py_map)}")

for lang_code in sorted(py_map.keys()):
    if lang_code == "EN":
        continue
    existing = translation_service.get_language_bundle(lang_code)
    needed = [p for p in CORE_PHRASES if p not in existing]
    if needed:
        print(f"Translating {len(needed)} phrases for {lang_code}...")
        try:
            translation_service.translate_batch(needed, lang_code, "en")
        except Exception as e:
            print(f"  Error translating for {lang_code}: {e}")

print("Pre-population finished. Saving cache to disk...")
translation_service._save_cache_to_disk()
print(f"Final cache stats: {translation_service.get_cache_stats()}")
