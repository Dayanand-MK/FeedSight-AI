import { useEffect, useRef, useState } from "react";
import {
  localVoice,
  spokenReport,
  voiceLanguages,
} from "../services/speech.js";
export default function SpeechReport({ report, t, lang }) {
  const [voices, setVoices] = useState([]),
    [state, setState] = useState("idle"),
    [error, setError] = useState("");
  const synth = globalThis.speechSynthesis;
  const generation = useRef(0),
    activeUtterance = useRef(null);
  const text = spokenReport(report, t);
  useEffect(() => {
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      generation.current++;
      activeUtterance.current = null;
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, [synth]);
  useEffect(() => {
    generation.current++;
    activeUtterance.current = null;
    synth?.cancel();
    setState("idle");
    setError("");
  }, [lang, report.timestamp, report.goal?.selected, synth]);
  function speak() {
    if (!synth || !globalThis.SpeechSynthesisUtterance) {
      setError("voiceUnsupported");
      return;
    }
    const voice = localVoice(synth.getVoices(), lang);
    if (!voice) {
      setError("voiceMissing");
      return;
    }
    const id = ++generation.current;
    synth.cancel();
    setError("");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voiceLanguages[lang];
    utterance.rate = 0.9;
    activeUtterance.current = utterance;
    utterance.onend = () => {
      if (id === generation.current) {
        activeUtterance.current = null;
        setState("idle");
      }
    };
    utterance.onerror = (e) => {
      if (id !== generation.current) return;
      activeUtterance.current = null;
      setState("idle");
      if (!["canceled", "interrupted"].includes(e.error))
        setError("voiceFailed");
    };
    setState("speaking");
    try {
      synth.speak(utterance);
    } catch {
      setState("idle");
      setError("voiceFailed");
    }
  }
  return (
    <div className="speech-controls">
      <button type="button" className="primary" onClick={speak}>
        🔊 {t(state === "idle" ? "listen" : "repeat")}
      </button>
      {state !== "idle" && (
        <>
          <button
            type="button"
            className="quiet"
            onClick={() => {
              if (state === "paused") {
                synth.resume();
                setState("speaking");
              } else {
                synth.pause();
                setState("paused");
              }
            }}
          >
            {t(state === "paused" ? "resume" : "pause")}
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => {
              synth.cancel();
              setState("idle");
            }}
          >
            {t("stop")}
          </button>
        </>
      )}
      {error && <p role="status">{t(error)}</p>}
      {!error && !localVoice(voices, lang) && (
        <p className="muted">{t("voiceMissing")}</p>
      )}
      <details>
        <summary>{t("spokenText")}</summary>
        <p>{text}</p>
      </details>
    </div>
  );
}
