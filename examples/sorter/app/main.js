// A sorter on Atelier's quick decisions (atelier.ai.decide): one line per message,
// each gets a topic and an urgency with how sure the model is. No text is
// written, so it runs in about a tenth of a second on the person's decision
// model, or on their Claude engine when they have none. Unsure answers are
// shown as unsure instead of guessed.
const TOPICS = { billing: 'Payments, invoices, refunds', bug: 'Something is broken or not working', question: 'A question about how something works', other: null }
const URGENCY = ['Can wait', 'Today', 'Right now']
const app = document.getElementById('app')
app.className = 'ax-app'
app.innerHTML = '<div class="ax-stack"><div class="ax-field"><label class="ax-label" for="in">Messages, one per line</label><textarea class="ax-textarea" id="in"></textarea></div><div class="ax-cluster"><button class="ax-btn ax-btn--accent" id="go" type="button">Sort</button></div><ul id="out" class="sorted" aria-live="polite"></ul></div>'
const input = document.getElementById('in')
const out = document.getElementById('out')
const go = document.getElementById('go')
const pct = (p) => Math.round(p * 100) + '%'
go.addEventListener('click', async () => {
  const lines = input.value.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20)
  if (!lines.length) return input.focus()
  go.disabled = true
  out.textContent = ''
  let sorted = 0
  for (const line of lines) {
    const row = document.createElement('li')
    row.textContent = line + ' …'
    out.append(row)
    try {
      const result = await atelier.ai.decide(line, {
        topic: { type: 'choice', instructions: 'What is this message about?', criteria: TOPICS },
        urgency: { type: 'score', instructions: 'How soon does it need an answer?', criteria: URGENCY },
      })
      // In Atelier's playtest, a pack not yet allowed the model gets null.
      if (!result) {
        row.textContent = line + ' → no answer'
        continue
      }
      const { answers, source } = result
      // Claude's own estimates are less calibrated than a decision model's: ask for more before trusting them.
      const sure = source === 'model' ? 0.75 : 0.85
      const topicP = answers.topic.probabilities[answers.topic.choice]
      const topic = topicP >= sure ? answers.topic.choice + ' (' + pct(topicP) + ')' : 'unsure'
      const level = Math.round(answers.urgency.score)
      row.textContent = line + ' → ' + topic + ', ' + (answers.urgency.confidence >= 0.5 ? URGENCY[level] : 'urgency unsure')
      sorted++
    } catch (err) {
      row.textContent = line + ' → ' + err.message
    }
  }
  go.disabled = false
  atelier.test?.ready({ sorted })
})
atelier.test?.ready({ sorted: 0 })
