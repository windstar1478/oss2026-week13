// The only file that talks to the LLM provider.
// The provider, the model and the key come from .env:
//   process.env.LLM_BASE_URL, process.env.LLM_MODEL, process.env.LLM_API_KEY

// TODO P4: make a constant SYSTEM here: the rules for every answer (tone, length, format).
//          Then send it as the first message, before the user's message, in ask().
const SYSTEM = '답변에는 마크다운과 관련된 기호를 사용하지 않고 텍스트만을 이용하며, 말투는 "~해요"로 끝내는 존댓말을 사용한다. 답의 길이는 줄바꿈 없는 한 문단, 세 문장 이내.'

async function complete(messages) {
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: process.env.LLM_MODEL, messages }),
  });
  if (!res.ok) throw new Error(`LLM: HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ask("a question")  ->  the model's answer, as a string
export async function ask(question) {
  return complete([
    { role: "system", content: SYSTEM },
    { role: "user", content: question },
  ]);
}

// chat([{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...])
//   ->  the model's next answer, as a string
export async function chat(history) {
  return complete([{ role: "system", content: SYSTEM }, ...history]);
}

// analyze("a review")  ->  an object, not a sentence:
//   { sentiment: "positive" | "negative" | "neutral", score: 1..5, summary: "one short sentence" }
export async function analyze(text) {
  // TODO P6: write this function (see problems/P6_json.md). Delete the throw line below.
  throw new Error("analyze() is not written yet");
}