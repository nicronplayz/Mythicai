// ==============================
// MythicAi – app.js
// ==============================

// 🔗 Backend URL
const WORKER_URL = "https://autumn-wue.killermunu.workers.dev/";

// 🧠 Load conversation from localStorage (persistent)
let conversation = JSON.parse(
  localStorage.getItem("mythicai_conversation")
) || [];

// 🎛 Mode system prompts
const modePrompts = {
  general:
    "You are MythicAi. Professional, friendly, chill.",
  study:
    "You are MythicAi in study mode. Explain concepts clearly with simple examples.",
  coding:
    "You are MythicAi in coding mode. Write clean, correct code with brief explanations.",
  editing:
    "You are MythicAi in editing mode. Help with CapCut, motion blur, effects, and workflows."
};

// 🔁 Restore messages on page load
function restoreMessages() {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  conversation.forEach(msg => {
    if (msg.role === "user") {
      messagesDiv.innerHTML +=
        `<div class="msg user">${msg.content}</div>`;
    }
    if (msg.role === "assistant") {
      messagesDiv.innerHTML +=
        `<div class="msg ai">${msg.content}</div>`;
    }
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 💾 Save conversation
function saveConversation() {
  localStorage.setItem(
    "mythicai_conversation",
    JSON.stringify(conversation)
  );
}

// 🚀 Send message
async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  const messagesDiv = document.getElementById("messages");
  const mode = document.getElementById("mode").value;

  // UI: show user message
  messagesDiv.innerHTML +=
    `<div class="msg user">${text}</div>`;
  messagesDiv.innerHTML +=
    `<div class="msg ai typing" id="typing">MythicAi is thinking…</div>`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // 🧠 Add system prompt once
  if (!conversation.some(m => m.role === "system")) {
    conversation.unshift({
      role: "system",
      content: modePrompts[mode]
    });
  }

  // Add user message
  conversation.push({ role: "user", content: text });
  saveConversation();

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation })
    });

    const data = await res.json();
    document.getElementById("typing")?.remove();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    // Save AI reply
    conversation.push({
      role: "assistant",
      content: reply
    });
    saveConversation();

    // UI: show AI reply
    messagesDiv.innerHTML +=
      `<div class="msg ai">${reply}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  } catch (err) {
    document.getElementById("typing")?.remove();
    messagesDiv.innerHTML +=
      `<div class="msg ai">⚠️ Error connecting to MythicAi.</div>`;
  }
}

// ⌨ Enter key support
document.addEventListener("DOMContentLoaded", () => {
  restoreMessages();

  document
    .getElementById("input")
    .addEventListener("keydown", e => {
      if (e.key === "Enter") send();
    });
});

// 🧹 Optional: clear chat
function clearChat() {
  localStorage.removeItem("mythicai_conversation");
  conversation = [];
  restoreMessages();
}
