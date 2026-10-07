"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send, Star, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      if (rating === 0) {
        setError("Choose a star rating before submitting.");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const { error: insertError } = await supabase.from("feedback").insert({
        user_id: user.id,
        rating,
        message: message.trim(),
      });
      if (insertError) throw insertError;
      setRating(0);
      setMessage("");
      setSuccess(true);
    } catch (error) {
      console.error("Feedback Submit Error:", error);
      const errorMessage = error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "Unable to submit feedback. Please try again.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  function clearForm() {
    setRating(0);
    setMessage("");
    setError("");
    setSuccess(false);
  }

  return (
    <>
      <p className="page-kicker">MAKE IT BETTER</p>
      <h1 className="page-title">Feedback</h1>
      <p className="page-description">Tell us what is working, what is missing, or what would make studying here easier.</p>
      <form className="feedback-form" onSubmit={submitFeedback}>
        <fieldset className="rating-field">
          <legend className="field-label">Click On The Stars To Give Ratings</legend>
          <div className="rating-selector" role="group" aria-label="Rate your experience from 1 to 5 stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={value <= rating ? "rating-star selected" : "rating-star"}
                aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                aria-pressed={rating === value}
                onClick={() => { setRating(value); setSuccess(false); }}
              >
                <Star size={27} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field-label" htmlFor="feedback-message">Your message</label>
        <textarea id="feedback-message" className="field-control" required minLength={8} maxLength={2000} value={message} onChange={(event) => { setMessage(event.target.value); setSuccess(false); }} placeholder="Start typing your feedback..." />
        <div className="result-count">{message.length}/2000</div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="success-note" role="status">Thanks, your feedback has been sent.</p>}
        <div className="feedback-actions">
          <button className="primary-button feedback-submit" type="submit" disabled={submitting}>{submitting ? <LoaderCircle className="spin" size={16} /> : <><Send size={15} /> Submit Feedback</>}</button>
          <button className="feedback-cancel" type="button" onClick={clearForm} disabled={submitting}><X size={15} /> Cancel</button>
        </div>
      </form>
    </>
  );
}