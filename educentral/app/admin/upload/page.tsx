"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, LoaderCircle, UploadCloud } from "lucide-react";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const branches = ["CSE", "IT", "ECE", "ME"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function AdminUploadPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PYQ");
  const [semester, setSemester] = useState("1");
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (!data.user || authError || String(data.user.app_metadata.role ?? "").toLowerCase() !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setAuthorized(true);
      setCheckingRole(false);
    });
    return () => { active = false; };
  }, [router]);

  function acceptFile(candidate?: File) {
    setError("");
    setSuccess("");
    if (!candidate) return;
    if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file to upload.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError("This file is larger than 20 MB. Choose a smaller PDF.");
      return;
    }
    setFile(candidate);
    if (!title.trim()) setTitle(candidate.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " "));
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!file) { setError("Select a PDF before uploading."); return; }
    if (!title.trim() || !subject.trim()) { setError("Add a title and subject for this resource."); return; }
    setUploading(true);
    let storagePath: string | null = null;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const uploadedBy = !userError && user && UUID_PATTERN.test(user.id) ? user.id : null;

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      storagePath = `${branch.toLowerCase()}/sem-${semester}/${crypto.randomUUID()}-${safeName}`;
      const { error: storageError } = await supabase.storage.from("study-materials").upload(storagePath, file, { contentType: "application/pdf", upsert: false });
      if (storageError) {
        setError(`Upload failed: ${storageError.message}`);
        return;
      }

      const { data: fileData } = supabase.storage.from("study-materials").getPublicUrl(storagePath);
      const resourceRecord = {
        title: title.trim(),
        category,
        semester: `Sem ${semester}`,
        subject: subject.trim(),
        branch,
        file_url: fileData.publicUrl,
        uploaded_by: uploadedBy,
      };
      const { error: initialInsertError } = await supabase.from("resources").insert(resourceRecord);
      let metadataError = initialInsertError;

      if (
        metadataError?.code === "23503" &&
        metadataError.message.toLowerCase().includes("uploaded_by") &&
        uploadedBy
      ) {
        const { error: retryError } = await supabase
          .from("resources")
          .insert({ ...resourceRecord, uploaded_by: null });
        metadataError = retryError;
      }

      if (metadataError) {
        const { error: cleanupError } = await supabase.storage.from("study-materials").remove([storagePath]);
        setError(cleanupError
          ? `The resource record could not be saved: ${metadataError.message}. The uploaded file may need to be removed manually.`
          : `The resource record could not be saved: ${metadataError.message}`);
        return;
      }

      setSuccess(`"${title.trim()}" was uploaded successfully and added to the resource library.`);
      setFile(null);
      setTitle("");
      setSubject("");
    } catch (uploadError) {
      if (storagePath) {
        await supabase.storage.from("study-materials").remove([storagePath]).catch(() => undefined);
      }
      setError(uploadError instanceof Error
        ? `Upload could not be completed: ${uploadError.message}`
        : "Upload could not be completed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (checkingRole || !authorized) return <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>Checking administrator access…</span></div>;

  return (
    <>
      <p className="page-kicker">ADMINISTRATION</p>
      <h1 className="page-title">Add a study resource</h1>
      <p className="page-description">Upload a course PDF and organize it so students can find it quickly.</p>
      <form className="upload-form" onSubmit={submitUpload}>
        <div className={dragging ? "drop-zone dragging" : "drop-zone"} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
          <UploadCloud size={24} />
          {file ? <><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(1)} MB · PDF</span></> : <><strong>Drop a PDF here</strong><span>Up to 20 MB</span><button type="button" onClick={() => fileInput.current?.click()}>Browse files</button></>}
          <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={handleFileInput} aria-label="Choose a PDF file" />
        </div>
        {file && <button className="resource-action" type="button" onClick={() => setFile(null)}><FileUp size={13} /> Choose a different file</button>}
        <div className="upload-fields">
          <div className="upload-field full"><label className="field-label" htmlFor="resource-title">Title</label><input id="resource-title" className="field-control" required maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Data Structures — End Semester 2025" /></div>
          <div className="upload-field"><label className="field-label" htmlFor="resource-category">Category</label><select id="resource-category" className="field-control" value={category} onChange={(event) => setCategory(event.target.value)}><option>PYQ</option><option>Syllabus</option><option>Notes</option></select></div>
          <div className="upload-field"><label className="field-label" htmlFor="resource-subject">Subject</label><input id="resource-subject" className="field-control" required maxLength={100} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Data Structures" /></div>
          <div className="upload-field"><label className="field-label" htmlFor="resource-semester">Semester</label><select id="resource-semester" className="field-control" value={semester} onChange={(event) => setSemester(event.target.value)}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Sem {index + 1}</option>)}</select></div>
          <div className="upload-field"><label className="field-label" htmlFor="resource-branch">Branch</label><select id="resource-branch" className="field-control" value={branch} onChange={(event) => setBranch(event.target.value)}>{branches.map((item) => <option key={item}>{item}</option>)}</select></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="success-note" role="status">{success}</p>}
        <button type="submit" className="primary-button upload-submit" disabled={uploading}>{uploading ? <LoaderCircle className="spin" size={16} /> : <><FileUp size={16} /> Upload resource</>}</button>
      </form>
    </>
  );
}