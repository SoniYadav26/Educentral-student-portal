"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MessageSquareText, RefreshCw, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FeedbackRecord = {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  rating: number;
  message: string;
  created_at: string;
};

export default function FeedbackList() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    const resultWithIdentity = await supabase
      .from("feedback")
      .select("id,user_id,user_name,user_email,rating,message,created_at")
      .order("created_at", { ascending: false });

    let records: FeedbackRecord[] | null;
    let fetchError: { message: string; code?: string } | null;
    if (resultWithIdentity.error && ["42703", "PGRST204"].includes(resultWithIdentity.error.code)) {
      const resultWithoutIdentity = await supabase
        .from("feedback")
        .select("id,user_id,rating,message,created_at")
        .order("created_at", { ascending: false });
      records = resultWithoutIdentity.data as FeedbackRecord[] | null;
      fetchError = resultWithoutIdentity.error;
    } else {
      records = resultWithIdentity.data as FeedbackRecord[] | null;
      fetchError = resultWithIdentity.error;
    }

    if (fetchError) {
      console.error("Feedback List Error:", fetchError);
      setError(fetchError.message);
    } else {
      setFeedbacks(records ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function initialize() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (!user || String(user.app_metadata.role ?? "").toLowerCase() !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAuthorized(true);
      await loadFeedback();
      if (!active) return;

      channel = supabase
        .channel("dashboard-feedback-list")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedback" }, () => {
          void loadFeedback();
        })
        .subscribe((status, subscriptionError) => {
          if (status === "CHANNEL_ERROR") {
            console.error("Feedback Realtime Error:", subscriptionError ?? status);
          }
        });
    }

    void initialize();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadFeedback, router]);

  if (!authorized && loading) {
    return <div className="loading-state feedback-admin-state"><LoaderCircle className="spin" size={20} /> Checking access…</div>;
  }

  return (
    <>
      <div className="feedback-list-toolbar">
        <p className="page-description">Review suggestions and ratings shared by students.</p>
        <button className="feedback-refresh" type="button" onClick={() => void loadFeedback()} disabled={loading} aria-label="Refresh feedback">
          <RefreshCw className={loading ? "spin" : undefined} size={15} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="inline-error" role="alert">{error}</p>}
      {loading ? (
        <div className="loading-state feedback-admin-state"><LoaderCircle className="spin" size={20} /> Loading feedback…</div>
      ) : error ? null : feedbacks.length === 0 ? (
        <div className="empty-state feedback-admin-state">
          <MessageSquareText size={22} />
          <h2>No feedback yet</h2>
          <p>Student submissions will appear here.</p>
        </div>
      ) : (
        <section className="feedback-list" aria-label="Student feedback">
          {feedbacks.map((feedback) => (
            <article className="feedback-card" key={feedback.id}>
              <header className="feedback-card-header">
                <div className="feedback-student">
                  <strong>{feedback.user_name || "Student"}</strong>
                  {feedback.user_email && <span>{feedback.user_email}</span>}
                  <span className="feedback-user-id">User ID: {feedback.user_id}</span>
                </div>
                <time dateTime={feedback.created_at}>
                  {new Date(feedback.created_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </header>
              <div className="feedback-rating" aria-label={`${feedback.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star key={value} size={16} fill={value <= feedback.rating ? "currentColor" : "none"} aria-hidden="true" />
                ))}
                <span>{feedback.rating}/5</span>
              </div>
              <p className="feedback-message">{feedback.message}</p>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
