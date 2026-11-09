import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageToggle from "../components/LanguageToggle.jsx";
import { motion } from "framer-motion";

const steps = [
  { num: "01", titleKey: "matchTitle", headingKey: "matchHeading", bodyKey: "matchBody", icon: "✳" },
  { num: "02", titleKey: "prepareTitle", headingKey: "prepareHeading", bodyKey: "prepareBody", icon: "◈" },
  { num: "03", titleKey: "trackTitle", headingKey: "trackHeading", bodyKey: "trackBody", icon: "↗" },
  { num: "04", titleKey: "connectTitle", headingKey: "connectHeading", bodyKey: "connectBody", icon: "◎" },
];

function MatchPreview() {
  return (
    <div className="ss-preview-wrap" aria-label="Illustration of matched government schemes">
      <div className="ss-preview-glow" />
      <div className="ss-preview-orbit ss-orbit-one" />
      <div className="ss-preview-orbit ss-orbit-two" />
      <motion.div className="ss-preview-core" animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <span className="ss-core-mark">S</span><b>YOUR PROFILE</b><small>Eligibility profile</small>
      </motion.div>
      <motion.div className="ss-match-card ss-match-one" animate={{ y: [0, -7, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}>
        <span className="ss-match-icon">₹</span><div><small>BUSINESS SUPPORT</small><b>PMEGP</b><em>Potential match</em></div><strong>92%</strong>
      </motion.div>
      <motion.div className="ss-match-card ss-match-two" animate={{ y: [0, 7, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}>
        <span className="ss-match-icon lilac">✦</span><div><small>MICRO BUSINESS</small><b>PM Mudra Yojana</b><em>Explore eligibility</em></div><strong>87%</strong>
      </motion.div>
      <motion.div className="ss-match-card ss-match-three" animate={{ y: [0, -5, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}>
        <span className="ss-match-icon peach">⌂</span><div><small>STREET VENDORS</small><b>PM SVANidhi</b><em>Potential match</em></div><strong>81%</strong>
      </motion.div>
      <div className="ss-preview-foot"><span><i /> PROFILE-BASED DISCOVERY</span><span>SCHEMESETU / 01</span></div>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="landing-page ss-landing">
      <header className="landing-nav ss-nav">
        <Link to="/" className="landing-brand ss-brand"><span className="brand-mark">S</span><span>scheme<span>setu</span></span></Link>
        <nav className="ss-nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a><a href="#access">Languages</a><Link to="/banks">Nearby banks</Link>
        </nav>
        <div className="landing-nav-actions"><LanguageToggle /><Link to="/app" className="landing-home-btn">{t("home.openApp")} <span>↗</span></Link></div>
      </header>

      <main>
        <section className="landing-hero ss-hero">
          <div className="landing-hero-copy ss-hero-copy">
            <div className="landing-kicker ss-kicker"><span className="pulse-dot" /> A clearer way to access opportunities</div>
            <h1>{t("home.headline")}</h1>
            <p className="landing-tagline ss-tagline">{t("home.heroTagline")}</p>
            <p className="landing-subhead">Tell us a little about yourself or your business. SchemeSetu helps you discover government schemes that may fit your profile, understand why, and prepare your next step.</p>
            <div className="landing-actions"><Link to="/app" className="landing-primary ss-primary">{t("home.cta")} <span>↗</span></Link><Link to="/integrations" className="landing-secondary ss-secondary">{t("home.seeConnections")} <span>→</span></Link></div>
            <div className="landing-pills ss-pills"><span className="landing-pill">Free to explore</span><span className="landing-pill">6 Indian languages</span><span className="landing-pill">Transparent matches</span></div>
            <p className="ss-disclaimer">Eligibility guidance only. Final approval is always made by the relevant government authority.</p>
          </div>
          <div className="landing-visual ss-visual"><MatchPreview /><div className="visual-caption ss-visual-caption"><span>YOUR PROFILE</span><i>✦</i><span>SCHEME MATCHES</span><i>✦</i><span>NEXT STEPS</span></div></div>
        </section>

        <section className="ss-trust-strip">
          <div><span>MADE TO MAKE DISCOVERY EASIER</span><strong>Less searching. More clarity about what you may be eligible for.</strong></div>
          <div className="ss-trust-tags"><span>Women entrepreneurs</span><span>Small businesses</span><span>Rural communities</span><span>First-time applicants</span></div>
        </section>

        <section className="landing-section ss-steps" id="how-it-works">
          <div className="section-heading ss-section-heading"><span className="landing-kicker">THE SCHEMESETU JOURNEY</span><h2>{t("home.journeyHeading")}</h2><p>{t("home.journeyDesc")}</p></div>
          <div className="feature-grid ss-feature-grid">{steps.map((step) => <article className="pro-feature-card ss-feature-card" key={step.num}><div className="feature-top"><span>{step.num}</span><b>{step.icon}</b></div><small>{t(`home.${step.titleKey}`)}</small><h3>{t(`home.${step.headingKey}`)}</h3><p>{t(`home.${step.bodyKey}`)}</p><Link to="/app" className="feature-arrow">Explore <span>↗</span></Link></article>)}</div>
        </section>

        <section className="landing-section ss-access" id="access">
          <div className="ss-access-copy"><span className="landing-kicker">ACCESS WITHOUT BARRIERS</span><h2>{t("home.accessHeading")}</h2><p>{t("home.accessBody")}</p><div className="ss-language-list"><span>English</span><span>हिन्दी</span><span>తెలుగు</span><span>தமிழ்</span><span>ಕನ್ನಡ</span><span>മലയാളം</span></div><Link to="/app" className="ss-text-link">Explore SchemeSetu <b>↗</b></Link></div>
          <div className="ss-access-panel"><div className="ss-panel-top"><span className="ss-mini-brand"><i>S</i> SchemeSetu</span><span className="ss-online"><i /> YOUR SCHEME SPACE</span></div><div className="ss-panel-title">A little about you.<br/><em>A lot more clarity.</em></div><div className="ss-profile-row"><span className="ss-profile-icon">⌂</span><div><b>Your profile</b><small>Location · Work · Goals</small></div><span className="ss-check">✓</span></div><div className="ss-profile-row"><span className="ss-profile-icon lavender">✦</span><div><b>Relevant opportunities</b><small>Potential matches with reasons</small></div><span className="ss-check">✓</span></div><div className="ss-profile-row"><span className="ss-profile-icon peach">↗</span><div><b>Your next steps</b><small>Documents · Preparation · Apply</small></div><span className="ss-check">✓</span></div><div className="ss-panel-note">Clear guidance, in a language you are comfortable with.</div></div>
        </section>

        <section className="landing-cta ss-cta"><div><span className="landing-kicker">YOUR NEXT STEP STARTS HERE</span><h2>Government schemes? Wondering which ones suit you?<br/><em>We’ve got you.</em></h2><p>Start with your profile. Discover opportunities with more confidence.</p></div><Link to="/app" className="landing-primary ss-primary">Find my schemes <span>↗</span></Link></section>
      </main>
      <footer className="landing-footer ss-footer"><div className="ss-footer-brand"><span className="brand-mark">S</span><b>scheme<span>setu</span></b></div><span>© {new Date().getFullYear()} SchemeSetu · Built for clearer access to opportunities.</span><div><Link to="/privacy">{t("home.privacy")}</Link><Link to="/banks">Nearby banks</Link></div></footer>
    </div>
  );
}
