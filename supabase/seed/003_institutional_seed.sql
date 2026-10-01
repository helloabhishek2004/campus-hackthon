-- ==============================================================================
-- Smart Campus: 003_institutional_seed.sql
-- Deterministic seed data: 50 institutional users, biodata, and role assignments
-- ==============================================================================

-- 1. Seed Departments
INSERT INTO public.departments (id, code, name, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'CSE', 'Computer Science & Engineering', true),
  ('11111111-1111-1111-1111-111111111102', 'ECE', 'Electronics & Communication Engineering', true),
  ('11111111-1111-1111-1111-111111111103', 'MECH', 'Mechanical Engineering', true),
  ('11111111-1111-1111-1111-111111111104', 'CIVIL', 'Civil Engineering', true),
  ('11111111-1111-1111-1111-111111111105', 'IT', 'Information Technology', true),
  ('11111111-1111-1111-1111-111111111106', 'MGMT', 'Management Studies', true),
  ('11111111-1111-1111-1111-111111111107', 'ADMIN', 'Campus Administration', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed Programs
INSERT INTO public.programs (id, code, name, degree, department_id, duration_years, is_active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'BTECH_CSE', 'Bachelor of Technology in Computer Science & Engineering', 'B.Tech', '11111111-1111-1111-1111-111111111101', 4, true),
  ('22222222-2222-2222-2222-222222222202', 'MTECH_CSE', 'Master of Technology in Computer Science & Engineering', 'M.Tech', '11111111-1111-1111-1111-111111111101', 2, true),
  ('22222222-2222-2222-2222-222222222203', 'BTECH_ECE', 'Bachelor of Technology in Electronics & Communication', 'B.Tech', '11111111-1111-1111-1111-111111111102', 4, true),
  ('22222222-2222-2222-2222-222222222204', 'BTECH_MECH', 'Bachelor of Technology in Mechanical Engineering', 'B.Tech', '11111111-1111-1111-1111-111111111103', 4, true),
  ('22222222-2222-2222-2222-222222222205', 'BTECH_CIVIL', 'Bachelor of Technology in Civil Engineering', 'B.Tech', '11111111-1111-1111-1111-111111111104', 4, true),
  ('22222222-2222-2222-2222-222222222206', 'BTECH_IT', 'Bachelor of Technology in Information Technology', 'B.Tech', '11111111-1111-1111-1111-111111111105', 4, true),
  ('22222222-2222-2222-2222-222222222207', 'MBA', 'Master of Business Administration', 'MBA', '11111111-1111-1111-1111-111111111106', 2, true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- 3. Seed Students (35 students: STU2026001 - STU2026035)
INSERT INTO public.institutional_users (id, institutional_id, full_name, phone, email, primary_role, is_active) VALUES
  ('33333333-3333-3333-3333-333333330001', 'STU2026001', 'Aarav Sharma', '+919876500001', 'aarav.sharma@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330002', 'STU2026002', 'Diya Patel', '+919876500002', 'diya.patel@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330003', 'STU2026003', 'Rohan Verma', '+919876500003', 'rohan.verma@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330004', 'STU2026004', 'Ananya Iyer', '+919876500004', 'ananya.iyer@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330005', 'STU2026005', 'Vikram Singh', '+919876500005', 'vikram.singh@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330006', 'STU2026006', 'Pooja Nair', '+919876500006', 'pooja.nair@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330007', 'STU2026007', 'Karthik Raja', '+919876500007', 'karthik.raja@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330008', 'STU2026008', 'Sneha Kulkarni', '+919876500008', 'sneha.kulkarni@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330009', 'STU2026009', 'Aditya Joshi', '+919876500009', 'aditya.joshi@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330010', 'STU2026010', 'Meera Menon', '+919876500010', 'meera.menon@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330011', 'STU2026011', 'Rahul Deshmukh', '+919876500011', 'rahul.deshmukh@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330012', 'STU2026012', 'Tanvi Reddy', '+919876500012', 'tanvi.reddy@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330013', 'STU2026013', 'Arjun Gupta', '+919876500013', 'arjun.gupta@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330014', 'STU2026014', 'Sanya Kapoor', '+919876500014', 'sanya.kapoor@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330015', 'STU2026015', 'Nikhil Bhat', '+919876500015', 'nikhil.bhat@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330016', 'STU2026016', 'Rhea Sen', '+919876500016', 'rhea.sen@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330017', 'STU2026017', 'Gautam Pillai', '+919876500017', 'gautam.pillai@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330018', 'STU2026018', 'Ishita Banerjee', '+919876500018', 'ishita.banerjee@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330019', 'STU2026019', 'Siddharth Rao', '+919876500019', 'siddharth.rao@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330020', 'STU2026020', 'Kavya Murthy', '+919876500020', 'kavya.murthy@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330021', 'STU2026021', 'Varun Chawla', '+919876500021', 'varun.chawla@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330022', 'STU2026022', 'Priyanka Das', '+919876500022', 'priyanka.das@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330023', 'STU2026023', 'Ayush Mittal', '+919876500023', 'ayush.mittal@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330024', 'STU2026024', 'Shruti Saxena', '+919876500024', 'shruti.saxena@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330025', 'STU2026025', 'Harsh Vardhan', '+919876500025', 'harsh.vardhan@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330026', 'STU2026026', 'Deepa Ghosh', '+919876500026', 'deepa.ghosh@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330027', 'STU2026027', 'Manish Agarwal', '+919876500027', 'manish.agarwal@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330028', 'STU2026028', 'Anjali Nambiar', '+919876500028', 'anjali.nambiar@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330029', 'STU2026029', 'Pranav Hegde', '+919876500029', 'pranav.hegde@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330030', 'STU2026030', 'Aishwarya R', '+919876500030', 'aishwarya.r@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330031', 'STU2026031', 'Devansh Soni', '+919876500031', 'devansh.soni@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330032', 'STU2026032', 'Bhavna Pandey', '+919876500032', 'bhavna.pandey@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330033', 'STU2026033', 'Abhishek Tiwari', '+919876500033', 'abhishek.tiwari@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330034', 'STU2026034', 'Neha Singhal', '+919876500034', 'neha.singhal@campus.edu', 'student', true),
  ('33333333-3333-3333-3333-333333330035', 'STU2026035', 'Tushar More', '+919876500035', 'tushar.more@campus.edu', 'student', true)
ON CONFLICT (institutional_id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 4. Seed Student Biodata (Matching 35 Students)
INSERT INTO public.student_biodata (institutional_user_id, program_id, department_id, admission_year, graduation_year, academic_year, current_semester, section) VALUES
  -- CSE B.Tech Students
  ('33333333-3333-3333-3333-333333330001', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330002', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330003', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2024, 2028, 2, 4, 'B'),
  ('33333333-3333-3333-3333-333333330004', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2024, 2028, 2, 4, 'A'),
  ('33333333-3333-3333-3333-333333330005', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2022, 2026, 4, 8, 'A'),
  ('33333333-3333-3333-3333-333333330006', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2022, 2026, 4, 8, 'B'),
  ('33333333-3333-3333-3333-333333330007', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2025, 2029, 1, 2, 'A'),
  ('33333333-3333-3333-3333-333333330008', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2025, 2029, 1, 2, 'B'),
  ('33333333-3333-3333-3333-333333330009', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2023, 2027, 3, 6, 'B'),
  ('33333333-3333-3333-3333-333333330010', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 2024, 2028, 2, 4, 'B'),
  -- CSE M.Tech Students
  ('33333333-3333-3333-3333-333333330011', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 2025, 2027, 1, 2, 'A'),
  ('33333333-3333-3333-3333-333333330012', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 2024, 2026, 2, 4, 'A'),
  -- ECE B.Tech Students
  ('33333333-3333-3333-3333-333333330013', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330014', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330015', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2024, 2028, 2, 4, 'A'),
  ('33333333-3333-3333-3333-333333330016', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2024, 2028, 2, 4, 'B'),
  ('33333333-3333-3333-3333-333333330017', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2022, 2026, 4, 8, 'A'),
  ('33333333-3333-3333-3333-333333330018', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2025, 2029, 1, 2, 'A'),
  ('33333333-3333-3333-3333-333333330019', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2023, 2027, 3, 6, 'B'),
  ('33333333-3333-3333-3333-333333330020', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 2024, 2028, 2, 4, 'B'),
  -- MECH B.Tech Students
  ('33333333-3333-3333-3333-333333330021', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111103', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330022', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111103', 2024, 2028, 2, 4, 'A'),
  ('33333333-3333-3333-3333-333333330023', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111103', 2022, 2026, 4, 8, 'A'),
  ('33333333-3333-3333-3333-333333330024', '22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111103', 2025, 2029, 1, 2, 'A'),
  -- CIVIL B.Tech Students
  ('33333333-3333-3333-3333-333333330025', '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111104', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330026', '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111104', 2024, 2028, 2, 4, 'A'),
  ('33333333-3333-3333-3333-333333330027', '22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111104', 2025, 2029, 1, 2, 'A'),
  -- IT B.Tech Students
  ('33333333-3333-3333-3333-333333330028', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 2023, 2027, 3, 6, 'A'),
  ('33333333-3333-3333-3333-333333330029', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 2024, 2028, 2, 4, 'A'),
  ('33333333-3333-3333-3333-333333330030', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 2022, 2026, 4, 8, 'A'),
  ('33333333-3333-3333-3333-333333330031', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 2025, 2029, 1, 2, 'A'),
  ('33333333-3333-3333-3333-333333330032', '22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 2024, 2028, 2, 4, 'B'),
  -- MBA Students
  ('33333333-3333-3333-3333-333333330033', '22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111106', 2025, 2027, 1, 2, 'A'),
  ('33333333-3333-3333-3333-333333330034', '22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111106', 2024, 2026, 2, 4, 'A'),
  ('33333333-3333-3333-3333-333333330035', '22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111106', 2024, 2026, 2, 4, 'B')
ON CONFLICT (institutional_user_id) DO UPDATE SET current_semester = EXCLUDED.current_semester;

-- 5. Seed Faculty Members (10 Regular Faculty: FAC1001 - FAC1010)
INSERT INTO public.institutional_users (id, institutional_id, full_name, phone, email, primary_role, is_active) VALUES
  ('44444444-4444-4444-4444-444444440001', 'FAC1001', 'Dr. Sundar Pichai', '+919876510001', 'sundar.p@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440002', 'FAC1002', 'Prof. Radhika Seth', '+919876510002', 'radhika.seth@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440003', 'FAC1003', 'Dr. Alok Verma', '+919876510003', 'alok.verma@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440004', 'FAC1004', 'Prof. Shalini Roy', '+919876510004', 'shalini.roy@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440005', 'FAC1005', 'Dr. Harish Namboodiri', '+919876510005', 'harish.n@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440006', 'FAC1006', 'Prof. Neha Mahajan', '+919876510006', 'neha.mahajan@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440007', 'FAC1007', 'Dr. Girish Karnad', '+919876510007', 'girish.k@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440008', 'FAC1008', 'Prof. Meenakshi S', '+919876510008', 'meenakshi.s@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440009', 'FAC1009', 'Dr. Chetan Bhagat', '+919876510009', 'chetan.b@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440010', 'FAC1010', 'Prof. Vandana Shiva', '+919876510010', 'vandana.shiva@campus.edu', 'faculty', true)
ON CONFLICT (institutional_id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 6. Seed Faculty Biodata (Regular Faculty)
INSERT INTO public.faculty_biodata (institutional_user_id, department_id, designation, joining_year) VALUES
  ('44444444-4444-4444-4444-444444440001', '11111111-1111-1111-1111-111111111101', 'Professor', 2015),
  ('44444444-4444-4444-4444-444444440002', '11111111-1111-1111-1111-111111111101', 'Associate Professor', 2018),
  ('44444444-4444-4444-4444-444444440003', '11111111-1111-1111-1111-111111111101', 'Assistant Professor', 2021),
  ('44444444-4444-4444-4444-444444440004', '11111111-1111-1111-1111-111111111102', 'Associate Professor', 2017),
  ('44444444-4444-4444-4444-444444440005', '11111111-1111-1111-1111-111111111102', 'Assistant Professor', 2020),
  ('44444444-4444-4444-4444-444444440006', '11111111-1111-1111-1111-111111111103', 'Associate Professor', 2016),
  ('44444444-4444-4444-4444-444444440007', '11111111-1111-1111-1111-111111111103', 'Assistant Professor', 2022),
  ('44444444-4444-4444-4444-444444440008', '11111111-1111-1111-1111-111111111104', 'Associate Professor', 2019),
  ('44444444-4444-4444-4444-444444440009', '11111111-1111-1111-1111-111111111105', 'Assistant Professor', 2021),
  ('44444444-4444-4444-4444-444444440010', '11111111-1111-1111-1111-111111111106', 'Professor', 2014)
ON CONFLICT (institutional_user_id) DO UPDATE SET designation = EXCLUDED.designation;

-- 7. Seed Senior Department Heads (3 HODs: FAC1011 - FAC1013)
INSERT INTO public.institutional_users (id, institutional_id, full_name, phone, email, primary_role, is_active) VALUES
  ('44444444-4444-4444-4444-444444440011', 'FAC1011', 'Dr. Aris Thorne', '+919876520001', 'hod.cse@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440012', 'FAC1012', 'Dr. Elena Vance', '+919876520002', 'hod.ece@campus.edu', 'faculty', true),
  ('44444444-4444-4444-4444-444444440013', 'FAC1013', 'Dr. Rajesh Raman', '+919876520003', 'hod.mech@campus.edu', 'faculty', true)
ON CONFLICT (institutional_id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.faculty_biodata (institutional_user_id, department_id, designation, joining_year) VALUES
  ('44444444-4444-4444-4444-444444440011', '11111111-1111-1111-1111-111111111101', 'Professor & Head of Department (CSE)', 2010),
  ('44444444-4444-4444-4444-444444440012', '11111111-1111-1111-1111-111111111102', 'Professor & Head of Department (ECE)', 2012),
  ('44444444-4444-4444-4444-444444440013', '11111111-1111-1111-1111-111111111103', 'Professor & Head of Department (MECH)', 2008)
ON CONFLICT (institutional_user_id) DO UPDATE SET designation = EXCLUDED.designation;

-- 8. Seed Campus Administrators (2 Admins: ADM9001 - ADM9002)
INSERT INTO public.institutional_users (id, institutional_id, full_name, phone, email, primary_role, is_active) VALUES
  ('55555555-5555-5555-5555-555555550001', 'ADM9001', 'Office of Registrar', '+919876530001', 'registrar@campus.edu', 'admin', true),
  ('55555555-5555-5555-5555-555555550002', 'ADM9002', 'Campus IT Directorate', '+919876530002', 'admin.it@campus.edu', 'admin', true)
ON CONFLICT (institutional_id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 9. Seed Responsibility Tags (Many-to-Many Assignments)
-- HOD tags for the 3 Department Heads
INSERT INTO public.institutional_user_tags (institutional_user_id, tag, scope) VALUES
  ('44444444-4444-4444-4444-444444440011', 'HOD', 'Department of Computer Science & Engineering'),
  ('44444444-4444-4444-4444-444444440011', 'DEPARTMENT_COORDINATOR', 'CSE Accreditation & Academic Affairs'),
  ('44444444-4444-4444-4444-444444440012', 'HOD', 'Department of Electronics & Communication'),
  ('44444444-4444-4444-4444-444444440012', 'DEPARTMENT_COORDINATOR', 'ECE Academic Affairs'),
  ('44444444-4444-4444-4444-444444440013', 'HOD', 'Department of Mechanical Engineering'),
  ('44444444-4444-4444-4444-444444440013', 'DEPARTMENT_COORDINATOR', 'MECH Academic Affairs')
ON CONFLICT (institutional_user_id, tag) DO NOTHING;

-- Coordinator tags for regular faculty
INSERT INTO public.institutional_user_tags (institutional_user_id, tag, scope) VALUES
  ('44444444-4444-4444-4444-444444440001', 'COURSE_COORDINATOR', 'CS401: Distributed Systems'),
  ('44444444-4444-4444-4444-444444440002', 'CLASS_COORDINATOR', 'CSE Year 3 - Section A'),
  ('44444444-4444-4444-4444-444444440002', 'DEPARTMENT_COORDINATOR', 'CSE Laboratory Infrastructure'),
  ('44444444-4444-4444-4444-444444440003', 'COURSE_COORDINATOR', 'CS202: Data Structures & Algorithms'),
  ('44444444-4444-4444-4444-444444440004', 'CLASS_COORDINATOR', 'ECE Year 3 - Section A'),
  ('44444444-4444-4444-4444-444444440005', 'COURSE_COORDINATOR', 'EC303: Signals & Systems'),
  ('44444444-4444-4444-4444-444444440005', 'DEPARTMENT_COORDINATOR', 'ECE Student Mentorship'),
  ('44444444-4444-4444-4444-444444440006', 'CLASS_COORDINATOR', 'MECH Year 3 - Section A'),
  ('44444444-4444-4444-4444-444444440007', 'COURSE_COORDINATOR', 'ME204: Thermodynamics'),
  ('44444444-4444-4444-4444-444444440009', 'CAS_COORDINATOR', 'Campus CAS / Grievance Committee Member')
ON CONFLICT (institutional_user_id, tag) DO NOTHING;

-- Student Coordinator Tags (e.g. Student Council / CAS Student Representatives)
INSERT INTO public.institutional_user_tags (institutional_user_id, tag, scope) VALUES
  ('33333333-3333-3333-3333-333333330001', 'CAS_COORDINATOR', 'Student Grievance Representative - CSE'),
  ('33333333-3333-3333-3333-333333330012', 'CAS_COORDINATOR', 'Postgraduate Student Representative'),
  ('33333333-3333-3333-3333-333333330025', 'CAS_COORDINATOR', 'Student Grievance Representative - CIVIL')
ON CONFLICT (institutional_user_id, tag) DO NOTHING;
