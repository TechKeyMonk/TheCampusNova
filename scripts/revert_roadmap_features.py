import sys

def revert_roadmap_in_script():
    with open('script.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove leftover chunk from downloadCoursePathwayPdf
    m1 = 'window.toggleSubjectCompletion = toggleSubjectCompletion;'
    m2 = '// Helper to generate dynamic, course-specific 10-point roadmap enhancements'
    
    idx1 = content.find(m1)
    if idx1 == -1:
        print("ERROR: marker 1 not found")
        sys.exit(1)
    idx1 += len(m1)
    
    idx2 = content.find(m2, idx1)
    if idx2 == -1:
        print("ERROR: marker 2 not found")
        sys.exit(1)

    print(f"Removing leftover PDF snippet ({idx2 - idx1} chars)")
    content = content[:idx1] + "\n\n" + content[idx2:]

    # 2. Remove Course Roadmap Download Action Section
    marker_section = '      <!-- 10. COURSE ROADMAP DOWNLOAD ACTION AT BOTTOM OF FULL ROADMAP -->'
    idx_s = content.find(marker_section)
    if idx_s != -1:
        idx_e = content.find('</section>', idx_s)
        if idx_e != -1:
            idx_e += len('</section>')
            print(f"Removing roadmap download action section ({idx_e - idx_s} chars)")
            content = content[:idx_s] + content[idx_e:]

    with open('script.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Successfully updated script.js!")

if __name__ == '__main__':
    revert_roadmap_in_script()
