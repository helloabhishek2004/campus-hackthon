-- ==============================================================================
-- Smart Campus: 007_faculty_academic_seed.sql
-- Seed courses, faculty academic assignments, and formal academic documents
-- ==============================================================================

-- 1. Seed Courses
INSERT INTO public.courses (id, code, name, department_id, program_id, semester, credits, is_active) VALUES
  (
    '77777777-7777-7777-7777-777777770001',
    'CS202',
    'Data Structures & Algorithms',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    4,
    4,
    true
  ),
  (
    '77777777-7777-7777-7777-777777770002',
    'CS401',
    'Distributed Systems',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    6,
    4,
    true
  ),
  (
    '77777777-7777-7777-7777-777777770003',
    'CS301',
    'Database Management Systems',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    4,
    4,
    true
  ),
  (
    '77777777-7777-7777-7777-777777770004',
    'EC303',
    'Signals & Systems',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222203',
    4,
    4,
    true
  ),
  (
    '77777777-7777-7777-7777-777777770005',
    'EC305',
    'Microcontrollers & Embedded Systems',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222203',
    6,
    4,
    true
  )
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed Faculty Academic Assignments
INSERT INTO public.faculty_academic_assignments (
  id,
  faculty_institutional_user_id,
  assignment_type,
  department_id,
  program_id,
  academic_year,
  semester,
  section,
  course_id,
  role_title,
  academic_session,
  is_active
) VALUES
  -- Dr. Aris Thorne (CSE HOD)
  (
    '77777777-7777-7777-7777-777777770011',
    '44444444-4444-4444-4444-444444440011',
    'department',
    '11111111-1111-1111-1111-111111111101',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Head of Department (CSE)',
    '2025-2026',
    true
  ),
  -- Prof. Radhika Seth (CSE Class Coordinator Year 3 Section A & Dept Coordinator)
  (
    '77777777-7777-7777-7777-777777770012',
    '44444444-4444-4444-4444-444444440002',
    'class',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    3,
    6,
    'A',
    NULL,
    'Class Coordinator (CSE Year 3 - Sec A)',
    '2025-2026',
    true
  ),
  -- Dr. Alok Verma (Course Coordinator: CS202 Data Structures)
  (
    '77777777-7777-7777-7777-777777770013',
    '44444444-4444-4444-4444-444444440003',
    'course',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    2,
    4,
    'A',
    '77777777-7777-7777-7777-777777770001',
    'Course Coordinator (CS202)',
    '2025-2026',
    true
  ),
  -- Dr. Sundar Pichai (Course Coordinator: CS401 Distributed Systems)
  (
    '77777777-7777-7777-7777-777777770014',
    '44444444-4444-4444-4444-444444440001',
    'course',
    '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201',
    3,
    6,
    'A',
    '77777777-7777-7777-7777-777777770002',
    'Course Coordinator (CS401)',
    '2025-2026',
    true
  ),
  -- Dr. Elena Vance (ECE HOD)
  (
    '77777777-7777-7777-7777-777777770015',
    '44444444-4444-4444-4444-444444440012',
    'department',
    '11111111-1111-1111-1111-111111111102',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Head of Department (ECE)',
    '2025-2026',
    true
  ),
  -- Prof. Shalini Roy (ECE Class Coordinator Year 3 Section A)
  (
    '77777777-7777-7777-7777-777777770016',
    '44444444-4444-4444-4444-444444440004',
    'class',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222203',
    3,
    6,
    'A',
    NULL,
    'Class Coordinator (ECE Year 3 - Sec A)',
    '2025-2026',
    true
  ),
  -- Dr. Harish Namboodiri (ECE Course Coordinator: EC303 Signals & Systems)
  (
    '77777777-7777-7777-7777-777777770017',
    '44444444-4444-4444-4444-444444440005',
    'course',
    '11111111-1111-1111-1111-111111111102',
    '22222222-2222-2222-2222-222222222203',
    2,
    4,
    'A',
    '77777777-7777-7777-7777-777777770004',
    'Course Coordinator (EC303)',
    '2025-2026',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Initial Formal Academic Documents
INSERT INTO public.academic_documents (
  id,
  sender_profile_id,
  sender_institutional_user_id,
  sender_name,
  sender_role,
  sender_department,
  document_type,
  title,
  content,
  priority,
  status,
  target_scope,
  target_department_id,
  target_department_code,
  target_program_id,
  target_program_code,
  target_academic_year,
  target_semester,
  target_section,
  target_display_name,
  delivery_count,
  read_count,
  created_at,
  updated_at
) VALUES
  (
    '77777777-7777-7777-7777-777777770101',
    '44444444-4444-4444-4444-444444440002',
    '44444444-4444-4444-4444-444444440002',
    'Prof. Radhika Seth',
    'Class Coordinator',
    'CSE',
    'Assessment Notice',
    'Continuous Assessment Test 2 - Seating & Instructions (CSE 2026 A)',
    'All students of CSE Year 3 Section A must report to Exam Hall B-201 at 09:45 AM sharp. Mobile phones, programmable calculators, and unauthorized materials are strictly prohibited. Identity cards are mandatory for verification.',
    'high',
    'SENT',
    'class',
    '11111111-1111-1111-1111-111111111101',
    'CSE',
    '22222222-2222-2222-2222-222222222201',
    'BTECH_CSE',
    3,
    6,
    'A',
    'B.Tech CSE Year 3 (Section A)',
    2,
    1,
    '2026-10-01T08:00:00Z',
    '2026-10-01T08:00:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777770102',
    '44444444-4444-4444-4444-444444440003',
    '44444444-4444-4444-4444-444444440003',
    'Dr. Alok Verma',
    'Course Coordinator',
    'CSE',
    'Assignment',
    'CS202 Data Structures - Assignment 2: AVL Tree and Graph Traversal',
    'Implement a self-balancing AVL Tree in C++ with rotation balancing algorithms and Dijkstra shortest-path algorithms. Submit source files via portal before deadline. Late submissions will incur a 10% grade deduction per calendar day.',
    'normal',
    'SENT',
    'course',
    '11111111-1111-1111-1111-111111111101',
    'CSE',
    '22222222-2222-2222-2222-222222222201',
    'BTECH_CSE',
    2,
    4,
    'A',
    'CS202: Data Structures & Algorithms',
    2,
    0,
    '2026-09-30T14:30:00Z',
    '2026-09-30T14:30:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777770103',
    '44444444-4444-4444-4444-444444440011',
    '44444444-4444-4444-4444-444444440011',
    'Dr. Aris Thorne',
    'Head of Department',
    'CSE',
    'Department Notice',
    'Department Academic Calendar & Lab Renovations Notice',
    'The Department of Computer Science & Engineering has finalized the lab renovation timeline. Cloud Computing Lab and Systems Lab will be upgraded with new GPU workstations. Please review the updated practical schedule.',
    'normal',
    'SENT',
    'department',
    '11111111-1111-1111-1111-111111111101',
    'CSE',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'CSE Department - All Students & Faculty',
    10,
    6,
    '2026-09-29T10:00:00Z',
    '2026-09-29T10:00:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777770104',
    '44444444-4444-4444-4444-444444440011',
    '44444444-4444-4444-4444-444444440011',
    'Dr. Aris Thorne',
    'Head of Department',
    'CSE',
    'Meeting Notice',
    'Inter-Department Joint Curriculum Committee Meeting: CSE & ECE',
    'Official academic communication to ECE Department leadership regarding joint embedded AI elective curriculum harmonization. Meeting scheduled for Friday at 3:30 PM in Senate Hall.',
    'high',
    'SENT',
    'cross_department',
    '11111111-1111-1111-1111-111111111102',
    'ECE',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'ECE Department Faculty Leadership',
    3,
    2,
    '2026-09-28T16:00:00Z',
    '2026-09-28T16:00:00Z'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Initial Document Recipients
INSERT INTO public.academic_document_recipients (
  document_id,
  recipient_profile_id,
  recipient_institutional_user_id,
  recipient_role,
  recipient_name,
  is_read,
  read_at
) VALUES
  -- doc 0101 (CSE Year 3 Section A Class)
  (
    '77777777-7777-7777-7777-777777770101',
    '33333333-3333-3333-3333-333333330001',
    '33333333-3333-3333-3333-333333330001',
    'student',
    'Aarav Sharma',
    true,
    '2026-10-01T08:15:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777770101',
    '33333333-3333-3333-3333-333333330002',
    '33333333-3333-3333-3333-333333330002',
    'student',
    'Diya Patel',
    false,
    NULL
  ),
  -- doc 0104 (Cross-department sent by CSE HOD to ECE Faculty)
  (
    '77777777-7777-7777-7777-777777770104',
    '44444444-4444-4444-4444-444444440012',
    '44444444-4444-4444-4444-444444440012',
    'faculty',
    'Dr. Elena Vance',
    true,
    '2026-09-28T16:45:00Z'
  ),
  (
    '77777777-7777-7777-7777-777777770104',
    '44444444-4444-4444-4444-444444440004',
    '44444444-4444-4444-4444-444444440004',
    'faculty',
    'Prof. Shalini Roy',
    false,
    NULL
  ),
  (
    '77777777-7777-7777-7777-777777770104',
    '44444444-4444-4444-4444-444444440005',
    '44444444-4444-4444-4444-444444440005',
    'faculty',
    'Dr. Harish Namboodiri',
    true,
    '2026-09-28T17:00:00Z'
  )
ON CONFLICT (document_id, recipient_institutional_user_id) DO NOTHING;
