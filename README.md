# Claude Cert Lab

A free, unofficial study platform for Anthropic's Claude certifications, in the style of killer.sh / KodeKloud:

- **CCDV-F** — Claude Certified Developer (Foundations): 53 questions, 120 min, pass 720/1000
- **CCAR-F** — Claude Certified Architect (Foundations): 60 scenario questions, 120 min, pass 720/1000

## Features

| Section | What it does |
|---|---|
| Dashboard | Blueprint-weighted readiness score, per-domain accuracy, best mock score, exam-date countdown, next best action |
| Learn | One lesson per sub-skill, ordered by exam weight, with key points and "Exam traps" |
| Practice | Diagnostic, drills by domain, unseen questions, mistake review, random 20, all with explanations |
| Mock Exam | Timed, weighted sampling by domain, flag and navigate, scaled score with per-domain breakdown and answer review |
| Labs | Hands-on build labs (API, streaming, tool loops, structured output, caching, MCP, hooks, Agent SDK, Architect scenarios) |
| Study Plan | Week-by-week plan based on your exam date |
| Resources | Candidate reports from Reddit/blogs plus official and community links |

Question bank: 151 Developer + 112 Architect questions. Progress is saved in your browser (localStorage) and can be exported.

## Run locally

It's a static site with no build step:

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Disclaimer

Not affiliated with or endorsed by Anthropic. All practice questions are original and are **not** real exam items. Blueprint weights come from community guides; verify them against Anthropic's official exam guide. The 100–1000 score is a linear approximation of scaled scoring.
