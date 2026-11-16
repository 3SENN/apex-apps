# Apex as the AI engine

With `permissions.model`, your app calls the model through `apex.ai`. Calls
run on the engine the person chose in Apex: their own API key, or their
Claude Code sign-in. Your app ships no key and runs no server for it, and the
person always knows whose account pays: the review says the pack "can ask
your Claude model one-off questions, which counts toward your usage".

## Tiers, not models

Ask for a tier: `"fast"` (the default) or `"smart"`. Apex maps tiers to models,
so your app keeps working when models change. A model name isn't accepted.

## Calls

```js
// Text
const text = await apex.ai.ask('Suggest a name for a cosy café.', { tier: 'fast', maxTokens: 200 })

// A value that fits a JSON Schema
const plan = await apex.ai.json('Plan a three-step warm-up for table tennis.', {
  schema: {
    type: 'object',
    properties: { steps: { type: 'array', items: { type: 'string' }, maxItems: 3 } },
    required: ['steps'],
  },
})

// The reply as it arrives
const all = await apex.ai.stream('Tell a two-line story about a lighthouse.', {
  onText: (piece) => (out.textContent += piece),
})

// A conversation with your own tools
const session = apex.ai.session({
  system: 'You narrate a short, kind adventure. Use roll_dice when luck decides.',
  tier: 'smart',
  tools: [{
    name: 'roll_dice',
    description: 'Rolls a six-sided die.',
    input: { type: 'object', properties: {} },
    run: () => 1 + Math.floor(Math.random() * 6),
  }],
})
const reply = await session.send('I open the door.')
session.history() // the conversation so far, kept in your page
session.close()
```

- `ask(prompt, { system, tier, maxTokens })` resolves to text.
- `json(prompt, { schema, system, tier, maxTokens })` resolves to a value
  checked against the schema; Apex asks once more when the first answer
  doesn't fit.
- `stream(prompt, { onText, system, tier, maxTokens })` calls `onText` with
  each piece and resolves to the whole reply. With an API key the pieces
  arrive as the model writes; on Claude Code the reply comes in one piece.
- `session({ system, tier, tools })` keeps a conversation. When the model calls
  one of your tools, its `run(input)` runs in your page and the answer goes
  back to the model. Up to 8 tool rounds per message, up to 20 tools, tool
  names `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$`. The history has the same shape on
  both engines, so a session carries over if the person switches.
- A session has your tools and nothing else: no browser, no memory, no
  connectors, no companion persona.

Limits: prompt up to 50,000 characters, `system` up to 8,000, `maxTokens` 1 to
8,000 (default 2,000).

## Quick decisions: `decide`

`decide` answers typed questions about a piece of text with probabilities and
writes no text. Use it to sort, route or score things, where a written reply
would be wasted.

```js
const { answers, source } = await apex.ai.decide(message, {
  topic: {
    type: 'choice',
    instructions: 'What is this message about?',
    criteria: { billing: 'Payments, invoices, refunds', bug: 'Something is broken', other: null },
  },
  urgency: { type: 'score', instructions: 'How soon does it need an answer?', criteria: ['Can wait', 'Today', 'Right now'] },
  angry: { type: 'noul', instructions: 'Is the writer upset?' },
})
// Claude's own estimates are less calibrated than a decision model's: ask for more.
const sure = source === 'model' ? 0.75 : 0.85
const topic = answers.topic.probabilities[answers.topic.choice] >= sure ? answers.topic.choice : null
```

- `state` is text up to 24,000 characters, or a JSON object.
- Up to 20 questions per call, keyed by a name like `topic`. Each has
  `instructions` (up to 1,000 characters) and a `type`:
  - `noul`: yes or no. The answer is `{ noul }`, the probability of yes.
    `criteria` may say what `true` and `false` mean.
  - `choice`: one of 2 to 64 options. `criteria` maps each option to a
    description (or `null`). The answer is `{ choice, confidence,
    probabilities }`.
  - `score`: a level on a scale of 2 to 10 steps, `criteria` naming each
    step. The answer is `{ score, confidence, probabilities }`.
- `source` is `"model"` when the person's decision model answered (Settings ›
  Quick decisions, in about a tenth of a second), or `"claude"` when their
  Claude engine did. Act only when an answer is sure, and treat Claude's
  answers more strictly.
- On a decision model, `decide` has its own budget: 600 calls an hour and
  5,000 a day. On Claude, each call counts against the model budget below.

`apex.ask(prompt, { system })` is the older one-shot call (prompt up to 20,000
characters). It counts the same way; prefer `apex.ai` in new code.

## The budget

Every model call of a pack counts: `apex.ai.*`, `apex.ask`, `apex.cast.speak`
and each round of a session. A pack may make **60 calls an hour and 500 a
day**. Past that, the call rejects with a sentence such as "A pack can use the
model 60 times an hour."

- Catch every call and show the message where the person is looking.
- Don't call the model on a timer or in a loop the person didn't start.
- Batch: one `json()` call that returns ten items beats ten calls.
- Cache answers you can reuse (`apex.storage`, IndexedDB).

## When there is no model

A call can also fail because the person hasn't set up an engine, or the
model is unreachable. Treat it like the budget: a message and a way to try
again, never a blank screen.

In Apex's playtest (`test_pack`, which companions use when they build or
remix your app), model calls return stand-ins unless an installed version of
the pack may already use the model: `ai.json` and `ai.decide` return `null`,
the others a short text. Check what you get before you use it.

## Organisations

An organisation can send every pack's model calls to its own gateway (the
`AiProvider` policy). Your code doesn't change: the same calls, tiers and
budget, answered by the organisation's models. See
[organisations.md](organisations.md#aiprovider).

## Treat model output as data

- Put it in the page as text (`textContent`), never as HTML (`innerHTML`) and
  never as code (`eval`, `new Function`).
- Check structured answers before you use them, even from `json()`.
- What the model reads can steer it. Text from a file, a web API or another
  player is material, not instructions: say so in `system`, and wrap it in
  markers (`<text>…</text>`).
- A session can reach only your own tools, so make each tool do one safe
  thing. Ask the person before a tool does something they would want to
  approve.
