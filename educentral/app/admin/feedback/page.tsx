import FeedbackList from "@/app/dashboard/FeedbackList";

export default function AdminFeedbackPage() {
  return (
    <>
      <p className="page-kicker">STUDENT VOICE</p>
      <h1 className="page-title">Feedbacks</h1>
      <FeedbackList />
    </>
  );
}
