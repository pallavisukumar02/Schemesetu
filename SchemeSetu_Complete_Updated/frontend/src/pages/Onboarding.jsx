import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";
import CameraCapture from "../components/CameraCapture.jsx";
import VoiceInput from "../components/VoiceInput.jsx";
import StateDistrictSelect from "../components/StateDistrictSelect.jsx";

const CATEGORIES = ["general", "sc", "st", "obc", "minority"];
const GENDERS = ["male", "female", "other"];
const INCOME_BRACKETS = ["below_1l", "1l_3l", "3l_6l", "6l_10l", "above_10l"];
const EDUCATION_LEVELS = ["none", "class_8", "class_10", "class_12", "graduate", "postgraduate"];
const BUSINESS_TYPES = ["new", "existing", "street_vendor", "artisan", "food_business", "urban_poor"];

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", age: "", gender: "", category: "", state: "", district: "",
    income_bracket: "", education_level: "", business_type: "",
    disability_status: "", photo_url: null, consent_given: false,
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.consent_given) {
      setError(t("onboarding.consentRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile({
        ...form,
        age: Number(form.age),
        preferred_language: i18n.language,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ss-account-page"><div className="ss-account-inner ss-onboarding-inner">
      <span className="ss-eyebrow">STEP 02 · YOUR BUSINESS PROFILE</span>
      <h1 className="font-display text-2xl mb-2">{t("onboarding.title")}</h1>
      <p className="text-sm text-ink/60 mb-8">{t("onboarding.subhead")} Tell us about your income range, location and business so we can calculate relevant scheme matches.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <CameraCapture onCapture={(dataUrl) => set("photo_url", dataUrl)} />

        <Field label={t("onboarding.name")}>
          <TextWithVoice value={form.name} onChange={(v) => set("name", v)} lang={i18n.language} />
        </Field>

        <Field label={t("onboarding.age")}>
          <input type="number" min="18" required value={form.age} onChange={(e) => set("age", e.target.value)} className="input" />
        </Field>

        <Field label={t("onboarding.gender")}>
          <Select value={form.gender} onChange={(v) => set("gender", v)} options={GENDERS} labelPrefix="onboarding.genderOptions" t={t} />
        </Field>

        <Field label={t("onboarding.category")}>
          <Select value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} labelPrefix="onboarding.categoryOptions" t={t} />
        </Field>

        <StateDistrictSelect
          state={form.state}
          district={form.district}
          onStateChange={(v) => set("state", v)}
          onDistrictChange={(v) => set("district", v)}
          t={t}
        />

        <Field label="What is your annual household income?">
          <Select value={form.income_bracket} onChange={(v) => set("income_bracket", v)} options={INCOME_BRACKETS} labelPrefix="onboarding.incomeOptions" t={t} />
        </Field>

        <Field label={t("onboarding.educationLevel")}>
          <Select value={form.education_level} onChange={(v) => set("education_level", v)} options={EDUCATION_LEVELS} labelPrefix="onboarding.educationOptions" t={t} />
        </Field>

        <Field label="Where are you in your business journey?">
          <Select value={form.business_type} onChange={(v) => set("business_type", v)} options={BUSINESS_TYPES} labelPrefix="onboarding.businessOptions" t={t} />
        </Field>

        <Field label={t("onboarding.disabilityStatus")} optional>
          <TextWithVoice value={form.disability_status} onChange={(v) => set("disability_status", v)} lang={i18n.language} />
        </Field>

        <label className="flex items-start gap-2 text-sm mt-2">
          <input
            type="checkbox"
            checked={form.consent_given}
            onChange={(e) => set("consent_given", e.target.checked)}
            className="mt-1"
          />
          <span>{t("onboarding.consentText")}</span>
        </label>

        {error && <p className="text-sm text-rust">{error}</p>}

        <button disabled={submitting} className="bg-ink text-paper rounded-card py-3 font-medium disabled:opacity-50">
          {submitting ? t("onboarding.saving") : t("onboarding.submit")}
        </button>
      </form>

      <style>{`.input { border: 1px solid rgba(19,44,46,0.2); border-radius: 0.375rem; padding: 0.5rem 0.75rem; width: 100%; }`}</style>
    </div></div>
  );
}

function Field({ label, optional, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label} {optional && <span className="text-ink/40 font-normal">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

function TextWithVoice({ value, onChange, lang }) {
  return (
    <div className="flex items-center gap-2">
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input flex-1" />
      <VoiceInput lang={lang} onResult={onChange} />
    </div>
  );
}

function Select({ value, onChange, options, labelPrefix, t }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required className="input">
      <option value="" disabled>{t("onboarding.selectPlaceholder")}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{t(`${labelPrefix}.${opt}`)}</option>
      ))}
    </select>
  );
}
