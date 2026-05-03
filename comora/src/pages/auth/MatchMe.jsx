import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Check, PartyPopper, Loader2, Compass } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import {
  INTEREST_CATEGORIES,
  SOCIAL_COMFORT,
  DIETARY_OPTIONS,
  CITIES,
} from "../../lib/utils";

const BUDGET_OPTIONS = [
  { id: "free", label: "Free", sublabel: "Community events", emoji: "🎁" },
  { id: "low", label: "Low", sublabel: "₹100 – ₹300", emoji: "🪙" },
  { id: "moderate", label: "Moderate", sublabel: "₹300 – ₹600", emoji: "💰" },
  { id: "high", label: "High", sublabel: "₹600+", emoji: "✨" },
];

const GROUP_SIZE_OPTIONS = [
  { label: "2–4", sublabel: "Very intimate", min: 2, max: 4 },
  { label: "4–8", sublabel: "Small group", min: 4, max: 8 },
  { label: "8–12", sublabel: "Medium gathering", min: 8, max: 12 },
  { label: "12+", sublabel: "Big table energy", min: 12, max: 99 },
];

// 6 question slots — what data each collects
const Q_KEYS = [
  "interests",
  "socialComfort",
  "groupSize",
  "dietary",
  "budget",
  "city",
];

async function fetchNextQuestion(key, answers) {
  const context = buildContext(answers);

  const topicHint = {
    interests:
      "Ask what topics or areas intellectually excite them. Keep it warm and curious.",
    socialComfort:
      "Reference their interests. Ask how they show up socially in a room of strangers.",
    groupSize:
      "Ask what size gathering feels most comfortable for a meaningful conversation.",
    dietary: "Ask about dietary preferences in a light, non-clinical way.",
    budget: "Ask about their budget comfort for events, casually.",
    city: "Ask which city they are in — keep it brief, this is the last question.",
  }[key];

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            "You are Compass, a warm and witty onboarding assistant for Comora, a social gathering platform in India. Write ONE short conversational question (max 20 words). Be friendly, reference prior answers when relevant. No punctuation quirks. Just the question.",
        },
        {
          role: "user",
          content: `${context ? `Context: ${context}\n` : ""}Task: ${topicHint}`,
        },
      ],
      max_tokens: 60,
      temperature: 0.9,
    }),
  });
  const data = await res.json();
  return (
    data.choices?.[0]?.message?.content?.trim() || getFallbackQuestion(key)
  );
}

async function fetchAdaptiveOrder(answers, remainingKeys) {
  const interestLabels = INTEREST_CATEGORIES.filter((c) =>
    answers.interests.includes(c.id),
  )
    .map((c) => c.label)
    .join(", ");
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content: `A user joining a social gathering platform selected these interests: ${interestLabels}. Reorder these onboarding question topics for the most natural conversational flow: ${remainingKeys.join(", ")}. Return ONLY a JSON array of the keys. No explanation.`,
          },
        ],
        max_tokens: 60,
        temperature: 0.3,
      }),
    });
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content?.trim());
    if (
      Array.isArray(parsed) &&
      parsed.length === remainingKeys.length &&
      remainingKeys.every((k) => parsed.includes(k))
    )
      return parsed;
  } catch {}
  return remainingKeys;
}

function getFallbackQuestion(key) {
  return {
    interests: "What topics light you up intellectually?",
    socialComfort: "How do you usually show up in a room full of new people?",
    groupSize: "What's your ideal group size for a great conversation?",
    dietary: "Any dietary preferences we should know about?",
    budget: "What's your budget comfort for events?",
    city: "Which city are you in?",
  }[key];
}

function buildContext(answers) {
  const parts = [];
  if (answers.interests?.length) {
    const labels = INTEREST_CATEGORIES.filter((c) =>
      answers.interests.includes(c.id),
    ).map((c) => c.label);
    parts.push(`Interests: ${labels.join(", ")}`);
  }
  if (answers.socialComfort) {
    parts.push(
      `Social style: ${SOCIAL_COMFORT.find((s) => s.value === answers.socialComfort)?.label}`,
    );
  }
  if (answers.groupSize) {
    parts.push(
      `Group size: ${answers.groupSize.min}–${answers.groupSize.max === 99 ? "∞" : answers.groupSize.max}`,
    );
  }
  return parts.join(" | ");
}

async function runCompassAnalysis(answers) {
  const interestLabels = INTEREST_CATEGORIES.filter((c) =>
    answers.interests.includes(c.id),
  )
    .map((c) => c.label)
    .join(", ");
  const socialLabel =
    SOCIAL_COMFORT.find((s) => s.value === answers.socialComfort)?.label || "";
  const groupLabel = answers.groupSize
    ? `${answers.groupSize.min}–${answers.groupSize.max === 99 ? "∞" : answers.groupSize.max} people`
    : "";
  const budgetLabel =
    BUDGET_OPTIONS.find((b) => b.id === answers.budget)?.label || "";

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {
          role: "user",
          content: `You are Compass, a personality analysis engine for Comora — an agenda-first social gathering platform in India.

Analyze this user profile and return ONLY a valid JSON object with exactly:
- "type": creative 3-4 word personality archetype (e.g. "The Quiet Polymath")
- "tagline": one sentence max 15 words capturing their social essence
- "insight": two sentences about what Comora events they'll love and why

Profile:
Interests: ${interestLabels}
Social comfort: ${socialLabel}
Group size: ${groupLabel}
Dietary: ${answers.dietary?.length ? answers.dietary.join(", ") : "No restrictions"}
Budget: ${budgetLabel}
City: ${answers.city}

Return ONLY the JSON. No markdown, no explanation.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.85,
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return JSON.parse(text);
}

// ── Answer option renderers ───────────────────────────────────────────────────

function InterestChips({ value, onChange }) {
  const toggle = (id) =>
    onChange(
      value.includes(id) ? value.filter((x) => x !== id) : [...value, id],
    );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {INTEREST_CATEGORIES.map((cat) => {
        const sel = value.includes(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            style={{
              padding: "0.5rem 0.875rem",
              borderRadius: "999px",
              border: `2px solid ${sel ? "var(--comora-orange)" : "var(--border)"}`,
              background: sel ? "var(--accent-soft)" : "var(--bg-card)",
              color: sel ? "var(--comora-orange)" : "var(--text-secondary)",
              fontWeight: sel ? 600 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {cat.icon} {cat.label}
          </button>
        );
      })}
    </div>
  );
}

function SocialChips({ value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {SOCIAL_COMFORT.map((opt) => {
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              border: `2px solid ${sel ? "var(--comora-orange)" : "var(--border)"}`,
              background: sel ? "var(--accent-soft)" : "var(--bg-card)",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <p
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                color: sel ? "var(--comora-orange)" : "var(--text-primary)",
                marginBottom: "0.125rem",
              }}
            >
              {opt.label}
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {opt.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function GroupChips({ value, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: "0.5rem",
      }}
    >
      {GROUP_SIZE_OPTIONS.map((opt) => {
        const sel = value?.min === opt.min;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange({ min: opt.min, max: opt.max })}
            style={{
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              border: `2px solid ${sel ? "var(--comora-orange)" : "var(--border)"}`,
              background: sel ? "var(--accent-soft)" : "var(--bg-card)",
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.2rem",
                color: sel ? "var(--comora-orange)" : "var(--text-primary)",
              }}
            >
              {opt.label}
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {opt.sublabel}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function DietaryChips({ value, onChange }) {
  const toggle = (opt) =>
    onChange(
      value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt],
    );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {DIETARY_OPTIONS.map((opt) => {
        const sel = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: `2px solid ${sel ? "var(--comora-orange)" : "var(--border)"}`,
              background: sel ? "var(--accent-soft)" : "var(--bg-card)",
              color: sel ? "var(--comora-orange)" : "var(--text-secondary)",
              fontWeight: sel ? 600 : 500,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function BudgetChips({ value, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: "0.5rem",
      }}
    >
      {BUDGET_OPTIONS.map((opt) => {
        const sel = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              border: `2px solid ${sel ? "var(--comora-orange)" : "var(--border)"}`,
              background: sel ? "var(--accent-soft)" : "var(--bg-card)",
              cursor: "pointer",
              transition: "all 0.15s",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>{opt.emoji}</span>
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: sel ? "var(--comora-orange)" : "var(--text-primary)",
              }}
            >
              {opt.label}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {opt.sublabel}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function CitySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "0.75rem 1rem",
        borderRadius: "var(--radius-md)",
        border: "2px solid var(--border)",
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        fontSize: "0.9rem",
        outline: "none",
      }}
    >
      <option value="">Select your city</option>
      {CITIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function MatchMe() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [qIndex, setQIndex] = useState(0); // 0–5
  const [sequence, setSequence] = useState(["interests"]);
  const [questions, setQuestions] = useState([]); // generated question texts
  const [loadingQ, setLoadingQ] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [compassProfile, setCompassProfile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [answers, setAnswers] = useState({
    interests: [],
    socialComfort: null,
    groupSize: null,
    dietary: [],
    budget: null,
    city: "",
  });

  // Load first question on start
  useEffect(() => {
    if (!started) return;
    loadQuestion(0, "interests", answers);
  }, [started]);

  // Scroll to bottom on new question
  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
  }, [questions.length, loadingQ]);

  async function loadQuestion(index, key, currentAnswers) {
    setLoadingQ(true);
    const text = await fetchNextQuestion(key, currentAnswers);
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
    setLoadingQ(false);
  }

  function setAnswer(key, val) {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }

  function canAdvance() {
    const key = sequence[qIndex];
    if (key === "interests") return answers.interests.length >= 2;
    if (key === "socialComfort") return answers.socialComfort !== null;
    if (key === "groupSize") return answers.groupSize !== null;
    if (key === "dietary") return true;
    if (key === "budget") return answers.budget !== null;
    if (key === "city") return answers.city !== "";
    return false;
  }

  async function handleNext() {
    if (!canAdvance()) return;
    if (qIndex < Q_KEYS.length - 1) {
      const nextIndex = qIndex + 1;
      setLoadingQ(true);

      let nextSequence = sequence;
      if (qIndex === 0) {
        const remaining = Q_KEYS.filter((k) => k !== "interests");
        const adaptiveOrder = await fetchAdaptiveOrder(answers, remaining);
        nextSequence = ["interests", ...adaptiveOrder];
        setSequence(nextSequence);
      }

      setQIndex(nextIndex);
      await loadQuestion(nextIndex, nextSequence[nextIndex], answers);
    } else {
      await handleComplete();
    }
  }

  async function handleComplete() {
    if (!user) {
      toast.error("You need to be signed in.");
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await updateProfile({
        interests: answers.interests,
        social_comfort: answers.socialComfort,
        preferred_group_min: answers.groupSize?.min ?? null,
        preferred_group_max: answers.groupSize?.max ?? null,
        dietary_prefs: answers.dietary,
        budget_range: answers.budget,
        city: answers.city,
        match_me_completed: true,
      });
      if (error) throw error;
      setDone(true);
      setAnalyzing(true);
      try {
        const profile = await runCompassAnalysis(answers);
        if (profile?.type && profile?.tagline && profile?.insight) {
          setCompassProfile(profile);
          await updateProfile({ compass_profile: profile });
        }
      } catch {
        /* silent — done screen still shows */
      }
      setAnalyzing(false);
      setTimeout(() => {
        toast.success("You're all set! Welcome to Comora 🎉");
        navigate("/browse");
      }, 7000);
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--bg-base)",
          textAlign: "center",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "5rem",
            height: "5rem",
            borderRadius: "50%",
            background: "var(--accent-soft)",
            border: "2px solid var(--comora-orange)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <PartyPopper size={32} color="var(--comora-orange)" />
        </div>
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          You're all set!
        </h2>

        {analyzing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--text-muted)",
              fontSize: "0.875rem",
            }}
          >
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Compass is reading your profile…
          </div>
        )}

        {compassProfile && (
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "var(--radius-xl)",
              border: "2px solid var(--comora-orange)",
              background: "var(--accent-soft)",
              maxWidth: "28rem",
              width: "100%",
              textAlign: "left",
              animation: "celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <Compass size={16} style={{ color: "var(--comora-orange)" }} />
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "var(--comora-orange)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Your Compass Profile
              </span>
            </div>
            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "0.375rem",
                letterSpacing: "-0.02em",
              }}
            >
              {compassProfile.type}
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--comora-navy)",
                fontStyle: "italic",
                marginBottom: "0.75rem",
                fontWeight: 500,
              }}
            >
              "{compassProfile.tagline}"
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {compassProfile.insight}
            </p>
          </div>
        )}

        {compassProfile && (
          <button
            onClick={() => {
              toast.success("Welcome to Comora 🎉");
              navigate("/browse");
            }}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "999px",
              background: "var(--comora-navy)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            Explore Comora →
          </button>
        )}

        <style>{`
          @keyframes celebPop { from { transform:scale(0.4);opacity:0 } to { transform:scale(1);opacity:1 } }
          @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        `}</style>
      </div>
    );
  }

  // ── Welcome screen ───────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--bg-base)",
          textAlign: "center",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "50%",
            background: "var(--accent-soft)",
            border: "2px solid var(--comora-orange)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Compass size={28} color="var(--comora-orange)" />
        </div>
        <div>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Meet Compass
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              maxWidth: "22rem",
              lineHeight: 1.6,
            }}
          >
            I'll ask you a few quick questions to build your profile and find
            gatherings that actually fit you.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setStarted(true)}>
          Let's go →
        </Button>
      </div>
    );
  }

  // ── Chat screen ──────────────────────────────────────────────────────────────
  const currentKey = sequence[qIndex] ?? Q_KEYS[qIndex];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "var(--bg-card)",
        }}
      >
        <div
          style={{
            width: "2.25rem",
            height: "2.25rem",
            borderRadius: "50%",
            background: "var(--accent-soft)",
            border: "2px solid var(--comora-orange)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Compass size={16} color="var(--comora-orange)" />
        </div>
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--text-primary)",
            }}
          >
            Compass
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Question {qIndex + 1} of {Q_KEYS.length}
          </p>
        </div>
        {/* Progress */}
        <div
          style={{
            marginLeft: "auto",
            width: "6rem",
            height: "4px",
            borderRadius: "999px",
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((qIndex + 1) / Q_KEYS.length) * 100}%`,
              background: "var(--comora-orange)",
              borderRadius: "999px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Chat bubbles */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: "1rem",
          maxWidth: "42rem",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Render all previous questions + their answers */}
        {questions.map(
          (q, i) =>
            i < qIndex && (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "80%",
                    padding: "0.75rem 1rem",
                    borderRadius: "1rem 1rem 1rem 0.25rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  {q}
                </div>
                <div
                  style={{
                    alignSelf: "flex-end",
                    padding: "0.5rem 1rem",
                    borderRadius: "1rem 1rem 0.25rem 1rem",
                    background: "var(--comora-navy)",
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  {getAnswerSummary(sequence[i], answers)}
                </div>
              </div>
            ),
        )}

        {/* Current question */}
        {questions[qIndex] && (
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "80%",
              padding: "0.75rem 1rem",
              borderRadius: "1rem 1rem 1rem 0.25rem",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              fontSize: "0.9rem",
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}
          >
            {questions[qIndex]}
          </div>
        )}

        {loadingQ && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
            }}
          >
            <Loader2
              size={14}
              style={{ animation: "spin 1s linear infinite" }}
            />{" "}
            Compass is thinking…
          </div>
        )}

        {/* Answer chips */}
        {questions[qIndex] && !loadingQ && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {currentKey === "interests" && (
              <InterestChips
                value={answers.interests}
                onChange={(v) => setAnswer("interests", v)}
              />
            )}
            {currentKey === "socialComfort" && (
              <SocialChips
                value={answers.socialComfort}
                onChange={(v) => setAnswer("socialComfort", v)}
              />
            )}
            {currentKey === "groupSize" && (
              <GroupChips
                value={answers.groupSize}
                onChange={(v) => setAnswer("groupSize", v)}
              />
            )}
            {currentKey === "dietary" && (
              <DietaryChips
                value={answers.dietary}
                onChange={(v) => setAnswer("dietary", v)}
              />
            )}
            {currentKey === "budget" && (
              <BudgetChips
                value={answers.budget}
                onChange={(v) => setAnswer("budget", v)}
              />
            )}
            {currentKey === "city" && (
              <CitySelect
                value={answers.city}
                onChange={(v) => setAnswer("city", v)}
              />
            )}

            {currentKey === "interests" && answers.interests.length === 1 && (
              <p style={{ fontSize: "0.8rem", color: "var(--comora-orange)" }}>
                Pick at least one more.
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-card)",
          display: "flex",
          justifyContent: "flex-end",
          maxWidth: "42rem",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <Button
          variant="primary"
          onClick={handleNext}
          loading={submitting}
          disabled={!canAdvance() || loadingQ}
        >
          {qIndex === Q_KEYS.length - 1 ? "Complete Setup" : "Next →"}
        </Button>
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

function getAnswerSummary(key, answers) {
  if (key === "interests")
    return (
      INTEREST_CATEGORIES.filter((c) => answers.interests.includes(c.id))
        .map((c) => c.icon + " " + c.label)
        .join(", ") || "—"
    );
  if (key === "socialComfort")
    return (
      SOCIAL_COMFORT.find((s) => s.value === answers.socialComfort)?.label ||
      "—"
    );
  if (key === "groupSize")
    return answers.groupSize
      ? `${answers.groupSize.min}–${answers.groupSize.max === 99 ? "∞" : answers.groupSize.max} people`
      : "—";
  if (key === "dietary")
    return answers.dietary?.length
      ? answers.dietary.join(", ")
      : "No restrictions";
  if (key === "budget")
    return BUDGET_OPTIONS.find((b) => b.id === answers.budget)?.label || "—";
  if (key === "city") return answers.city || "—";
  return "—";
}
