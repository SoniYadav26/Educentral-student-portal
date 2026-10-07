"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BookOpenCheck, FileText, Home, LogOut, MessageSquareText, Quote, Settings, UploadCloud } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const navigation = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "PYQs & Syllabus", href: "/dashboard/pyqs", icon: BookOpenCheck },
  { label: "Notes", href: "/dashboard/notes", icon: FileText },
  { label: "FEEDBACK", href: "/dashboard/feedback", icon: MessageSquareText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const quotes = [
  "Small progress is still progress.",
  "Make today a little more curious.",
  "The best notes are the ones you revisit.",
  "One focused hour can change the whole day.",
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessError, setAccessError] = useState("");

  useEffect(() => {
    let active = true;
    const unauthorizedRedirect = new URLSearchParams(window.location.search).get("error") === "unauthorized";

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) {
        setUser(null);
        if (!unauthorizedRedirect) router.replace("/");
        setCheckingAuth(false);
      } else {
        setUser(session.user);
        setCheckingAuth(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (unauthorizedRedirect) setAccessError("Unauthorized: Admin access required");
      if (data.session) {
        setUser(data.session.user);
      } else {
        if (!unauthorizedRedirect) router.replace("/");
      }
      setCheckingAuth(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (checkingAuth) {
    return <main className="loading-state min-h-screen"><span className="spin"><BookOpen size={20} /></span><span>Opening your study space…</span></main>;
  }

  if (!user && accessError) {
    return <main className="loading-state min-h-screen"><div className="inline-error" role="alert">{accessError}</div><Link className="resource-action primary" href="/">Go to sign in</Link></main>;
  }

  if (!user) return <main className="loading-state min-h-screen"><span className="spin"><BookOpen size={20} /></span><span>Opening your study space…</span></main>;

  const role = String(user.app_metadata.role ?? "student").toLowerCase();
  const displayName = String(user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Student");
  const initials = displayName.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "EC";
  const quote = quotes[(new Date().getDate() + new Date().getMonth()) % quotes.length];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Link className="brand-lockup" href="/dashboard">
          <span className="brand-mark"><BookOpen size={19} /></span><span>EduCentral</span>
        </Link>
        <p className="sidebar-label">STUDY SPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} className={active ? "side-link active" : "side-link"} aria-current={active ? "page" : undefined}><Icon size={17} /><span>{label}</span></Link>;
          })}
          {role === "admin" && <>
            <Link href="/dashboard/feedbacks" className={pathname === "/dashboard/feedbacks" ? "side-link active" : "side-link"} aria-current={pathname === "/dashboard/feedbacks" ? "page" : undefined}><MessageSquareText size={17} /><span>Feedbacks</span></Link>
            <Link href="/admin/upload" className={pathname.startsWith("/admin/upload") ? "side-link active" : "side-link"} aria-current={pathname.startsWith("/admin/upload") ? "page" : undefined}><UploadCloud size={17} /><span>Upload resources</span></Link>
          </>}
        </nav>
        <div className="sidebar-bottom">A little better, every day.</div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="quote-line"><Quote size={15} /><span>{quote}</span></div>
          <div className="user-tools">
            <div className="user-identity"><span className="avatar" aria-hidden="true">{initials}</span><span className="user-email">{user.email}</span></div>
            <button type="button" className="icon-button" aria-label="Sign out" title="Sign out" onClick={handleLogout}><LogOut size={16} /></button>
          </div>
        </header>
        <main className="dashboard-content">
          {accessError && <div className="inline-error" role="alert">{accessError}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}