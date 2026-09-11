import GoalPicker from "../components/GoalPicker.jsx";
import { withGoal } from "../services/goals.js";
import { useEffect, useRef, useState } from "react";
import { limits } from "../services/assessment.js";
import { buildReport } from "../services/report.js";
import { prepareImage } from "../services/image.js";
import { saveTest } from "../db/index.js";
import Result from "../components/Result.jsx";
import StorageInputs from "../components/StorageInputs.jsx";
import NutritionInputs from "../components/NutritionInputs.jsx";
import LabInputs from "../components/LabInputs.jsx";
export default function Test({
  t,
  lang,
  batches,
  onSaved,
  ownerId,
  initialBatchId = "",
  startInStorage = false,
  initialContext = {},
}) {
  const initialBatch = batches.find((b) => b.id === initialBatchId);
  const [input, setInput] = useState({
    feedType: initialBatch?.feedType || "maize_silage",
    batchName: "",
    source: "manual",
    ...Object.fromEntries(Object.keys(limits).map((k) => [k, ""])),
    mould: null,
    smell: null,
    foreignMaterial: null,
    observationSource: "manual",
    image: null,
    animalType: initialContext.animalType || "unspecified",
    animalContext: initialContext.animalContext || {},
    goal: initialContext.goal || "general",
  });
  const [step, setStep] = useState(startInStorage ? 5 : 1),
    [batchId, setBatchId] = useState(initialBatchId),
    [result, setResult] = useState(null),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [fqi, setFqi] = useState(null);
  const photoVersion = useRef(0),
    form = useRef(null),
    heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step, !!result]);
  useEffect(
    () => () => {
      photoVersion.current++;
    },
    [],
  );
  const change = (patch) => {
    setInput((v) => ({ ...v, ...patch }));
    setResult(null);
    setSaved(false);
    setError("");
  };
  async function photo(file) {
    const version = ++photoVersion.current;
    change({ image: null });
    if (!file) return;
    setBusy(true);
    try {
      const image = await prepareImage(file);
      if (version === photoVersion.current) change({ image });
    } catch {
      if (version === photoVersion.current) setError("invalidImage");
    } finally {
      if (version === photoVersion.current) setBusy(false);
    }
  }
  function next() {
    if (!form.current.reportValidity()) return;
    if (
      step === 3 &&
      input.targets?.enabled &&
      !input.targets.reference?.trim()
    ) {
      setError("targetReferenceNeeded");
      return;
    }
    setStep((s) => s + 1);
    setError("");
  }
  async function analyze(e) {
    e.preventDefault();
    if (step < 5) {
      next();
      return;
    }
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await Promise.resolve();
      setResult(
        buildReport(input, {
          fqi: input.feedType === "maize_silage" ? fqi : null,
          batchId: batchId || crypto.randomUUID(),
        }),
      );
      setSaved(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    try {
      await saveTest(input, result, result.batchId, ownerId);
      setSaved(true);
      await onSaved();
    } catch {
      setError("saveError");
    } finally {
      setBusy(false);
    }
  }
  const titles = [
    "selectFeed",
    "image",
    "simpleDetails",
    "chooseGoal",
    "storageMonitor",
  ];
  return (
    <div className="guided-test">
      <div className="page-heading">
        <h1 ref={heading} tabIndex="-1">
          {t(result ? "result" : "testMyFeed")}
        </h1>
      </div>
      {error && (
        <p className="error" role="alert">
          {t(error)}
        </p>
      )}
      {result ? (
        <>
          <Result
            result={result}
            t={t}
            lang={lang}
            onGoalChange={
              saved
                ? undefined
                : (goal) => {
                    setInput((v) => ({ ...v, goal }));
                    setResult((v) => withGoal(v, goal));
                  }
            }
            onSave={save}
            saved={saved}
            busy={busy}
          />
          <button className="quiet" onClick={() => setResult(null)}>
            {t("back")}
          </button>
        </>
      ) : (
        <form ref={form} onSubmit={analyze} className="card wizard">
          <div
            className="step-progress"
            aria-label={`${t("step")} ${step} ${t("ofFive")}`}
          >
            <strong>
              {t("step")} {step} {t("ofFive")}
            </strong>
            <progress max="5" value={step} />
          </div>
          <h2>{t(titles[step - 1])}</h2>
          {step === 1 && (
            <>
              <label>
                {t("existingBatch")}
                <select
                  value={batchId}
                  onChange={(e) => {
                    setBatchId(e.target.value);
                    const b = batches.find((b) => b.id === e.target.value);
                    change(b ? { feedType: b.feedType } : {});
                  }}
                >
                  <option value="">{t("newBatch")}</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="feed-options">
                {["maize_silage", "dry_feed"].map((k, i) => (
                  <button
                    type="button"
                    disabled={!!batchId}
                    aria-pressed={input.feedType === k}
                    className={input.feedType === k ? "selected" : ""}
                    key={k}
                    onClick={() => change({ feedType: k })}
                  >
                    <span aria-hidden="true">{i ? "🌾" : "🌿"}</span>
                    {t(k)}
                  </button>
                ))}
              </div>
              {!batchId && (
                <label>
                  {t("batchName")}
                  <input
                    maxLength="80"
                    value={input.batchName}
                    onChange={(e) => change({ batchName: e.target.value })}
                  />
                </label>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <p className="notice">{t("photoGuide")}</p>
              <label className="upload">
                {t("image")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    e.target.value = "";
                    photo(file);
                  }}
                />
              </label>
              <p>{t("photoLimit")}</p>
              {input.image && (
                <>
                  <img
                    className="feed-preview"
                    src={input.image.dataUrl}
                    alt={t("image")}
                  />
                  {input.image.warning && (
                    <p role="status">{t(input.image.warning)}</p>
                  )}
                  <button
                    type="button"
                    className="quiet"
                    onClick={() => change({ image: null })}
                  >
                    {t("remove")}
                  </button>
                </>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <p>{t("optionalHint")}</p>
              {["mould", "smell", "foreignMaterial"].map((k) => (
                <label key={k}>
                  {t(k)}
                  <select
                    value={input[k] == null ? "unknown" : String(input[k])}
                    onChange={(e) =>
                      change({
                        [k]:
                          e.target.value === "unknown"
                            ? null
                            : e.target.value === "true",
                        observationSource: "manual",
                      })
                    }
                  >
                    <option value="unknown">{t("dontKnow")}</option>
                    <option value="true">{t("yes")}</option>
                    <option value="false">{t("no")}</option>
                  </select>
                </label>
              ))}
              <NutritionInputs input={input} change={change} t={t} />
            </>
          )}
          {step === 4 && (
            <>
              <p>{t("goalLimit")}</p>
              <GoalPicker
                value={input.goal}
                onChange={(goal) => change({ goal })}
                t={t}
              />
            </>
          )}
          {step === 5 && (
            <>
              <StorageInputs input={input} change={change} t={t} />
              <details>
                <summary>{t("nirReference")}</summary>
                <p>{t("nirReferenceHelp")}</p>
                <label>
                  {t("nirReference")}
                  <input
                    maxLength="160"
                    value={input.nirReference || ""}
                    onChange={(e) => change({ nirReference: e.target.value })}
                  />
                </label>
              </details>
              {input.feedType === "maize_silage" && (
                <LabInputs t={t} onEstimate={setFqi} initialValue={fqi} />
              )}
            </>
          )}
          <div className="wizard-actions">
            {step > 1 && (
              <button
                type="button"
                className="quiet"
                disabled={busy}
                onClick={() => setStep((s) => s - 1)}
              >
                {t("back")}
              </button>
            )}
            <button className="primary" disabled={busy} type="submit">
              {busy ? t("checking") : t(step < 5 ? "next" : "checkFeed")} →
            </button>
          </div>
          <details>
            <summary>{t("howToTest")}</summary>
            <p>{t("helpSteps")}</p>
          </details>
        </form>
      )}
    </div>
  );
}
