"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, AlertCircle } from "lucide-react";
import { content, type Language } from "@/lib/content";

type GeneratorTranslations = (typeof content)["de"]["generator"];

type Props = {
  lang: Language;
  translations: GeneratorTranslations;
};

export default function ConceptForm({ lang, translations }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    age: "",
    appearance: "",
    interests: "",
    boundaries: "",
    time: "",
    email: "",
    consent: false,
    website: "",
  });

  const update = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const age = Number(form.age);

    if (!Number.isInteger(age) || age < 18) {
      setStatus("error");
      setMessage(translations.ageError);
      return;
    }

    if (!form.consent) {
      setStatus("error");
      setMessage(
        lang === "de"
          ? "Bitte stimme der Datenschutzerklärung zu."
          : "Please accept the privacy policy.",
      );
      return;
    }

    try {
      const response = await fetch("/api/concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age,
          lang,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("success");
      setMessage(translations.success);

      setForm({
        name: "",
        age: "",
        appearance: "",
        interests: "",
        boundaries: "",
        time: "",
        email: "",
        consent: false,
        website: "",
      });
    } catch {
      setStatus("error");
      setMessage(translations.error);
    }
  }

  const fields = translations.fields;

  return (
    <form className="concept-form" onSubmit={handleSubmit}>
      <div className="concept-form-grid">
        <div className="concept-field">
          <label htmlFor="concept-name">{fields.name} *</label>
          <input
            id="concept-name"
            name="name"
            type="text"
            autoComplete="given-name"
            required
            maxLength={100}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div className="concept-field">
          <label htmlFor="concept-age">{fields.age} *</label>
          <input
            id="concept-age"
            name="age"
            type="number"
            min="18"
            max="100"
            required
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
          />
        </div>

        <div className="concept-field">
          <label htmlFor="concept-appearance">{fields.appearance} *</label>
          <select
            id="concept-appearance"
            name="appearance"
            required
            value={form.appearance}
            onChange={(e) => update("appearance", e.target.value)}
          >
            <option value="">{fields.select}</option>
            {fields.appearanceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="concept-field">
          <label htmlFor="concept-time">{fields.time} *</label>
          <select
            id="concept-time"
            name="time"
            required
            value={form.time}
            onChange={(e) => update("time", e.target.value)}
          >
            <option value="">{fields.select}</option>
            {fields.timeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="concept-field concept-field-full">
          <label htmlFor="concept-interests">{fields.interests}</label>
          <textarea
            id="concept-interests"
            name="interests"
            rows={3}
            maxLength={2000}
            placeholder={fields.interestsPlaceholder}
            value={form.interests}
            onChange={(e) => update("interests", e.target.value)}
          />
        </div>

        <div className="concept-field concept-field-full">
          <label htmlFor="concept-boundaries">{fields.boundaries}</label>
          <textarea
            id="concept-boundaries"
            name="boundaries"
            rows={3}
            maxLength={2000}
            placeholder={fields.boundariesPlaceholder}
            value={form.boundaries}
            onChange={(e) => update("boundaries", e.target.value)}
          />
        </div>

        <div className="concept-field concept-field-full">
          <label htmlFor="concept-email">{fields.email} *</label>
          <input
            id="concept-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder={fields.emailPlaceholder}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>
      </div>

      {/* Einfaches Honeypot-Feld als Spam-Schutz */}
      <div className="concept-honeypot" aria-hidden="true">
        <label htmlFor="concept-website">Website</label>
        <input
          id="concept-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <label className="concept-consent">
        <input
          type="checkbox"
          required
          checked={form.consent}
          onChange={(e) => update("consent", e.target.checked)}
        />
        <span>
          {translations.consentBefore}{" "}
          <a href="#datenschutz">{translations.consentLink}</a>{" "}
          {translations.consentAfter}
        </span>
      </label>

      <p className="concept-footnote">{translations.footnote}</p>

      <button
        className="button button-gold concept-submit"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? translations.sending : translations.submit}
        <ArrowUpRight size={18} />
      </button>

      {message && (
        <div
          className={`concept-message concept-message-${status}`}
          role="status"
          aria-live="polite"
        >
          {status === "success" ? (
            <CheckCircle2 size={19} />
          ) : status === "error" ? (
            <AlertCircle size={19} />
          ) : null}
          <span>{message}</span>
        </div>
      )}
    </form>
  );
}
