import { useState } from "react";
import { db } from "../db/index.js";
import { cloud, checkCloudConnection } from "../services/sync.js";
import { cloudErrorKey } from "../services/cloudErrors.js";
export default function Settings({
  t,
  profile,
  setProfile,
  user,
  syncNow,
  autoSync,
  setAutoSync,
  syncBusy,
  online,
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { error } = await cloud.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setPassword("");
    } catch (error) {
      setMessage(cloudErrorKey(error));
    } finally {
      setBusy(false);
    }
  }
  async function exportData() {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        batches: await db.batches.toArray(),
        tests: await db.tests.toArray(),
      };
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `feedsight-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage("saveError");
    }
  }
  return (
    <>
      <div className="page-heading">
        <h1>{t("settings")}</h1>
      </div>
      <div className="two-cols">
        <section className="card">
          <h2>{t("profile")}</h2>
          <input
            aria-label={t("profile")}
            maxLength="80"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
          />
          <p>{t("localOnly")}</p>
          <button className="quiet" onClick={exportData}>
            {t("export")}
          </button>
          <h3>{t("install")}</h3>
          <p>{t("installHelp")}</p>
        </section>
        <section className="card">
          <h2>{t("cloud")}</h2>
          <p>{t("cloudNote")}</p>
          {cloud && <p className="notice">{t(user ? "cloudSignedIn" : "cloudConfigured")}</p>}
          {!cloud ? (
            <p className="notice">{t("notConfigured")}</p>
          ) : user ? (
            <>
              <p>{user.email}</p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
                {t("autoSync")}
              </label>
              <button className="primary" onClick={syncNow} disabled={syncBusy || busy || !online}>
                {t(syncBusy ? "syncing" : "sync")}
              </button>
              <button className="quiet" disabled={busy || syncBusy || !online} onClick={async () => {
                setBusy(true);
                setMessage("");
                try { setMessage(await checkCloudConnection()); }
                catch (error) { setMessage(error.message); }
                finally { setBusy(false); }
              }}>{t("checkCloud")}</button>
              <button
                className="quiet"
                disabled={busy || syncBusy}
                onClick={async () => {
                  setAutoSync(false);
                  try {
                    const { error } = await cloud.auth.signOut({
                      scope: "local",
                    });
                    if (error) throw error;
                  } catch {
                    setMessage("syncError");
                  }
                }}
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <form onSubmit={login}>
              <label>
                {t("email")}
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                {t("password")}
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <p>{t("existingAccountHelp")}</p>
              <button className="primary" disabled={busy || !online}>
                {t("signIn")}
              </button>
            </form>
          )}
          {message && <p role="alert">{t(message)}</p>}
        </section>
      </div>
    </>
  );
}
