EduCentral — Next-Gen Student Portal & Campus Management System

Project Objective

The main objective of EduCentral is to modernize and streamline campus academic workflows into a unified digital platform. It provides students, faculty, and administrators with a secure, real-time interface to manage course enrollments, track attendance metrics, share lecture materials, and access institutional announcements seamlessly.

Technical Implementation & Tools Used

Frontend Framework: Next.js 14+ (React, App Router Architecture)

Styling & UI Components: Tailwind CSS, Lucide React Icons

Backend Services & Database: Supabase, PostgreSQL Database

Authentication & Security: Supabase Auth with Custom Gmail SMTP Gateway, Protected Middleware Routes

Cloud Storage: Supabase Storage Buckets (For syllabus PDFs, lecture notes, and submissions)

Deployment & CI/CD: Vercel Hosting Pipeline

Key Features

1. Security & Authentication

Custom SMTP Email Verification: Ensures only verified student email addresses can activate accounts.
Role-Based Access Control (RBAC): Distinct permissions and UI views for Students, Faculty, and Administrators.
Route Protection: Next.js server-side middleware guarding private dashboard pages.

2. Student Dashboard & Academic Tools

Live Attendance & Analytics: Visual indicators and statistical breakdowns for active courses.
Centralized Resource Hub: Real-time download access for course syllabus, study guides, and assignments.
Campus Broadcasts: Instant notification feed for deadlines, exam schedules, and department notices.

3. Data & Cloud Management

Normalized Relational Schema: Built on PostgreSQL for strict data integrity and high performance.
Secure Asset Storage: Automated bucket storage handling user profile avatars and downloadable documents.

Database Architecture

The system utilizes normalized relational tables configured inside Supabase PostgreSQL:

profiles: Stores student and faculty metadata linked directly to system authentication accounts.
courses: Stores course codes, faculty assignments, schedule timings, and credits.
enrollments: Maps student registrations, grade records, and active course statuses.
attendance: Tracks daily student attendance percentages and session logs.
announcements: Stores site-wide broadcast messages and administrative alerts.

Dashboard Preview

1. Main Student Dashboard
Add your main home/dashboard screen here (./public/dashboard-overview.png)

2. Course & Attendance Analytics
Add your course view or attendance page screenshot here (./public/course-attendance.png)

3. Resource Hub & Document Access
Add your lecture notes/resource sharing section screenshot here (./public/resource-hub.png)
