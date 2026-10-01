"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Your session has expired. Please sign in again.");
      setSubmitting(false);
      return;
    }
    const { error: insertError } = await supabase.from("feedback").insert({ user_id: user.id, message: message.trim() });
    if (insertError) setError(insertError.message);
    else { setMessage(""); setSuccess(true); }
    setSubmitting(false);
  }

  return (
    <>
      <p className="page-kicker">MAKE IT BETTER</p>
      <h1 className="page-title">Your feedback matters.</h1>
      <p className="page-description">Tell us what is working, what is missing, or what would make studying here easier.</p>
      <form className="feedback-form" onSubmit={submitFeedback}>
        <label className="field-label" htmlFor="feedback-message">Your message</label>
        <textarea id="feedback-message" className="field-control" required minLength={8} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share a suggestion or report a problem…" />
        <div className="result-count">{message.length}/2000</div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="success-note" role="status">Thanks, your feedback has been sent.</p>}
        <button className="primary-button feedback-submit" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={16} /> : <><Send size={15} /> Send feedback</>}</button>
      </form>
    </>
  );
}