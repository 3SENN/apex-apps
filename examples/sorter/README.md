# Sorter

A tool app on quick decisions: paste messages, one per line, and each gets a
topic and an urgency. It acts only when the answer is sure, and says "unsure"
instead of guessing.

What it shows:

- `permissions.model`: `atelier.ai.decide` with two typed questions per
  message. `topic` is a `choice` (billing, bug, question or other, each with a
  description or `null`). `urgency` is a `score` on three steps: Can wait,
  Today, Right now.
- No text is written. On the person's decision model (Settings › Quick
  decisions) an answer takes about a tenth of a second. Without one, their
  Claude engine answers.
- `source` says which one answered. The sorter trusts a topic at 75% from a
  decision model and at 85% from Claude, whose estimates are less calibrated.
  An urgency with less than 50% confidence shows as unsure.
- Every refusal (no engine set up, the budget) shows as a sentence on that
  message's row, so the person is never stuck.
- Rows are text (`textContent`), never HTML.
- `atelier.test?.ready({ sorted })` after each run for Atelier's playtest.

The review lists: "Can ask your Claude model one-off questions, which counts
toward your usage" and "Adds an app: Sorter".

## Try it

1. Packs › **Load a folder…**, pick this folder, install.
2. Open **Sorter**, paste a few messages and press **Sort**:

```
I was charged twice this month
The export button does nothing
How do I change my email address?
```

## What to read

- `app/main.js`: the two questions (`TOPICS` and `URGENCY`), the call and the
  cutoffs. Change the questions into yours: up to 20 per call, and `noul` for
  yes or no. See [ai.md](../../docs/ai.md#quick-decisions-decide).

## Gotchas

- Each line is one call, and the sorter takes the first 20 lines per press.
  On a decision model, `decide` has its own budget: 600 calls an hour and
  5,000 a day. On Claude, each call counts toward the pack's model budget:
  60 calls an hour and 500 a day.
- A decision model that can't be reached, or is rate-limited, hands the call
  to Claude, which counts as a model call. Check `source` on every answer, not
  once.
- A `score` counts its steps from 0 and can land between two: the sorter
  rounds it to name a step.
- In Atelier's playtest, a pack not yet allowed the model gets `null` from
  `decide`. The sorter shows "no answer" on that row.

## Files

```
atelier-pack.json
app/index.html   the entry page (links Atelier UI first)
app/main.js      the questions, the calls and the rows
app/style.css
```
