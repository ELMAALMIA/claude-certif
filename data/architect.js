// CCAR-F — Claude Certified Architect (Foundations)
// Original study content. Not real exam questions. Weights as reported by community guides (verify on Anthropic's exam page).
window.CERT_DATA = window.CERT_DATA || {};
window.CERT_DATA.architect = {
  id: "architect",
  code: "CCAR-F",
  name: "Claude Certified Architect (Foundations)",
  exam: { items: 60, minutes: 120, pass: 720, fee: "$125", format: "Scenario-based multiple choice; 4 scenarios per exam (guide lists 6; candidates report others), proctored (Pearson VUE)" },
  scenarios: ["Customer Support Resolution Agent","Code Generation with Claude Code","Multi-Agent Research System","Developer Productivity with Claude","Claude Code for Continuous Integration","Structured Data Extraction"],
  domains: [
    { id: "arch", name: "Agentic Architecture & Orchestration", weight: 27, subs: [["Agentic loops & termination",0],["Coordinator / subagent orchestration",0],["Guardrails & escalation",0],["Agent SDK & hooks",0],["Task decomposition & state recovery",0]] },
    { id: "ccw", name: "Claude Code Configuration & Workflows", weight: 20, subs: [["CLAUDE.md hierarchy & rules",0],["Settings, permissions & hooks",0],["Commands, skills & subagents",0],["Plan mode & iterative workflows",0],["Claude Code in CI/CD",0]] },
    { id: "pe", name: "Prompt Engineering & Structured Output", weight: 20, subs: [["Explicit criteria & instructions",0],["Few-shot examples",0],["Structured output via schemas/tools",0],["Validation-retry loops",0],["Batch processing & review",0]] },
    { id: "tools", name: "Tool Design & MCP Integration", weight: 18, subs: [["Tool descriptions & boundaries",0],["Structured tool errors",0],["Tool distribution across agents",0],["MCP server configuration",0],["Built-in tools usage",0]] },
    { id: "ctx", name: "Context Management & Reliability", weight: 15, subs: [["Preserving critical facts",0],["Escalation & ambiguity",0],["Error propagation in multi-agent systems",0],["Large-codebase exploration",0],["Human review & provenance",0]] }
  ],

  lessons: {
    arch: [
      { title: "Agentic loops & termination", points: [
        "Loop: send request → if <code>stop_reason == 'tool_use'</code> execute tools, append results, continue → stop on <code>end_turn</code>.",
        "Never decide completion by parsing assistant text ('I'm done') or by an arbitrary fixed iteration count as the <i>primary</i> mechanism — use stop_reason, with an iteration cap as a safety net.",
        "Append the assistant content (including tool_use blocks) to history, then tool results in the next user message."
      ], traps: ["Checking if the text contains 'complete'.","Loop that exits when any text block appears (Claude often writes text alongside tool calls)."]},
      { title: "Coordinator / subagent orchestration", points: [
        "Hub-and-spoke: a coordinator decomposes, delegates to subagents, aggregates. Subagents don't talk to each other directly — the coordinator routes.",
        "Subagents do <b>not</b> inherit the coordinator's history. Pass everything they need explicitly in their prompt (goal, constraints, prior findings, output format).",
        "Spawn independent subagents in parallel (multiple Task calls in one turn) to cut latency.",
        "Scope decomposition carefully: too-narrow decomposition leaves coverage gaps (e.g. a 'creative industries' research topic only covering visual arts).",
        "Have subagents return structured results (claims + sources + metadata) so the coordinator can synthesize and attribute."
      ], traps: ["Assuming the subagent 'knows' what the coordinator saw.","Sequential subagents for independent work."]},
      { title: "Guardrails & escalation", points: [
        "Prompts are probabilistic; for business rules that must hold (e.g. refunds > $500 need approval) use <b>deterministic enforcement</b>: hooks/tool-call interception or code checks.",
        "Escalate to humans on: explicit customer request for a human, policy gaps/exceptions, inability to make progress — not on sentiment alone or self-reported low confidence.",
        "Handoff to a human should include a structured summary (customer ID, issue, what was tried, recommended action) because humans don't see the transcript.",
        "Prerequisite gates: block e.g. process_refund until verify_customer has succeeded."
      ], traps: ["Using sentiment analysis as the escalation trigger.","Relying on 'IMPORTANT: always verify' in the prompt for a compliance-critical step."]},
      { title: "Agent SDK & hooks", points: [
        "Claude Agent SDK = Claude Code harness as a library: built-in tools, permission modes, hooks, subagents (Task tool), MCP, sessions.",
        "<code>PostToolUse</code> hooks can normalize tool outputs (e.g. convert date formats/status codes) before Claude sees them.",
        "<code>PreToolUse</code> hooks can block or redirect policy-violating calls deterministically.",
        "Sessions can be resumed or forked to explore alternatives from a shared baseline."
      ], traps: ["Normalizing heterogeneous tool formats via prompt instructions instead of a hook."]},
      { title: "Task decomposition & state recovery", points: [
        "Fixed pipelines (prompt chaining) for predictable multi-aspect reviews; dynamic decomposition (orchestrator) for open-ended investigation.",
        "Split large reviews: per-file local passes + a separate cross-file integration pass to avoid attention dilution.",
        "Persist compact structured state (manifest of completed steps and results) so a crashed pipeline resumes only unfinished work instead of replaying everything.",
        "Resuming a stale session after code changed: tell the agent what changed, or start fresh with a summary — stale tool results mislead."
      ], traps: ["Restarting the whole pipeline after a single subagent failure."]}
    ],
    ccw: [
      { title: "CLAUDE.md hierarchy & rules", points: [
        "User <code>~/.claude/CLAUDE.md</code> (only you, not shared via git) → project <code>./CLAUDE.md</code> or <code>.claude/CLAUDE.md</code> (team) → subdirectory CLAUDE.md files (load when working there).",
        "<code>@import</code> pulls in other files to keep CLAUDE.md modular.",
        "<code>.claude/rules/*.md</code> with <code>paths:</code> glob frontmatter apply conventions only to matching files (e.g. <code>**/*.test.tsx</code>) — better than directory CLAUDE.md for cross-cutting file types.",
        "Diagnose 'new teammate doesn't get the instructions' → they were in someone's user-level file, not the project file. <code>/memory</code> shows what's loaded."
      ], traps: ["Team conventions placed in ~/.claude/CLAUDE.md."]},
      { title: "Settings, permissions & hooks", points: [
        "Settings precedence: managed > CLI flags > .claude/settings.local.json > .claude/settings.json > ~/.claude/settings.json.",
        "Permissions allow/ask/deny; deny wins. Keep local overrides in settings.local.json (gitignored).",
        "Hooks are deterministic: use them for must-always behaviour (format on save, block protected paths)."
      ], traps: ["Committing settings.local.json."]},
      { title: "Commands, skills & subagents", points: [
        "Project slash commands: <code>.claude/commands/</code> (shared); personal: <code>~/.claude/commands/</code>.",
        "Skills: <code>.claude/skills/&lt;name&gt;/SKILL.md</code> with frontmatter; options like <code>context: fork</code> run in an isolated subagent context, <code>allowed-tools</code> restricts tools.",
        "Use skills for on-demand task-specific workflows; CLAUDE.md for always-loaded universal standards.",
        "Subagents (<code>.claude/agents/</code>) give isolated context for verbose exploration — keep the main conversation clean."
      ], traps: ["Putting a rarely used, long procedure into CLAUDE.md (always loaded)."]},
      { title: "Plan mode & iterative workflows", points: [
        "Plan mode for large-scale, multi-file, architectural or ambiguous changes; direct execution for small, well-understood fixes.",
        "Iterative refinement: give concrete input/output examples, write tests first (TDD) and iterate on failures, use the interview pattern for unclear requirements.",
        "Batch related issues in one message when they interact; fix independent ones sequentially.",
        "<code>/compact</code> to reduce context in long sessions; Explore subagent for verbose discovery."
      ], traps: ["Plan mode for a one-line typo fix; direct execution for a monolith-to-microservices migration."]},
      { title: "Claude Code in CI/CD", points: [
        "Use <code>-p</code> / <code>--print</code> for non-interactive runs (without it, the job hangs waiting for input).",
        "<code>--output-format json</code> plus <code>--json-schema</code> for machine-parseable findings that can be posted as inline PR comments.",
        "A <b>separate</b> review instance is better than self-review in the same session (the generator retains its reasoning and is less likely to question it).",
        "Give CI context in CLAUDE.md (testing standards, fixtures); pass prior review findings to avoid duplicate comments on re-runs.",
        "Batch API fits overnight/weekly non-blocking jobs, not blocking pre-merge checks (no latency SLA)."
      ], traps: ["Using the Batch API for pre-merge checks developers wait on.","Same session generates and reviews code."]}
    ],
    pe: [
      { title: "Explicit criteria & instructions", points: [
        "Vague instructions ('be conservative', 'only report high-confidence') don't improve precision. Define explicit criteria: which issue categories to report, which to skip, with examples of each severity.",
        "High false-positive categories erode trust in all findings — temporarily disable them while refining their criteria.",
        "State what 'done' and 'good' mean concretely."
      ], traps: ["Adding 'be careful' and expecting fewer false positives."]},
      { title: "Few-shot examples", points: [
        "Few-shot examples are the most effective way to get consistent format and judgment on ambiguous cases.",
        "Include 2–4 targeted examples of ambiguous scenarios with the reasoning for the chosen action — teaches generalization, not just matching.",
        "Show acceptable vs problematic patterns to reduce false positives; show varied document structures for extraction."
      ], traps: ["Examples that only cover easy cases."]},
      { title: "Structured output via schemas/tools", points: [
        "Tool use with a JSON schema (or structured outputs) eliminates syntax errors but not semantic errors (wrong field, totals that don't add up).",
        "Design schemas for reality: nullable/optional fields when info may be absent (prevents fabrication), <code>enum</code> + <code>'other'</code> + detail string, <code>'unclear'</code> values.",
        "tool_choice <code>auto</code> may return text instead of calling a tool; when the tool is mandatory, use the API's mechanism to require a tool (where supported) or structured outputs.",
      ], traps: ["Making every field required so the model invents values."]},
      { title: "Validation-retry loops", points: [
        "Retry with the document, the failed output and the <b>specific</b> validation error.",
        "Retries help with format/structure errors, not when the information simply isn't in the source.",
        "Add self-check fields (e.g. calculated_total vs stated_total, conflict_detected) to surface inconsistencies.",
        "Track patterns in what reviewers dismiss to improve prompts."
      ], traps: ["Retrying endlessly when the data is missing from the document."]},
      { title: "Batch processing & review", points: [
        "Message Batches: ~50% savings, up to 24h, no latency SLA, results matched via custom_id. Multi-turn tool calling isn't possible within a single batch request.",
        "Resubmit only failed items (by custom_id) with fixes, e.g. chunk oversized docs.",
        "Refine prompts on a small sample before batch-processing large volumes.",
        "Multi-pass review: per-file local pass + cross-file integration pass."
      ], traps: ["Resubmitting the whole batch because 3% failed."]}
    ],
    tools: [
      { title: "Tool descriptions & boundaries", points: [
        "Descriptions are the primary mechanism for tool selection: purpose, inputs, examples, edge cases, and when to use it vs similar tools.",
        "Fix misrouting by improving descriptions or splitting a generic tool into purpose-specific tools (e.g. analyze_content → extract_web_results, summarize_content). Rename overlapping tools.",
        "Watch for system prompt keywords that bias toward the wrong tool.",
        "Prefer the least machinery: better description before a routing classifier or tool consolidation."
      ], traps: ["Minimal descriptions like 'Retrieves customer information'."]},
      { title: "Structured tool errors", points: [
        "Return structured error metadata: <code>errorCategory</code> (transient / validation / business / permission), <code>isRetryable</code>, human-readable description.",
        "Distinguish 'access failed' from 'valid empty result' — 'no matches' is not an error.",
        "Subagents retry transient failures locally; propagate only unresolvable errors with partial results and what was attempted.",
        "Business-rule violations are non-retryable: explain so the agent can tell the customer."
      ], traps: ["Generic 'Operation failed' messages.","Returning an empty success result when the call actually failed."]},
      { title: "Tool distribution across agents", points: [
        "Too many tools (e.g. 18 vs 4–5) degrades selection. Give each subagent only tools relevant to its role.",
        "A synthesis agent can get a narrow verify_fact tool for common simple checks while complex verification routes through the coordinator.",
        "Replace generic tools with constrained ones (fetch_url → load_document that validates URLs)."
      ], traps: ["Giving every subagent every tool 'just in case'."]},
      { title: "MCP server configuration", points: [
        "Project scope: <code>.mcp.json</code> (shared, version-controlled). User scope: <code>~/.claude.json</code> (personal/experimental).",
        "Use env var expansion (<code>${GITHUB_TOKEN}</code>) so secrets aren't committed.",
        "Tools from all configured servers are available at once.",
        "Prefer existing community servers for standard integrations (Jira, GitHub); build custom ones for team-specific workflows.",
        "MCP resources expose content catalogs (issue summaries, schemas) to reduce exploratory tool calls."
      ], traps: ["Team server in user scope.","Hard-coded token in .mcp.json."]},
      { title: "Built-in tools usage", points: [
        "Grep: search file contents (function names, error strings, imports). Glob: find files by path/name pattern (<code>**/*.test.tsx</code>).",
        "Read/Write for whole files; Edit for targeted changes using a unique anchor. If the anchor isn't unique, fall back to Read + Write.",
        "Explore incrementally: Grep for entry points, then Read to follow imports — don't read everything upfront."
      ], traps: ["Using Glob to find a function call site."]}
    ],
    ctx: [
      { title: "Preserving critical facts", points: [
        "Progressive summarization loses numbers, dates and IDs. Extract transactional facts (amounts, order IDs, statuses) into a persistent 'case facts' block included in every prompt.",
        "Trim verbose tool outputs to relevant fields before they accumulate (e.g. 40-field order record → 5 fields).",
        "Lost-in-the-middle: put key findings summaries at the beginning, use explicit section headers.",
        "Have subagents return structured data with metadata (dates, source locations) for downstream use."
      ], traps: ["Relying on a long transcript summary to preserve exact refund amounts."]},
      { title: "Escalation & ambiguity", points: [
        "Honor explicit requests for a human immediately.",
        "Escalate on policy gaps/exceptions (e.g. competitor price matching not in policy), not just complexity.",
        "Multiple matches for a customer → ask for an additional identifier; don't pick heuristically.",
        "Self-reported confidence and sentiment are unreliable escalation proxies."
      ], traps: ["Escalating every frustrated customer even when the issue is simple and solvable."]},
      { title: "Error propagation in multi-agent systems", points: [
        "Propagate structured error context: failure type, query attempted, partial results, alternatives.",
        "Don't silently suppress errors (return empty as success) or kill the whole workflow on one failure.",
        "Coordinator can proceed with partial results and annotate coverage gaps in the final output."
      ], traps: ["One subagent timeout aborts the whole research report."]},
      { title: "Large-codebase exploration", points: [
        "Context degrades in long sessions — the model references 'typical patterns' instead of the specific classes it found.",
        "Use scratchpad files to persist key findings; delegate verbose exploration to subagents; summarize before spawning next phase.",
        "/compact when context fills; on crash, resume from structured state manifests."
      ], traps: ["One giant session exploring 500 files."]},
      { title: "Human review & provenance", points: [
        "Aggregate accuracy (97%) can hide poor accuracy on specific document types/fields — analyze by segment before reducing human review.",
        "Stratified random sampling of high-confidence extractions to detect novel error patterns.",
        "Field-level confidence calibrated on labeled validation sets routes low-confidence items to review.",
        "Preserve claim→source mappings through synthesis; annotate conflicting sources with attribution instead of picking one arbitrarily; include publication dates to explain apparent contradictions."
      ], traps: ["Dropping source attribution during summarization."]}
    ]
  },

  questions: [
    // ---------- Agentic Architecture (27%) ----------
    { d:"arch", s:"Customer Support Resolution Agent", q:"Your support agent loop sometimes stops early, before a refund is processed. The loop exits as soon as the response contains any text block. What is the fix?", o:["Exit when the text contains 'resolved'","Continue while stop_reason is 'tool_use'; stop on 'end_turn'","Always run exactly 5 iterations","Remove text output from the system prompt"], a:[1], e:"Claude often emits text alongside tool_use. stop_reason is the reliable termination signal; a max-iteration cap is just a safety net." },
    { d:"arch", s:"Customer Support Resolution Agent", q:"Policy: refunds over $500 must be approved by a human. In testing, the agent occasionally processes $700 refunds despite a clear system prompt rule. Best fix?", o:["Capitalize the rule and add 'CRITICAL'","Add few-shot examples of refusing large refunds","Intercept process_refund deterministically (hook/code) and route amounts over $500 to human approval","Lower the model's effort"], a:[2], e:"Must-hold business rules need deterministic enforcement; prompts are probabilistic." },
    { d:"arch", s:"Customer Support Resolution Agent", q:"The agent sometimes calls process_refund before verify_customer has succeeded. Most reliable fix?", o:["Reorder tools in the tools array","Add a programmatic prerequisite gate that blocks process_refund until verification succeeded","Ask the model to 'always verify first'","Merge both tools into one"], a:[1], e:"A deterministic gate guarantees ordering of compliance-critical steps." },
    { d:"arch", s:"Multi-Agent Research System", q:"A web-search subagent produces off-topic results. Investigation shows its prompt is only 'Search for relevant sources.' The coordinator had extensive context about the user's goal. Root cause?", o:["The search tool is broken","Subagents don't inherit coordinator context; the coordinator must pass goal, scope and constraints explicitly","The model is too small","Too many parallel subagents"], a:[1], e:"Subagent context isolation: everything needed must be in the delegated prompt." },
    { d:"arch", s:"Multi-Agent Research System", q:"A report on 'impact of AI on creative industries' only covers visual arts, though each subagent did its job well. Where is the bug most likely?", o:["Synthesis agent formatting","The coordinator's task decomposition was too narrow","Search tool rate limits","Model temperature"], a:[1], e:"When every worker succeeded but coverage is missing, look at decomposition." },
    { d:"arch", s:"Multi-Agent Research System", q:"Four independent research subtopics are delegated one after another, making reports slow. What should the coordinator do?", o:["Use a bigger model","Spawn the subagents in parallel (multiple Task calls in a single response)","Merge all topics into one subagent","Remove the synthesis step"], a:[1], e:"Independent work should run in parallel." },
    { d:"arch", s:"Multi-Agent Research System", q:"How should subagents communicate in a hub-and-spoke design?", o:["Directly with each other via shared memory","Through the coordinator, which routes information and aggregates results","Through the end user","They shouldn't return results"], a:[1], e:"The coordinator mediates all communication — observability and consistent error handling." },
    { d:"arch", s:"Structured Data Extraction", q:"Three tools return dates as Unix timestamps, ISO strings and 'MM/DD/YY'. The agent miscompares dates. Best fix in an Agent SDK app?", o:["Explain all three formats in the system prompt","Use a PostToolUse hook to normalize dates before the model sees them","Ask the model to double-check dates","Remove two tools"], a:[1], e:"Deterministic normalization via hook beats prompt instructions." },
    { d:"arch", s:"Code Generation with Claude Code", q:"A PR changes 14 files. A single-pass review gives detailed feedback on some files and misses obvious bugs in others. Best restructuring?", o:["Use a larger context window","Per-file local analysis passes plus a separate cross-file integration pass","Require smaller PRs only","Run the same review 3 times and take the union"], a:[1], e:"Splitting avoids attention dilution while preserving cross-file checks." },
    { d:"arch", s:"Multi-Agent Research System", q:"A long research pipeline crashes at subagent 7 of 10. What design enables cheap recovery?", o:["Restart the full pipeline","Persist a structured manifest of completed subtasks and results; resume only unfinished work","Replay every full transcript into the coordinator","Increase timeouts"], a:[1], e:"Compact structured state lets you resume without bloating context or redoing work." },
    { d:"arch", s:"Customer Support Resolution Agent", q:"When escalating to a human agent, what should the agent pass?", o:["Nothing — the human reads the transcript","A structured handoff: customer ID, root cause, actions tried, amounts, recommended next step","Only the customer's last message","The system prompt"], a:[1], e:"Human agents often lack transcript access; a concise structured summary enables action." },
    { d:"arch", s:"Developer Productivity with Claude", q:"Which task is best handled with dynamic (orchestrator-style) decomposition rather than a fixed prompt chain?", o:["Always-the-same 3-aspect code review","'Add comprehensive tests to this legacy codebase' where needs emerge as you explore","Translating a fixed document","Formatting a CSV"], a:[1], e:"Open-ended tasks whose subtasks depend on findings fit dynamic decomposition." },
    { d:"arch", s:"Code Generation with Claude Code", q:"You want to compare two refactoring approaches from the same analyzed codebase state. Which feature fits?", o:["/clear and redo the analysis twice","Fork the session (e.g. fork_session) to explore divergent branches from a shared baseline","Use the Batch API","Plan mode only"], a:[1], e:"Forking reuses shared context and lets you explore alternatives independently." },
    { d:"arch", s:"Code Generation with Claude Code", q:"You resume a session from yesterday, but several files were modified since. Best practice?", o:["Resume and trust earlier tool results","Inform the resumed session which files changed (or start fresh with a summary) so it re-analyzes them","Delete the repository","Use --output-format json"], a:[1], e:"Stale tool results mislead; targeted re-analysis or a fresh session with summary is safer." },

    // ---------- Claude Code Config (20%) ----------
    { d:"ccw", s:"Developer Productivity with Claude", q:"A new teammate's Claude Code ignores the team's coding conventions, which work fine for the senior dev. Most likely cause?", o:["Different model","The conventions live in the senior dev's ~/.claude/CLAUDE.md (user scope), not the project CLAUDE.md","The repo is too large","Plan mode is on"], a:[1], e:"User-level files aren't shared via version control. Move team conventions to the project CLAUDE.md." },
    { d:"ccw", s:"Code Generation with Claude Code", q:"Test files are spread across many folders and need specific conventions. Best mechanism?", o:["A CLAUDE.md in every folder","A .claude/rules/ file with paths: ['**/*.test.tsx'] frontmatter","Put it in the root CLAUDE.md","A slash command"], a:[1], e:"Path-scoped rules apply by glob, regardless of directory, and only load when relevant." },
    { d:"ccw", s:"Developer Productivity with Claude", q:"Your root CLAUDE.md is 2,000 lines covering every domain. How do you keep it maintainable?", o:["Delete it","Split into topic files and @import them, or move topic-specific guidance to .claude/rules/","Move it to CLAUDE.local.md","Compress it into one paragraph"], a:[1], e:"Modular organization via @import and rules keeps context focused." },
    { d:"ccw", s:"Developer Productivity with Claude", q:"A long, rarely used procedure ('how to cut a release') is currently in CLAUDE.md and wastes context every session. Better home?", o:["A skill (.claude/skills/release/SKILL.md) or a project slash command invoked on demand","settings.json","A hook","The user prompt every time"], a:[0], e:"CLAUDE.md is always loaded; skills/commands load on demand." },
    { d:"ccw", s:"Developer Productivity with Claude", q:"A codebase-analysis skill produces very verbose output that clutters the main conversation. Which SKILL.md frontmatter helps?", o:["context: fork","model: haiku","color: red","priority: high"], a:[0], e:"context: fork runs the skill in an isolated sub-agent context and returns results without polluting the main session." },
    { d:"ccw", s:"Code Generation with Claude Code", q:"Which task should start in plan mode?", o:["Fix a typo in a README","Add a null check with a clear stack trace","Migrate a monolith's auth layer to a new service with dozens of affected files","Rename a local variable"], a:[2], e:"Plan mode fits large, multi-file, architectural changes with multiple valid approaches." },
    { d:"ccw", s:"Claude Code for Continuous Integration", q:"Your CI job running Claude Code hangs indefinitely. Most likely cause?", o:["Missing -p/--print flag, so it waits for interactive input","Wrong model","No CLAUDE.md","Too many tests"], a:[0], e:"Headless runs need -p." },
    { d:"ccw", s:"Claude Code for Continuous Integration", q:"You need CI findings posted as inline PR comments automatically. Which flags help?", o:["--verbose","--output-format json with --json-schema for structured findings","--interactive","--plan"], a:[1], e:"Structured JSON output is machine-parseable for posting comments." },
    { d:"ccw", s:"Claude Code for Continuous Integration", q:"On every new commit, CI review re-posts the same comments already addressed. Fix?", o:["Disable the review","Include prior review findings in the context and instruct it to report only new or still-unaddressed issues","Lower effort","Run review weekly"], a:[1], e:"Feed prior results to avoid duplicate comments." },
    { d:"ccw", s:"Claude Code for Continuous Integration", q:"Why use a separate Claude instance to review code that Claude generated?", o:["It's cheaper","An independent instance without the generator's reasoning context is more likely to catch its mistakes","It's required by the API","Generators can't read code"], a:[1], e:"Self-review in the same session tends to rationalize prior decisions." },
    { d:"ccw", s:"Claude Code for Continuous Integration", q:"Team wants to cut costs by moving (1) a blocking pre-merge check and (2) a nightly tech-debt report to the Message Batches API. Which is appropriate?", o:["Both","Only the nightly report","Only the pre-merge check","Neither"], a:[1], e:"Batches have no latency SLA (up to 24h) — fine for overnight jobs, not blocking workflows." },
    { d:"ccw", s:"Developer Productivity with Claude", q:"Where should a personal command that only you use live, without affecting teammates?", o:[".claude/commands/ in the repo","~/.claude/commands/","CLAUDE.md","package.json scripts"], a:[1], e:"User-scope commands are personal; project .claude/commands/ is shared." },
    { d:"ccw", s:"Code Generation with Claude Code", q:"Generated code keeps failing edge cases in a tricky transformation. Which technique most reliably converges?", o:["Ask it to try harder","Write tests first (including edge cases), then iterate by sharing failing test output","Raise max_tokens","Switch to plan mode"], a:[1], e:"Test-driven iteration gives concrete, verifiable feedback." },
    { d:"ccw", s:"Developer Productivity with Claude", q:"Requirements for a caching feature are unclear and the dev may not have considered invalidation. Which approach helps?", o:["Direct execution immediately","Interview pattern: have Claude ask clarifying questions before implementing","Batch API","Disable CLAUDE.md"], a:[1], e:"Interviewing surfaces design considerations before code is written." },

    // ---------- Prompt Engineering (20%) ----------
    { d:"pe", s:"Claude Code for Continuous Integration", q:"Your automated reviewer flags too many false positives. Developers start ignoring it. Best first step?", o:["Add 'only report high-confidence findings'","Define explicit report/skip criteria per category with examples, and temporarily disable the noisiest categories","Use a bigger model","Run it less often"], a:[1], e:"Vague confidence instructions don't fix precision; explicit criteria and examples do." },
    { d:"pe", s:"Structured Data Extraction", q:"Extraction sometimes returns malformed JSON. Most reliable fix?", o:["Ask for JSON in caps","Use tool use with a JSON schema / structured outputs","Post-process with regex","Lower max_tokens"], a:[1], e:"Schema-constrained output eliminates syntax errors." },
    { d:"pe", s:"Structured Data Extraction", q:"Schema-valid outputs still contain line items that don't sum to the stated total. What does this show?", o:["Schemas eliminate all errors","Schemas eliminate syntax errors, not semantic errors — add validation (and self-check fields) with retry","The model can't add","JSON is the wrong format"], a:[1], e:"Validate semantics separately." },
    { d:"pe", s:"Structured Data Extraction", q:"Many documents lack an 'invoice_due_date'. The model invents dates. Schema fix?", o:["Make the field required","Make it optional/nullable so the model can return null when absent","Add a default date","Remove the field and guess later"], a:[1], e:"Required fields encourage fabrication when info isn't present." },
    { d:"pe", s:"Structured Data Extraction", q:"A 'category' enum misses real-world cases. Best schema pattern?", o:["Free-text only","enum including 'other' plus a category_detail string","Enum with 200 values","Remove the field"], a:[1], e:"'other' + detail keeps structure while handling the long tail." },
    { d:"pe", s:"Structured Data Extraction", q:"Validation-retry isn't fixing some records. On inspection, the needed info is not in the document at all. What should you do?", o:["Retry more times","Stop retrying; return null/flag for human review — retries can't create missing information","Lower temperature","Switch models"], a:[1], e:"Retries help with format/structure errors, not absent data." },
    { d:"pe", s:"Customer Support Resolution Agent", q:"The agent handles ambiguous cases (partial refund vs replacement) inconsistently. Most effective prompt technique?", o:["Longer system prompt rules","2–4 few-shot examples of ambiguous cases showing the chosen action and reasoning","ALL CAPS rules","Higher effort only"], a:[1], e:"Targeted few-shot examples with reasoning teach generalizable judgment." },
    { d:"pe", s:"Structured Data Extraction", q:"With tool_choice set to 'auto', the model sometimes replies with text instead of calling the extract tool. What should you change?", o:["Nothing","Require tool use via the API's mechanism where supported, or use structured outputs (output_config.format) and steer from the prompt","Add more tools","Increase max_tokens"], a:[1], e:"auto allows text responses. Use the supported mechanism to guarantee structured output." },
    { d:"pe", s:"Structured Data Extraction", q:"Before batch-processing 100,000 documents, what's the recommended step?", o:["Run everything immediately","Refine and validate the prompt on a small representative sample first","Use the most expensive model","Remove validation to save time"], a:[1], e:"Iterate cheaply on a sample to maximize first-pass success." },
    { d:"pe", s:"Structured Data Extraction", q:"A batch of 10,000 finishes with 300 failures due to context limits on very long docs. Best action?", o:["Resubmit the full batch","Resubmit only failed custom_ids, chunking oversized documents","Ignore failures","Switch to synchronous calls for everything"], a:[1], e:"Target the failures by custom_id with a fix." },
    { d:"pe", s:"Structured Data Extraction", q:"Which requirement makes the Batch API a poor fit?", o:["Cost sensitivity","A workflow that needs multi-turn tool calling within a request","Large volume","Non-urgent results"], a:[1], e:"Batch requests are single-shot; you can't execute tools mid-request and continue." },

    // ---------- Tool Design & MCP (18%) ----------
    { d:"tools", s:"Customer Support Resolution Agent", q:"The agent calls get_customer when it should call lookup_order. Both descriptions are one line. First fix?", o:["Add a routing classifier","Expand descriptions: inputs, example queries, edge cases, and when to use each vs the other","Merge the tools","Few-shot every possible query"], a:[1], e:"Descriptions are the primary routing signal; fix them before adding machinery." },
    { d:"tools", s:"Multi-Agent Research System", q:"A generic analyze_document tool is used inconsistently for extraction, summarization and verification. Better design?", o:["Keep it, add more prompt rules","Split into purpose-specific tools (extract_data_points, summarize_content, verify_claim_against_source) with defined contracts","Remove it","Make it accept any parameters"], a:[1], e:"Purpose-specific tools reduce ambiguity." },
    { d:"tools", s:"Customer Support Resolution Agent", q:"A refund tool fails because the order is outside the return window. What should the tool return?", o:["Generic 'Operation failed'","A structured error: category=business, isRetryable=false, with a customer-friendly explanation","An empty success response","Retry automatically 5 times"], a:[1], e:"Structured, non-retryable business errors let the agent explain and move on." },
    { d:"tools", s:"Multi-Agent Research System", q:"A search subagent returns an empty list when the search API actually timed out. Problem?", o:["None","It conflates access failure with a valid empty result, so the coordinator can't decide to retry or annotate gaps","Empty lists are always errors","It should crash the system"], a:[1], e:"Distinguish 'no matches' from 'couldn't search'." },
    { d:"tools", s:"Multi-Agent Research System", q:"A synthesis agent has access to 18 tools and frequently picks wrong ones. Fix?", o:["Add more tools","Restrict it to the 4–5 tools relevant to its role (e.g. plus a narrow verify_fact tool)","Use a bigger model","Remove the system prompt"], a:[1], e:"Fewer, role-scoped tools improve selection reliability." },
    { d:"tools", s:"Developer Productivity with Claude", q:"Your team needs a shared Jira MCP server; the API token must not be committed. Correct config?", o:["Token hard-coded in ~/.claude.json","Project .mcp.json using ${JIRA_TOKEN} env var expansion","CLAUDE.md with the token","Tell each dev to type it in chat"], a:[1], e:"Project scope for sharing; env vars for secrets." },
    { d:"tools", s:"Developer Productivity with Claude", q:"You need a standard GitHub integration. Build or reuse?", o:["Always build your own MCP server","Use an existing community/official MCP server; reserve custom servers for team-specific workflows","Use bash curl only","Use a skill"], a:[1], e:"Don't reinvent standard integrations." },
    { d:"tools", s:"Code Generation with Claude Code", q:"You need to find every place a function processRefund is called. Which built-in tool?", o:["Glob","Grep","Write","Edit"], a:[1], e:"Grep searches file contents; Glob matches file paths." },
    { d:"tools", s:"Code Generation with Claude Code", q:"You need all files named *.test.tsx anywhere in the repo. Which built-in tool?", o:["Grep","Glob","Read","Bash cat"], a:[1], e:"Glob matches path patterns." },
    { d:"tools", s:"Code Generation with Claude Code", q:"Edit fails because the anchor text appears several times in the file. Fallback?", o:["Give up","Read the file and Write the full modified content (or use a longer unique anchor)","Use Glob","Delete the file"], a:[1], e:"Edit needs a unique match; otherwise Read + Write." },
    { d:"tools", s:"Developer Productivity with Claude", q:"Agents waste many calls exploring which Jira issues exist. Which MCP primitive helps?", o:["Prompts","Resources exposing a catalog of issue summaries","More tools","Hooks"], a:[1], e:"Resources give the agent visibility into available data without exploratory calls." },

    // ---------- Context Management (15%) ----------
    { d:"ctx", s:"Customer Support Resolution Agent", q:"After long conversations, the agent mis-states the refund amount discussed earlier. History is progressively summarized. Fix?", o:["Summarize more aggressively","Keep a persistent 'case facts' block (amounts, order IDs, dates) outside the summarized history in every prompt","Increase effort","Shorter system prompt"], a:[1], e:"Summaries lose exact values; persist transactional facts explicitly." },
    { d:"ctx", s:"Customer Support Resolution Agent", q:"Order lookups return 40+ fields; only 5 matter. Context fills quickly. Fix?", o:["Larger context model","Trim tool outputs to relevant fields before adding them to context","Delete the system prompt","Use the Batch API"], a:[1], e:"Trim verbose outputs at the source." },
    { d:"ctx", s:"Customer Support Resolution Agent", q:"A customer writes: 'I want to talk to a human.' The issue looks simple. What should the agent do?", o:["Try to resolve it first anyway","Honor the request and escalate immediately with a handoff summary","Ask why","Analyze sentiment first"], a:[1], e:"Explicit requests for a human should be honored." },
    { d:"ctx", s:"Customer Support Resolution Agent", q:"Which is the BEST escalation trigger?", o:["Negative sentiment score","Model's self-reported confidence below 0.5","Policy gap or exception not covered by documented policy (e.g. competitor price match)","Message length"], a:[2], e:"Sentiment and self-reported confidence are unreliable proxies for case complexity." },
    { d:"ctx", s:"Customer Support Resolution Agent", q:"Customer lookup by name returns three matching accounts. Correct behaviour?", o:["Pick the most recent","Pick the one with most orders","Ask the customer for an additional identifier (email, order number)","Escalate immediately"], a:[2], e:"Don't choose heuristically when identification is ambiguous." },
    { d:"ctx", s:"Multi-Agent Research System", q:"One of five research subagents times out. Best coordinator behaviour?", o:["Abort the whole report","Silently omit the topic","Proceed with partial results, retry if useful, and annotate the coverage gap in the output","Pretend results exist"], a:[2], e:"Graceful degradation with explicit gaps." },
    { d:"ctx", s:"Multi-Agent Research System", q:"The final report contains claims with no traceable source after synthesis. Fix?", o:["Ask the synthesizer to remember sources","Require subagents to output structured claim→source mappings (URL, excerpt, date) that synthesis must preserve","Drop citations","Use one agent"], a:[1], e:"Provenance must be carried as structured data through each stage." },
    { d:"ctx", s:"Multi-Agent Research System", q:"Two credible sources report different market-size numbers. What should the report do?", o:["Pick the larger","Average them","Present both with attribution (and dates/methodology), flagging the conflict","Omit the stat"], a:[2], e:"Annotate conflicts rather than arbitrarily resolving them." },
    { d:"ctx", s:"Code Generation with Claude Code", q:"In a long exploration session, Claude starts referring to 'typical patterns' rather than the specific classes it found earlier. Best mitigation?", o:["Keep going","Persist key findings in a scratchpad file, delegate verbose exploration to subagents, and /compact or restart with a summary","Raise max_tokens","Switch to Batch API"], a:[1], e:"Context degradation in long sessions; externalize state and isolate verbose work." },
    { d:"ctx", s:"Structured Data Extraction", q:"Extraction accuracy is 97% overall, so the team wants to remove human review entirely. What should you check first?", o:["Nothing — 97% is great","Accuracy by document type and field; aggregate metrics can hide weak segments","The model version","Average latency"], a:[1], e:"Segment analysis before reducing review; then use stratified sampling to monitor." },
    { d:"ctx", s:"Structured Data Extraction", q:"How should you route extractions for human review efficiently?", o:["Review a random 1% only","Use field-level confidence calibrated on a labeled validation set, routing low-confidence or ambiguous items to humans, plus stratified sampling of high-confidence ones","Review everything forever","Trust the model's self-reported confidence uncalibrated"], a:[1], e:"Calibrated confidence + sampling balances cost and quality." },
    { d:"ctx", s:"Multi-Agent Research System", q:"Where should the most important findings go in a very long aggregated input to the synthesizer?", o:["Buried in the middle","At the beginning, with explicit section headers","Only at the end of each document","Omitted to save tokens"], a:[1], e:"Mitigate lost-in-the-middle effects by placing key summaries first with clear structure." }
  ],

  labs: [
    { title: "Scenario lab — Customer Support Resolution Agent", domain:"arch", time:"90 min", tasks:[
      "Build tools: get_customer, lookup_order, process_refund, escalate_to_human — with rich descriptions.",
      "Add a deterministic gate: process_refund blocked until get_customer verified the customer.",
      "Add a policy hook: refunds > $500 → escalate_to_human with a structured handoff summary.",
      "Return structured errors {errorCategory, isRetryable, message}.",
      "Maintain a 'case facts' block (customer ID, order ID, amounts) injected each turn."
    ], check:["Loop terminates on stop_reason","$700 refund is never processed automatically","Explicit 'human please' escalates immediately"], solution:"Code-level check in your tool executor: if name=='process_refund' and (not state.verified or input.amount > 500) → return structured error / trigger escalation. Never rely on the prompt alone." },
    { title: "Scenario lab — Multi-Agent Research System", domain:"arch", time:"120 min", tasks:[
      "Coordinator decomposes a topic into 4 subtopics (review decomposition for coverage).",
      "Spawn search subagents in parallel, each with explicit goal/scope/output format in its prompt.",
      "Subagents return [{claim, source_url, excerpt, date}] and structured errors on failure.",
      "Synthesizer preserves claim→source mapping and annotates conflicts and coverage gaps.",
      "Persist a manifest so a crash resumes only unfinished subtopics."
    ], check:["Parallel execution","Every claim cites a source","Timeout of one subagent doesn't abort the report"], solution:"Design data contracts first (JSON schemas between stages). Coordinator owns routing, retries and gap annotation." },
    { title: "Scenario lab — Claude Code team setup", domain:"ccw", time:"60 min", tasks:[
      "Project CLAUDE.md with @imports for standards; .claude/rules/tests.md with paths: ['**/*.test.*'].",
      "Shared .mcp.json for GitHub using ${GITHUB_TOKEN}.",
      "A project slash command /review and a skill with context: fork for codebase analysis.",
      "A hook that runs the formatter after Edit/Write.",
      "Verify with /memory what's loaded."
    ], check:["Teammate clone gets same behaviour","No secret committed","Rules load only for test files"], solution:"Keep personal prefs in ~/.claude/ and CLAUDE.local.md; team config in the repo." },
    { title: "Scenario lab — Claude Code in CI", domain:"ccw", time:"60 min", tasks:[
      "GitHub Action running claude -p with --output-format json and a --json-schema for findings.",
      "Post findings as inline PR comments; include previous findings to avoid duplicates.",
      "Use a separate review run, not the generating session.",
      "Move the nightly debt report (not the pre-merge check) to the Batch API."
    ], check:["Job never hangs","Output parsed without regex","Pre-merge stays synchronous"], solution:"claude -p \"Review the diff for ...\" --output-format json --json-schema schema.json > findings.json" },
    { title: "Scenario lab — Structured Data Extraction", domain:"pe", time:"90 min", tasks:[
      "Schema with nullable fields, enum+'other'+detail, and calculated_total vs stated_total.",
      "Few-shot examples for 3 different document layouts.",
      "Validation-retry loop with specific errors; stop when info is absent.",
      "Batch 500 docs; resubmit failures by custom_id with chunking.",
      "Measure accuracy per document type and per field; design sampling for review."
    ], check:["No fabricated due dates","Retries capped","Per-segment accuracy report"], solution:"Validation → targeted retry → human queue for low confidence; stratified sampling for high-confidence outputs." },
    { title: "Scenario lab — Developer Productivity", domain:"tools", time:"45 min", tasks:[
      "Explore an unfamiliar repo: Grep for entry points, Glob for test files, Read to trace imports.",
      "Use an Explore subagent for verbose discovery; save findings to a scratchpad file.",
      "Write a skill for a recurring workflow (e.g. generating a changelog)."
    ], check:["Main context stays small","Findings survive /compact"], solution:"Incremental exploration beats reading everything; externalize state to files." }
  ]
};
