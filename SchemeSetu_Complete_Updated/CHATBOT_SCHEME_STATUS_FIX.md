# Chatbot accuracy and scheme-status fix

- Mahila e-Haat is marked closed, based on Government of India Rajya Sabha Unstarred Question No. 1918, answered 11 December 2024. The answer states the Ministry closed it with effect from July 2020.
- Removed the old Mahila e-Haat URL as an application link and updated its description to historical-only.
- Excluded closed schemes from active profile matching.
- Gemini now receives operational status, source, and status note for each scheme and is instructed never to give application steps for closed or unverified schemes.
- Built-in/offline chatbot replies also give the closure notice for Mahila e-Haat.
- Improved scheme-name matching so "Mahila e-Haat" is not confused with similarly named Mahila schemes.

Official source: https://sansad.in/getFile/annex/266/AU1918_ZvpZT7.pdf?source=pqars

This is a data/prompt guardrail, not a live automatic government-status feed. Other scheme records still need periodic verification.
