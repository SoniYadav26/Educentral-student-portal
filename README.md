EduCentral — Next-Gen Student Portal & Campus Management System

EduCentral is a robust, full-stack web application developed to modernize campus workflows, streamline student-faculty interactions, and manage academic resources in real time. Built with performance, security, and scalability in mind, it leverages Next.js (App Router) for fast SSR rendering, Supabase for PostgreSQL data management, and Tailwind CSS for an intuitive, responsive user interface.


🚀 Key Features

 1. Production-Grade Authentication & Authorization

Real-time Email Verification: Powered by SMTP integration, ensuring verified student access.

Role-Based Access Control (RBAC): Granular permissions for Students, Faculty, and Administrators.

Protected Routes: Next.js Middleware guarding internal student dashboard routes.

 2. Student Portal & Academic Dashboard

Course & Attendance Tracking: Live statistics for active courses and attendance percentages.

Resource Sharing Hub: Centralized platform for downloading notes, lecture PDFs, and syllabus guides.

Real-Time Notifications: Instant updates on announcements, deadlines, and grade releases.

 3. Backend & Cloud Storage

PostgreSQL Database: Relational data structures optimized for fast query execution and strict data integrity.

Supabase Storage Buckets: Secure file uploads for student assignment submissions and profile avatars.

Automated Email Workflows: Triggered email notifications for password resets, signups, and alerts.

🛠️ Tech Stack & ArchitectureLayerTechnology UsedFrontend FrameworkNext.js 14+ (React, App Router)Styling & UITailwind CSS + Lucide React IconsBackend & DatabaseSupabase (PostgreSQL)AuthenticationSupabase Auth (Custom SMTP Gateway)File StorageSupabase Storage BucketsDeploymentVercel (CI/CD Pipeline)📸 Dashboard PreviewAdd your application screenshots here after deployment.Student DashboardCourse View![Dashboard Screen](./public/dashboard-preview.png)![Course Screen](./public/courses-preview.png)


📊 Database Architecture

The system uses normalized relational tables inside Supabase PostgreSQL:

profiles: Stores student/faculty metadata linked to Supabase auth.users.

courses: Manages course listings, instructors, and schedules.

enrollments: Junction table mapping student enrollments and grades.

announcements: Broadcast messages posted by institutional admins.
