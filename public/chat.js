// P5: a conversation. The page keeps the list of messages
// and sends ALL of it to our server every time.

const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const sendButton = document.querySelector("#send");
const resetButton = document.querySelector("#reset");
const statusEl = document.querySelector("#status");
const logEl = document.querySelector("#log");

// The conversation so far, oldest first:
//   [{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...]
const history = [];

// Draws the page from history. Nothing else is shown.
function render() {
  logEl.replaceChildren(
    ...history.map((message) => {
      const li = document.createElement("li");
      li.className = message.role;
      const who = document.createElement("span");
      who.className = "who";
      who.textContent = message.role === "user" ? "You" : "Model";
      const text = document.createElement("span");
      text.className = "text";
      // Text written by a model: treat it like text from a stranger. Never innerHTML.
      text.textContent = message.content;
      li.append(who, text);
      return li;
    }),
  );
}

async function chatServer(messages) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data.answer;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  const started = Date.now();

  // TODO P5 (1): add the visitor's message to history.
  history.push({ role: "user", content: question });


  render();
  questionInput.value = "";
  sendButton.disabled = true; // one message at a time
  statusEl.classList.remove("error");
  statusEl.textContent = `Sending ${history.length} message(s)...`;

  try {
    const sent = history.length;
    const answer = await chatServer(history);

    // TODO P5 (2): add the model's answer to history.
    history.push({ role: "assistant", content: answer });


    statusEl.textContent = `Sent ${sent} message(s). Answered in ${((Date.now() - started) / 1000).toFixed(1)} s.`;
  } catch (err) {
    // The question got no answer: take it back out, so the list stays user, assistant, user, ...
    if (history.at(-1)?.role === "user") history.pop();
    questionInput.value = question;
    statusEl.textContent = `Could not get an answer (${err.message}).`;
    statusEl.classList.add("error");
  } finally {
    render();
    sendButton.disabled = false;
    questionInput.focus();
  }
});

resetButton.addEventListener("click", () => {
  history.length = 0; // forget everything
  statusEl.textContent = "";
  render();
});
