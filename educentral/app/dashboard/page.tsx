"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, FileText, MessageSquareText, NotebookPen } from "lucide-react";
import { supabase } from "@/lib/supabase";

type GreetingPeriod = "morning" | "afternoon" | "evening";

const greetingContent: Record<GreetingPeriod, { greeting: string; subtitle: string }> = {
  morning: { greeting: "Good morning", subtitle: "Ready to learn today? Keep practicing!" },
  afternoon: { greeting: "Good afternoon", subtitle: "Keep up the momentum and make today count." },
  evening: { greeting: "Good evening", subtitle: "Review your daily study progress and celebrate your effort." },
};

function getGreetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

export default function DashboardHome() {
  const [resourceCount, setResourceCount] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("Student");
  const [greetingPeriod, setGreetingPeriod] = useState<GreetingPeriod>("evening");

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("resources").select("id", { count: "exact", head: true }),
    ]).then(([{ data: authData }, { count }]) => {
      if (!active) return;
      setGreetingPeriod(getGreetingPeriod(new Date().getHours()));
      const metadataName = authData.user?.user_metadata.full_name ?? authData.user?.user_metadata.name;
      setDisplayName(typeof metadataName === "string" ? metadataName.trim() || "Student" : "Student");
      setResourceCount(count ?? 0);
    });
    return () => { active = false; };
  }, []);

  const greeting = greetingContent[greetingPeriod];

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <p className="page-kicker">YOUR STUDY SPACE</p>
          <h1>{greeting.greeting}, {displayName}!</h1>
          <p>{greeting.subtitle}</p>
          <p>Find your next useful resource, revisit a tricky topic, or share what could make this space better.</p>
        </div>
        <Link className="hero-link" href="/dashboard/pyqs">Browse materials <ArrowRight size={15} /></Link>
      </section>

      <div className="section-heading"><div><h2>At a glance</h2><p>Your academic resources, all in one place.</p></div></div>
      <section className="stat-grid" aria-label="Resource summary">
        <div className="stat-item"><span className="stat-number">{resourceCount === null ? "—" : resourceCount}</span><span className="stat-label">Available resources</span></div>
        <div className="stat-item"><span className="stat-number">8</span><span className="stat-label">Semesters covered</span></div>
        <div className="stat-item"><span className="stat-number">4</span><span className="stat-label">Branches supported</span></div>
      </section>

      <div className="section-heading"><div><h2>Go somewhere useful</h2><p>Pick up where your coursework takes you.</p></div></div>
      <section className="quick-links">
        <Link className="quick-link" href="/dashboard/pyqs"><BookOpenCheck size={19} /><span>PYQs & syllabus <ArrowRight size={15} /></span></Link>
        <Link className="quick-link" href="/dashboard/notes"><FileText size={19} /><span>Class notes <ArrowRight size={15} /></span></Link>
        <Link className="quick-link" href="/dashboard/feedback"><MessageSquareText size={19} /><span>Share feedback <ArrowRight size={15} /></span></Link>
      </section>
      <div className="section-heading"><div><h2>Keep your momentum</h2><p>Small, steady sessions add up.</p></div><NotebookPen size={19} color="var(--accent)" /></div>
    </>
  );
}