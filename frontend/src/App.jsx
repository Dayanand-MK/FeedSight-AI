import { useEffect, useState } from "react";
import { translate, languages } from "./locales/index.js";
import { db, readHistory } from "./db/index.js";
import { cloud, synchronize } from "./services/sync.js";
import Test from "./pages/Test.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import StorageMonitor from "./pages/StorageMonitor.jsx";
import About from "./pages/About.jsx";
export default function App() {
  const [lang, setLang] = useState("en"),
    [page, setPage] = useState("home"),
    [profile, setProfile] = useState(""),
    [ready, setReady] = useState(false);
  const [welcomed, setWelcomed] = useState(false),
    [languageOpen, setLanguageOpen] = useState(false),
    [testStart, setTestStart] = useState(null),
    [testKey, setTestKey] = useState(0);
  const [data, setData] = useState({ batches: [], tests: [] }),
    [online, setOnline] = useState(navigator.onLine),
    [message, setMessage] = useState(""),
    [user, setUser] = useState(null),
    [autoSync, setAutoSync] = useState(false),
    [syncBusy, setSyncBusy] = useState(false),
    [install, setInstall] = useState(null);
  const t = (key) => translate(lang, key);
  const [offlineReady, setOfflineReady] = useState(false);
  useEffect(() => {
    let alive = true;
    navigator.serviceWorker?.ready
      .then(() => {
        if (alive) setOfflineReady(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  async function refresh() {
    try {
      setData(await readHistory());
    } catch {
      setMessage("saveError");
    }
  }
  useEffect(() => {
    refresh();
    db.profile
      .get("local")
      .then((p) => {
        if (p) {
          setLang(languages[p.lang] ? p.lang : "en");
          setProfile(p.name || "");
          setAutoSync(!!p.autoSync);
          setWelcomed(!!p.welcomed);
        }
        setReady(true);
      })
      .catch(() => {
        setMessage("saveError");
        setReady(true);
      });
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (ready)
      db.profile
        .put({ id: "local", lang, name: profile, autoSync, welcomed })
        .catch(() => setMessage("saveError"));
  }, [lang, profile, autoSync, ready, welcomed]);
  useEffect(() => {
    const on = () => setOnline(true),
      off = () => setOnline(false),
      prompt = (e) => {
        e.preventDefault();
        setInstall(e);
      };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    if (!cloud) return;
    cloud.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user || null))
      .catch(() => setMessage("syncError"));
    const { data } = cloud.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user || null),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  async function syncNow() {
    if (syncBusy) return;
    setSyncBusy(true);
    try {
      const r = await synchronize();
      setMessage(r.failed ? r.errorKey || "syncError" : "syncDone");
    } catch (e) {
      setMessage(
        [
          "notConfigured",
          "signInRequired",
          "cloudTableMissing",
          "cloudPermissionDenied",
          "cloudRateLimited",
          "cloudUnreachable",
        ].includes(e.message)
          ? e.message
          : "syncError",
      );
    } finally {
      await refresh();
      setSyncBusy(false);
    }
  }
  useEffect(() => {
    if (ready && online && autoSync && user) syncNow();
  }, [ready, online, autoSync, user?.id]);
  const eligiblePending = data.tests.filter(
    (r) => r.syncStatus === "pending" && (!r.ownerId || r.ownerId === user?.id),
  ).length;
  useEffect(() => {
    // A new online save must sync too. Failed records wait for manual retry or reconnect.
    if (ready && online && autoSync && user && !syncBusy && eligiblePending > 0)
      syncNow();
  }, [ready, online, autoSync, user?.id, syncBusy, eligiblePending]);
  const pending = data.tests.filter((r) => r.syncStatus !== "synced").length;
  const scored = data.tests.filter((r) => Number.isFinite(r.result.score));
  function beginTest(batchId = null) {
    setTestStart(batchId === null ? null : { batchId });
    setTestKey((k) => k + 1);
    setPage("newTest");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("home");
          }}
        >
          <img src="/icon.svg" width="40" height="40" alt="" />
          <span>
            FeedSight <b>AI</b>
          </span>
        </a>
        <p className="brand-note">{t("goalTagline")}</p>
        <nav>
          {[
            "home",
            "newTest",
            "history",
            "storageMonitor",
            "settings",
            "about",
          ].map((key, i) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              aria-current={page === key ? "page" : undefined}
              onClick={() => {
                setPage(key);
                if (key === "newTest") beginTest();
                setMessage("");
              }}
            >
              <span aria-hidden="true">
                {["◫", "＋", "▤", "⌂", "⚙", "ⓘ"][i]}
              </span>
              {t(key)}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="status-dot" />
          {t("screening")}
        </div>
      </aside>
      <div className="workspace">
        <header>
          <div
            className={`connection ${online ? "" : "disconnected"}`}
            role="status"
          >
            <span className="status-dot" />
            {t(online ? "online" : "offline")}
            {offlineReady && <small> · ✓ {t("offlineReady")}</small>}
            {pending > 0 && (
              <small>
                {" "}
                · {pending} {t("pending")}
              </small>
            )}
          </div>
          <select
            className="language"
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {Object.entries(languages).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </header>
        <main>
          {ready && (!welcomed || languageOpen) && (
            <section
              className="language-welcome card"
              aria-label={t("selectLanguage")}
            >
              <h2>{t("selectLanguage")}</h2>
              <div className="button-row">
                {Object.entries(languages).map(([key, label]) => (
                  <button
                    key={key}
                    className={lang === key ? "primary" : "quiet"}
                    onClick={() => setLang(key)}
                    aria-pressed={lang === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="primary"
                onClick={() => {
                  setWelcomed(true);
                  setLanguageOpen(false);
                }}
              >
                {t("continue")} →
              </button>
            </section>
          )}
          {message && (
            <p role="status" className="notice">
              {t(message)}
            </p>
          )}
          {page === "home" && (
            <>
              <section className="hero">
                <div>
                  <p className="eyebrow">FeedSight AI · SIH 2026</p>
                  <h1>{t("intro")}</h1>
                  <p>{t("introText")}</p>
                  <button className="primary" onClick={() => beginTest()}>
                    {t("testMyFeed")} →
                  </button>
                  {install && (
                    <button
                      className="quiet"
                      onClick={async () => {
                        await install.prompt();
                        setInstall(null);
                      }}
                    >
                      {t("install")}
                    </button>
                  )}
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="grain g1" />
                  <div className="grain g2" />
                  <div className="grain g3" />
                  <div className="grain g4" />
                  <div className="stem" />
                  <span>OBSERVE · ASSESS · TRACK</span>
                </div>
              </section>
              <div className="home-actions">
                {[
                  ["history", "history"],
                  ["storageMonitor", "storageMonitor"],
                  ["changeLanguage", "language"],
                  ["howToTest", "help"],
                ].map(([label, target]) => (
                  <button
                    className="card"
                    key={target}
                    onClick={() => {
                      if (target === "language") setLanguageOpen(true);
                      else if (target === "help")
                        document.getElementById("how-to-test").open = true;
                      else setPage(target);
                    }}
                  >
                    {t(label)} →
                  </button>
                ))}
              </div>
              <div className="four-promises">
                {[
                  ["nutritionQuality", "nutritionQuestion"],
                  ["feedSafety", "safetyQuestion"],
                  ["whatToDo", "whatToDo"],
                  ["storageMonitor", "storageQuestion"],
                ].map(([heading, body]) => (
                  <div key={heading}>
                    <strong>{t(heading)}</strong>
                    <small>{t(body)}</small>
                  </div>
                ))}
              </div>
              <details id="how-to-test">
                <summary>{t("howWorks")}</summary>
                <p>{t("helpSteps")}</p>
                <p>{t("portable")}</p>
              </details>
              <div className="stats">
                {[
                  ["total", data.tests.length],
                  ["batches", data.batches.length],
                  [
                    "alerts",
                    data.tests.filter((v) => v.result.risk === "high").length,
                  ],
                  [
                    "avg",
                    scored.length
                      ? Math.round(
                          scored.reduce((s, v) => s + v.result.score, 0) /
                            scored.length,
                        )
                      : "—",
                  ],
                ].map(([key, value]) => (
                  <div className="card stat" key={key}>
                    <span>{t(key)}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <section className="card overview">
                <h2>{t("history")}</h2>
                {data.batches.length ? (
                  <div className="recent-list">
                    {data.batches.slice(0, 4).map((b) => {
                      const last = data.tests
                        .filter((v) => v.batchId === b.id)
                        .at(-1);
                      return (
                        <button key={b.id} onClick={() => setPage("history")}>
                          <div>
                            <strong>{b.name}</strong>
                            <small>{t(b.feedType)}</small>
                          </div>
                          <span className={`badge ${last?.result.risk}`}>
                            {last?.result.score ?? "—"} /100 ·{" "}
                            {t(last?.result.risk)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p>{t("empty")}</p>
                )}
              </section>
              <p className="muted">{t("localOnly")}</p>
            </>
          )}
          {page === "newTest" && (
            <Test
              key={testKey}
              t={t}
              lang={lang}
              initialBatchId={testStart?.batchId || ""}
              startInStorage={testStart !== null}
              initialContext={
                data.tests
                  .filter((r) => r.batchId === testStart?.batchId)
                  .at(-1)?.input || {}
              }
              batches={data.batches}
              ownerId={user?.id || null}
              onSaved={refresh}
            />
          )}
          {page === "history" && <History t={t} lang={lang} {...data} />}
          {page === "storageMonitor" && (
            <StorageMonitor t={t} {...data} onRecord={beginTest} />
          )}
          {page === "about" && <About t={t} />}
          {page === "settings" && (
            <Settings
              t={t}
              profile={profile}
              setProfile={setProfile}
              user={user}
              syncNow={syncNow}
              autoSync={autoSync}
              setAutoSync={setAutoSync}
              syncBusy={syncBusy}
              online={online}
            />
          )}
        </main>
        <footer>FeedSight AI · {t("disclaimer")}</footer>
      </div>
    </div>
  );
}
