// The only file that talks to the LLM provider.
// The provider, the model and the key come from .env:
//   process.env.LLM_BASE_URL, process.env.LLM_MODEL, process.env.LLM_API_KEY

// TODO P4: make a constant SYSTEM here: the rules for every answer (tone, length, format).
//          Then send it as the first message, before the user's message, in ask().
const SYSTEM = '답변에는 마크다운과 관련된 기호를 사용하지 않고 텍스트만을 이용하며, 말투는 "~해요"로 끝내는 존댓말을 사용한다. 답의 길이는 줄바꿈 없는 한 문단, 세 문장 이내.'

const SYSTEM_JSON = `사용자가 보낸 상품 후기를 분석해서 JSON 객체 하나로만 답한다. JSON 앞뒤에 다른 글이나 코드 블록 표시를 붙이지 않는다.
키는 정확히 sentiment, score, summary 세 개만 쓴다.
sentiment 는 "positive", "negative", "neutral" 중 하나의 문자열이다.
score 는 1 이상 5 이하의 정수 숫자다. 따옴표나 "점" 같은 글자를 붙이지 않는다.
summary 는 후기를 요약한 한 문장의 문자열이다.`;

async function complete(messages, extra = {}) {
  const res = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: process.env.LLM_MODEL, messages, ...extra }),
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
  const content = await complete(
    [
      { role: "system", content: SYSTEM_JSON },
      { role: "user", content: text },
    ],
    { response_format: { type: "json_object" } },
  );

  const { sentiment, score, summary } = JSON.parse(content) ?? {};

  const ok =
    ["positive", "negative", "neutral"].includes(sentiment) &&
    Number.isInteger(score) && score >= 1 && score <= 5 &&
    typeof summary === "string";
  if (!ok) throw new Error("LLM: the answer has the wrong shape");

  return { sentiment, score, summary };
}