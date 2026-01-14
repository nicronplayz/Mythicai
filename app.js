const WORKER_URL = "https://autumn-wue.killermunu.workers.dev/";

let conversation = JSON.parse(
  localStorage.getItem("mythicai_conversation")
) || [];

// ------------------
// Restore chat
// ------------------
function restoreMessages() {
  const messages = document.getElementById("messages");
  messages.innerHTML = "";

  conversation.forEach(m => {
    messages.innerHTML +=
      `<div class="msg ${m.role === "user" ? "user" : "ai"}">${m.content}</div>`;
  });

  messages.scrollTop = messages.scrollHeight;
}

// ------------------
// Send message (STREAM)
// ------------------
async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  const messagesDiv = document.getElementById("messages");

  messagesDiv.innerHTML += `<div class="msg user">${text}</div>`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  conversation.push({ role: "user", content: text });

  const aiBubble = document.createElement("div");
  aiBubble.className = "msg ai";
  messagesDiv.appendChild(aiBubble);

  const cursor = document.createElement("span");
  cursor.textContent = "●";
  cursor.style.color = "#7dd3fc";
  cursor.style.marginLeft = "4px";
  aiBubble.appendChild(cursor);

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: conversation })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      if (line.includes("[DONE]")) continue;

      try {
        const json = JSON.parse(line.replace("data:", "").trim());
        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          fullText += token;
          cursor.insertAdjacentText("beforebegin", token);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      } catch {}
    }
  }

  cursor.remove();

  conversation.push({ role: "assistant", content: fullText });
  localStorage.setItem(
    "mythicai_conversation",
    JSON.stringify(conversation)
  );
}

// ------------------
document.addEventListener("DOMContentLoaded", () => {
  restoreMessages();
  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
});
