"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, BookOpen, FileText, LoaderCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type Resource = {
  id: string;
  title: string;
  category: string;
  semester: string | number;
  subject: string;
  branch: string;
  file_url: string;
};

const semesterOptions = Array.from({ length: 8 }, (_, index) => String(index + 1));
const branchOptions = ["CSE", "IT", "ECE", "ME"];

function normalizeSemester(value: string | number) {
  return String(value).toLowerCase().replace(/^sem(?:ester)?\s*/, "").trim();
}

export default function ResourceLibrary({ title, description, categories }: { title: string; description: string; categories: string[] }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadResources() {
      setLoading(true);
      setError("");
      const { data, error: queryError } = await supabase.from("resources").select("*");
      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        setResources([]);
      } else {
        setResources((data ?? []) as Resource[]);
      }
      setLoading(false);
    }
    void loadResources();
    return () => { active = false; };
  }, []);

  const acceptedCategories = categories.map((item) => item.toLowerCase());
  const filtered = resources.filter((resource) => {
    const category = String(resource.category ?? "").toLowerCase();
    const matchesCategory = acceptedCategories.some((item) => category.includes(item));
    const matchesSemester = !semester || normalizeSemester(resource.semester) === semester;
    const matchesBranch = !branch || String(resource.branch ?? "").toUpperCase() === branch;
    return matchesCategory && matchesSemester && matchesBranch;
  });

  return (
    <>
      <p className="page-kicker">RESOURCE LIBRARY</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      <div className="filter-row">
        <div className="filter-field"><label htmlFor="semester-filter">Semester</label><select id="semester-filter" className="field-control" value={semester} onChange={(event) => setSemester(event.target.value)}><option value="">All semesters</option>{semesterOptions.map((value) => <option key={value} value={value}>Sem {value}</option>)}</select></div>
        <div className="filter-field"><label htmlFor="branch-filter">Branch</label><select id="branch-filter" className="field-control" value={branch} onChange={(event) => setBranch(event.target.value)}><option value="">All branches</option>{branchOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
        {!loading && !error && <span className="result-count">{filtered.length} {filtered.length === 1 ? "resource" : "resources"}</span>}
      </div>

      {loading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>Loading study materials…</span></div> : error ? <div className="inline-error" role="alert">Could not load resources: {error}</div> : filtered.length === 0 ? (
        <div className="empty-state"><BookOpen size={22} /><h3>No materials found</h3><p>Try a different semester or branch, or check back when new resources are added.</p></div>
      ) : (
        <div className="resource-grid">
          {filtered.map((resource) => (
            <article className="resource-card" key={resource.id}>
              <div className="resource-card-top"><span className="resource-icon"><FileText size={18} /></span><div className="badge-row"><span className="badge accent">{resource.category}</span><span className="badge">Sem {normalizeSemester(resource.semester)}</span>{resource.branch && <span className="badge">{resource.branch}</span>}</div></div>
              <h3>{resource.title}</h3><p className="subject">{resource.subject || "General resource"}</p>
              <div className="resource-actions">
                {resource.file_url ? <><a className="resource-action primary" href={resource.file_url} target="_blank" rel="noreferrer"><ArrowUpRight size={13} /> View</a><a className="resource-action" href={resource.file_url} target="_blank" rel="noreferrer" download><ArrowDownToLine size={13} /> Download</a></> : <span className="subject">File link unavailable</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}