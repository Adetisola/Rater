# Computational Audience Perception System

**Status:** Deployed  
**Core Technologies:** Next.js, Typescript, Gemini 2.5 Flash Lite (Classifier), Gemini 3.5 Flash (Synthesizer)

## The Problem
Standard LLM wrappers for generating "insights" from user reviews suffer from a critical flaw: they lack skepticism. If you feed an LLM 10 off-topic spam comments (e.g., "I cooked rice", "nice bro") mixed with numeric ratings, the LLM will hallucinate deep, philosophical design critique because its base instructions tell it to "summarize the design feedback." 

## The Solution
To build true trust, we decoupled the **Thinking** from the **Writing**. 

The **Computational Audience Perception System** acts as a strict, multi-stage pipeline that evaluates the *validity*, *density*, and *honesty* of audience feedback before any final summary is written.

---

## System Architecture

### Stage 1: The Pre-Filter (Mini-Classifier)
Instead of dumping raw reviews directly into a massive LLM context, every written comment is first passed through a lightweight, high-speed model (`gemini-2.5-flash-lite`).
- **Scoring:** It assigns a `classification` (relevant, partially_relevant, low_signal, off_topic), a `confidence` score, and a `signal_strength` metric to every single comment.
- **Eradication:** Comments tagged as `off_topic` or flagged with low confidence are permanently removed from the data payload. The synthesis model will *never* see them.

### Stage 2: The Deterministic Engine
The cleaned data enters a strict deterministic pipeline (`insightEngine.ts`):
- **Deterministic Summaries:** To prevent the LLM from hallucinating grand opening statements, the core summary structure is generated deterministically based on average scores and recurring positive/negative themes.
- **Theme Confidence:** Themes (like "Typography" or "Hierarchy") require a minimum cumulative `signal_strength` from multiple high-confidence comments to be considered valid.
- **Contradiction Awareness:** If the engine detects both positive and negative keywords for a specific theme, it explicitly flags a "Contradiction." This forces the synthesis LLM to acknowledge divergent audience perceptions rather than blending them into a muddy average.
- **Segregation:** `partially_relevant` and `low_signal` comments bypass clustering entirely. They are grouped into a secondary bucket used *only* for mild sentiment reinforcement.

### Stage 3: The Dynamic Orchestrator
The backend (`route.ts`) acts as an orchestrator, calculating the ratio of high-signal vs. low-signal feedback to dictate exactly how the final LLM should behave. It enforces one of four rigid **Analysis Modes**:

1. **`comment_supported`**: For rich, actionable data. The LLM is allowed to pull specific observations and nuances from the comments.
2. **`low_signal`**: Triggered when the majority of comments are brief (e.g., "clean", "looks good"). The LLM is forced into a restrained tone, preventing it from fabricating depth.
3. **`ratings_only`**: Triggered when written feedback is absent or pure spam, but the numeric ratings show a clear trend. The LLM generates insights purely from the score deltas.
4. **`insufficient`**: The API Short-Circuit. If the data is garbage, the API instantly returns a hardcoded failure response, bypassing the final LLM call entirely to save latency and costs.

### Stage 4: Synthesis (The Writer)
Only after passing the classifier, surviving the deterministic engine, and receiving a strict Analysis Mode, is the data passed to the final LLM (e.g., `gemini-3.5-flash`). 
- It acts solely as a "Writer", taking the meticulously curated, sanitized data and turning it into a natural, human-sounding paragraph.
- **Strict Personality Constraints:** The LLM is forced to act as a "calm, observant creative peer." It is explicitly banned from using AI-isms like em dashes (—), semicolons for dramatic pauses, or connector words like "however," "moreover," and "furthermore." 
- **Formatting:** Functional language stays standard, while atmospheric language gets personality. It outputs strict, structured JSON.

---

## Why This Matters
By treating the LLM as a tool within a deterministic pipeline rather than a magic black box, the platform now guarantees **honest, grounded insights**. If a creative posts their work and receives shallow feedback, the platform will honestly reflect that, rather than inventing critique that was never given. This architecture crosses the bridge from "an AI feature" to a genuine "trust-aware perception engine."
