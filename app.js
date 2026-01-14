// ==============================
// MythicAi – app.js (REALISTIC)
// ==============================

const WORKER_URL = "https://autumn-wue.killermunu.workers.dev/";

let conversation = JSON.parse(
  localStorage.getItem("mythicai_conversation")
) || [];

let isGenerating = false;
let stopGeneration = false;

// 🎛 Modes
const modePrompts = {
  general: "You are MythicAi. Professional, friendly, chill.",
  study: "You are MythicAi in study mode. Explain clearly with examples.",
  coding: "You are MythicAi in coding mode. Give clean, correct code.",
  editing: "You are MythicAi in editing mode. Help with CapCut, motion blur, workflows."
};

// 🔁 Restore chat
function restoreMessages() {
  const messages = document.getElementById("messages");
  messages.innerHTML = "";

  conversation.forEach(m => {
    if (m.role === "user")
      messages.innerHTML += `<div class="msg user">${m.content}</div>`;
    if (m.role === "assistant")
      messages.innerHTML += `<div class="msg ai">${m.content}</div>`;
  });

  messages.scrollTop = messages.scrollHeight;
}

function saveConversation() {
  localStorage.setItem(
    "mythicai_conversation",
    JSON.stringify(conversation)
  );
}

// 🧹 New chat
function newChat() {
  stopGeneration = true;
  conversation = [];
  localStorage.removeItem("mythicai_conversation");
  restoreMessages();
}

// 🟦 Cursor dot
function createCursor() {
  const cursor = document.createElement("span");
  cursor.textContent = "●";
  cursor.style.marginLeft = "4px";
  cursor.style.color = "#7dd3fc";
  cursor.style.opacity = "0.8";
  cursor.className = "cursor-dot";
  return cursor;
}

// ✍️ REAL typing engine (word-based)
async function typeLikeHuman(element, text) {
  isGenerating = true;
  stopGeneration = false;

  const words = text.split(" ");
  element.innerHTML = "";

  const cursor = createCursor();
  element.appendChild(cursor);

  // 🧠 thinking delay
  await sleep(500 + Math.random() * 600);

  for (let i = 0; i < words.length; i++) {
    if (stopGeneration) break;

    const word = words[i];
    element.insertBefore(
      document.createTextNode(word + " "),
      cursor
    );

    element.scrollIntoView({ block: "end", behavior: "smooth" });

    // ⏱ human pauses
    let delay = 60 + Math.random() * 90;

    if (/[.,!?]$/.test(word)) delay += 200;
    if (word.length > 8) delay += 80;

    await sleep(delay);
  }

  cursor.remove();
  isGenerating = false;
}

// 💤 helper
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// 🚀 Send
async function send() {
  if (isGenerating) return;

  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  const messages = document.getElementById("messages");
  const mode = document.getElementById("mode").value;

  messages.innerHTML += `<div class="msg user">${text}</div>`;
  messages.scrollTop = messages.scrollHeight;

  if (!conversation.some(m => m.role === "system")) {
    conversation.unshift({
      role: "system",
      content: modePrompts[mode]
    });
  }

  conversation.push({ role: "user", content: text });
  saveConversation();

  // AI bubble
  const aiBubble = document.createElement("div");
  aiBubble.className = "msg ai";
  messages.appendChild(aiBubble);

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation })
    });

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "I couldn’t generate a response.";

    await typeLikeHuman(aiBubble, reply);

    conversation.push({ role: "assistant", content: reply });
    saveConversation();

  } catch (e) {
    aiBubble.textContent = "⚠️ Connection error.";
  }
}

// ⌨️ Enter key
document.addEventListener("DOMContentLoaded", () => {
  restoreMessages();

  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
});
