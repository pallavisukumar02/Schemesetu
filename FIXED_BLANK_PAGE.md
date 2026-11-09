# V11 blank-page fix

The V10 landing page had a React runtime error: `FeatureCard` called `t(...)` without defining the `useTranslation()` hook in that component. That caused the root route to render blank in the browser.

V11 fixes `FeatureCard` by using `const { t } = useTranslation();` and keeps the rest of the V10 UI, account/database, tracker, government-integration architecture, and multilingual files unchanged.
