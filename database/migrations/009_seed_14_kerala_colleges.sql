-- Migration 009: Seed Kerala State Public Universities for AISHE matching and bulk updates
-- Safe and idempotent: Uses ON CONFLICT (aishe_code) DO NOTHING.

INSERT INTO colleges (
    aishe_code,
    college_name,
    college_type,
    state,
    district,
    location,
    location_type,
    established_year,
    website,
    status
) VALUES
('U-0786', 'A P J ABDUL KALAM TECHNOLOGICAL UNIVERSITY', 'State Public University', 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram, Kerala', 'Urban', 2014, 'https://www.ktu.edu.in', 'active'),
('U-0253', 'Cochin University of Science & Technology, Kochi', 'State Public University', 'Kerala', 'Ernakulam', 'Ernakulam, Kerala', 'Urban', 1971, 'https://www.cusat.ac.in', 'active'),
('U-0256', 'Kannur University, Kannur', 'State Public University', 'Kerala', 'Kannur', 'Kannur, Kerala', 'Rural', 1996, 'https://www.kannuruniversity.ac.in', 'active'),
('U-0257', 'Kerala Agricultural University, Thrissur', 'State Public University', 'Kerala', 'Thrissur', 'Thrissur, Kerala', 'Rural', 1972, 'https://kau.in/', 'active'),
('U-1154', 'KERALA UNIVERSITY OF DIGITAL SCIENCES INNOVATION AND TECHNOLOGY', 'State Public University', 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram, Kerala', 'Rural', 2020, 'https://www.duk.ac.in', 'active'),
('U-0259', 'Kerala University of Fisheries & Ocean Studies, Kochi', 'State Public University', 'Kerala', 'Ernakulam', 'Ernakulam, Kerala', 'Rural', 2010, 'https://www.kufos.ac.in', 'active'),
('U-0630', 'KERALA UNIVERSITY OF HEALTH SCIENCES', 'State Public University', 'Kerala', 'Thrissur', 'Thrissur, Kerala', 'Rural', 2009, 'http://kuhs.ac.in', 'active'),
('U-0261', 'Kerala Veterinary & Animal Science University, Wayanad', 'State Public University', 'Kerala', 'Wayanad', 'Wayanad, Kerala', 'Rural', 2010, 'https://www.kvasu.ac.in', 'active'),
('U-0262', 'Mahatma Gandhi University, Kottayam', 'State Public University', 'Kerala', 'Kottayam', 'Kottayam, Kerala', 'Rural', 1983, 'https://www.mgu.ac.in', 'active'),
('U-0264', 'National University of Advanced Legal Studies, Kochi', 'State Public University', 'Kerala', 'Ernakulam', 'Ernakulam, Kerala', 'Urban', 2002, 'https://www.nuals.ac.in', 'active'),
('U-0265', 'Sree Sankaracharya University of Sanskrit, Kalady', 'State Public University', 'Kerala', 'Ernakulam', 'Ernakulam, Kerala', 'Rural', 1993, 'https://ssus.ac.in', 'active'),
('U-0716', 'THUNCHATH EZHUTHACHAN MALAYALAM UNIVERSITY, TIRUR', 'State Public University', 'Kerala', 'Malappuram', 'Malappuram, Kerala', 'Rural', 2012, 'https://www.malayalamuniversity.edu.in', 'active'),
('U-0251', 'UNIVERSITY OF CALICUT, MALAPPURAM', 'State Public University', 'Kerala', 'Malappuram', 'Malappuram, Kerala', 'Rural', 1968, 'https://www.uoc.ac.in', 'active'),
('U-0260', 'University of Kerala, Thiruvananthapuram', 'State Public University', 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram, Kerala', 'Urban', 1937, 'https://www.keralauniversity.ac.in', 'active')
ON CONFLICT (aishe_code) DO NOTHING;
