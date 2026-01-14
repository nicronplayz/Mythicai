// ==============================
// MythicAi – app.js (FINAL FIX)
// ==============================

const WORKER_URL = "https://autumn-wue.killermunu.workers.dev/";

// Load saved conversation
let conversation = JSON.parse(
  localStorage.getItem("mythicai_conversation")
) || [];

let isGenerating = false;
let stopGeneration = false;

// Modes
const modePrompts = {
  general: "You are MythicAi. Professional, friendly, chill.",
  study: "You are MythicAi in study mode. Explain clearly with examples.",
  coding: "You are MythicAi in coding mode. Give clean, correct code.",
  editing: "You are MythicAi in editing mode. Help with CapCut, motion blur, workflows."
};

// ------------------------------
// Restore messages on refresh
// ------------------------------
function restoreMessages() {
  const messages = document.getElementById("messages");
  messages.innerHTML = "";

  conversation.forEach(m => {
    if (m.role === "user") {
      messages.innerHTML += `<div class="msg user">${m.content}</div>`;
    }
    if (m.role === "assistant") {
      messages.innerHTML += `<div class="msg ai">${m.content}</div>`;
    }
  });

  messages.scrollTop = messages.scrollHeight;
}

function saveConversation() {
  localStorage.setItem(
    "mythicai_conversation",
    JSON.stringify(conversation)
  );
}

// ------------------------------
// Cursor dot
// ------------------------------
function createCursor() {
  const cursor = document.createElement("span");
  cursor.textContent = "●";
  cursor.style.marginLeft = "4px";
  cursor.style.color = "#7dd3fc";
  cursor.style.opacity = "0.85";
  return cursor;
}

// ------------------------------
// Human-like typing (word based)
// ------------------------------
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function typeLikeHuman(element, text) {
  isGenerating = true;
  stopGeneration = false;

  const words = text.split(" ");
  element.innerHTML = "";

  const cursor = createCursor();
  element.appendChild(cursor);

  // Thinking delay
  await sleep(500 + Math.random() * 600);

  for (let i = 0; i < words.length; i++) {
    if (stopGeneration) break;

    element.insertBefore(
      document.createTextNode(words[i] + " "),
      cursor
    );

    element.scrollIntoView({ behavior: "smooth", block: "end" });

    let delay = 70 + Math.random() * 120;

    if (/[.,!?]$/.test(words[i])) delay += 250;
    if (words[i].length > 8) delay += 100;

    await sleep(delay);
  }

  cursor.remove();
  isGenerating = false;
}

// ------------------------------
// Send message
// ------------------------------
async function send() {
  if (isGenerating) return;

  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  const messages = document.getElementById("messages");
  const mode = document.getElementById("mode").value;

  // User bubble
  messages.innerHTML += `<div class="msg user">${text}</div>`;
  messages.scrollTop = messages.scrollHeight;

  // System prompt (once)
  if (!conversation.some(m => m.role === "system")) {
    conversation.unshift({
      role: "system",
      content: modePrompts[mode]
    });
  }

  conversation.push({ role: "user", content: text });
  saveConversation();

  // AI bubble placeholder
  const aiBubble = document.createElement("div");
  aiBubble.className = "msg ai";
  messages.appendChild(aiBubble);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation })
    });

    const data = await res.json();

    // ✅ REAL error handling
    if (data.error) {
      await typeLikeHuman(
        aiBubble,
        "⚠️ " + (data.error.message || data.error)
      );
      return;
    }

    if (!data.choices || !data.choices[0]) {
      await typeLikeHuman(
        aiBubble,
        "⚠️ AI returned an empty response."
      );
      return;
    }

    const reply = data.choices[0].message.content;

    await typeLikeHuman(aiBubble, reply);

    conversation.push({
      role: "assistant",
      content: reply
    });
    saveConversation();

  } catch (err) {
    await typeLikeHuman(
      aiBubble,
      "⚠️ Network error. Please try again."
    );
  }
}

// ------------------------------
// New chat (optional)
// ------------------------------
function newChat() {
  stopGeneration = true;
  conversation = [];
  localStorage.removeItem("mythicai_conversation");
  restoreMessages();
}

// ------------------------------
// Init
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  restoreMessages();

  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
});
