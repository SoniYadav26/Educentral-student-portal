"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, LoaderCircle, LogOut, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabase";

type Notice = { type: "success" | "error"; message: string };
type Dialog = "password" | "delete" | null;

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [deletionRequestedAt, setDeletionRequestedAt] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("Unable to load account settings:", error);
        setNotice({ type: "error", message: "Unable to load your account settings. Please refresh and try again." });
      } else {
        const requestedAt = data.user?.user_metadata.account_deletion_requested_at;
        if (typeof requestedAt === "string") setDeletionRequestedAt(requestedAt);
      }
      setAccountLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error("Unable to load account settings:", error);
      setNotice({ type: "error", message: "Unable to load your account settings. Please refresh and try again." });
      setAccountLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function changeTheme(nextTheme: "dark" | "light") {
    setNotice(null);
    try {
      setTheme(nextTheme);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to save your theme preference.",
      });
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    if (password.length < 6) {
      setNotice({ type: "error", message: "Your password must be at least 6 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setNotice({ type: "error", message: "The passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDialog(null);
      setPassword("");
      setConfirmPassword("");
      setNotice({ type: "success", message: "Your password was updated successfully." });
    } catch (error) {
      console.error("Password update failed:", error);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to update your password. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function requestAccountDeletion() {
    setNotice(null);
    setBusy(true);
    try {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!data.user) throw new Error("Your session has expired. Please sign in again.");

      const requestedAt = new Date().toISOString();
      const { error } = await supabase.auth.updateUser({
        data: { account_deletion_requested_at: requestedAt },
      });
      if (error) throw error;
      setDeletionRequestedAt(requestedAt);
      setDialog(null);
      setNotice({ type: "success", message: "Your account deletion request has been recorded." });
    } catch (error) {
      console.error("Account deletion request failed:", error);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to submit your account deletion request.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function logOut() {
    setNotice(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to log out. Please try again.",
      });
      setBusy(false);
    }
  }

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <header className="settings-header">
        <h1 id="settings-title">Settings</h1>
        <span className="settings-title-rule" aria-hidden="true" />
      </header>

      {notice && (
        <p className={`settings-notice ${notice.type}`} role={notice.type === "error" ? "alert" : "status"}>
          {notice.type === "success" ? <Check size={16} /> : <X size={16} />}
          {notice.message}
        </p>
      )}

      <section className="settings-card" aria-labelledby="theme-heading">
        <h2 id="theme-heading">Theme</h2>
        <div className="settings-row">
          <div>
            <span className="settings-row-title">Light Theme</span>
            <p className="settings-row-help">Use a lighter appearance across your study space.</p>
          </div>
          <button
            className={`theme-switch ${theme === "light" ? "on" : ""}`}
            type="button"
            role="switch"
            aria-checked={theme === "light"}
            aria-label="Light Theme"
            onClick={() => changeTheme(theme === "light" ? "dark" : "light")}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="settings-card settings-account-card" aria-labelledby="account-heading">
        <h2 id="account-heading">Manage Account</h2>
        {deletionRequestedAt && (
          <p className="deletion-status" role="status">
            Deletion requested {new Date(deletionRequestedAt).toLocaleDateString()}. Contact support if this was a mistake.
          </p>
        )}
        <button className="settings-action password-action" type="button" onClick={() => { setNotice(null); setDialog("password"); }}>
          <span>Change Password</span><Pencil size={16} aria-hidden="true" />
        </button>
        <button
          className="settings-action destructive-action"
          type="button"
          disabled={accountLoading || Boolean(deletionRequestedAt) || busy}
          onClick={() => { setNotice(null); setDialog("delete"); }}
        >
          <span>{deletionRequestedAt ? "Account Deletion Requested" : "Delete My Account"}</span>
          {accountLoading ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} aria-hidden="true" />}
        </button>
        <button className="settings-action destructive-action logout-action" type="button" disabled={busy} onClick={logOut}>
          <span>Log Out</span>{busy ? <LoaderCircle className="spin" size={16} /> : <LogOut size={16} aria-hidden="true" />}
        </button>
      </section>

      {dialog && (
        <div className="settings-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDialog(null); }}>
          <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title">
            <button className="settings-dialog-close" type="button" aria-label="Close dialog" disabled={busy} onClick={() => setDialog(null)}>
              <X size={18} />
            </button>
            {dialog === "password" ? (
              <>
                <h2 id="settings-dialog-title">Change Password</h2>
                <p>Choose a new password for your EduCentral account.</p>
                <form className="settings-password-form" onSubmit={changePassword}>
                  <label htmlFor="new-password">New password</label>
                  <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  <div className="settings-dialog-actions">
                    <button className="settings-button secondary" type="button" disabled={busy} onClick={() => setDialog(null)}>Cancel</button>
                    <button className="settings-button primary" type="submit" disabled={busy}>
                      {busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}Update Password
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 id="settings-dialog-title">Request account deletion?</h2>
                <p>This records a deletion request on your account for support to process. Your account is not deleted immediately.</p>
                <div className="settings-dialog-actions">
                  <button className="settings-button secondary" type="button" disabled={busy} onClick={() => setDialog(null)}>Keep Account</button>
                  <button className="settings-button danger" type="button" disabled={busy} onClick={requestAccountDeletion}>
                    {busy ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}Confirm Request
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
