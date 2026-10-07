import FeedbackList from "@/app/dashboard/FeedbackList";

export default function DashboardFeedbacksPage() {
  return (
    <>
      <p className="page-kicker">STUDENT VOICE</p>
      <h1 className="page-title">Feedbacks</h1>
      <FeedbackList />
    </>
  );
}
