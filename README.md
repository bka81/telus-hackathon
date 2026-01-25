# Unlinear — Tasks, made calmer.

Unlinear is a **mobile-first AI task simplification tool** built for moments when everything feels overwhelming. It’s designed with neurodivergent users in mind (ADHD, autism, executive dysfunction), but it’s useful for anyone dealing with stress, decision fatigue, or burnout.

Instead of acting like a traditional to-do app (where you must already know the steps), Unlinear lets users type **messy, real-life thoughts** in their own words. The app uses AI to turn that input into **a few starting points** and then guides the user through **gentle, doable steps — one at a time**.

---

## What it does (Demo flow)
1. **Type what’s on your mind** — or tap the **mic** to **speak instead of typing** 
2. Set **Energy level** + **Sensory tolerance**
3. Get a few **main focus areas** (cards) to choose from
4. Enter **Focus Mode**: one step at a time with **Done → Next** (no timers, no pressure)

---

## Why it matters
When someone is overwhelmed, task initiation and decision-making become the hardest part. Unlinear reduces cognitive load by:
- offering **small, concrete steps**
- limiting choices to **a few starting points**
- adapting the plan to the user’s **current capacity**
- using a **gentle, non-judgmental tone**

---

## Built with
- **React** (mobile-first UI)
- **CSS**
- **React Router**
- **Netlify Functions** (serverless AI calls; keeps API keys off the client)
- **Node.js + npm**

---

## Run locally
### 1) Install
```bash
npm install
```

### 2) Add your API key
Create a `.env` file in the project root:
```bash
OPENAI_API_KEY="YOUR_KEY_HERE"
```

> Don’t commit `.env` to GitHub.

### 3) Start the app
**Recommended (frontend + functions):**
```bash
npm install -g netlify-cli
netlify dev
```

---

## Deploy (Netlify)
1. Push the repo to GitHub  
2. Connect it to Netlify  
3. Add `OPENAI_API_KEY` in Netlify Environment Variables  
4. Deploy  

---

## Notes 
- User input is only used to generate the breakdown.
- API keys are stored server-side via serverless functions.
- This is a prototype focused on accessibility and cognitive-load reduction.

---

## Team
Manjari Prasad
Asmi Pahwa
Widad Modak
Beyzanur Kuyuk
