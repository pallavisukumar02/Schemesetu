import statesAndDistricts from "../data/india-states-districts.json";

// Two dependent <select> elements: picking a state repopulates the district
// list from data/india-states-districts.json and clears any previously
// chosen district that no longer applies.
//
// DATA NOTE: this list is adapted from a widely-used community dataset and
// patched for two known gaps (missing Andaman & Nicobar Islands and Ladakh
// as their own entries; the 2020 Dadra & Nagar Haveli / Daman & Diu merger).
// District boundaries are reorganised by state governments fairly often
// (e.g. Andhra Pradesh and Chhattisgarh both split several districts in
// 2022) — if a user's district is missing or looks outdated, that's most
// likely why. See README "Verify before your demo" for where to update
// frontend/src/data/india-states-districts.json.
export default function StateDistrictSelect({ state, district, onStateChange, onDistrictChange, t }) {
  const districts = statesAndDistricts.find((s) => s.state === state)?.districts || [];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t("onboarding.state")}</label>
        <select
          value={state}
          onChange={(e) => {
            onStateChange(e.target.value);
            onDistrictChange(""); // reset district when state changes
          }}
          required
          className="input"
        >
          <option value="" disabled>{t("onboarding.selectPlaceholder")}</option>
          {statesAndDistricts.map((s) => (
            <option key={s.state} value={s.state}>{s.state}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t("onboarding.district")}</label>
        <select
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          required
          disabled={!state}
          className="input disabled:opacity-50"
        >
          <option value="" disabled>
            {state ? t("onboarding.selectPlaceholder") : t("onboarding.selectStateFirst")}
          </option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
