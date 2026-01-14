// ==============================
// MythicAi – app.js (Typing UX)
// ==============================

const WORKER_URL = "https://autumn-wue.killermunu.workers.dev/";

// Load saved conversation
let conversation = JSON.parse(
  localStorage.getItem("mythicai_conversation")
) || [];

// Mode prompts
const modePrompts = {
  general: "You are MythicAi. Professional, friendly, chill.",
  study: "You are MythicAi in study mode. Explain clearly with examples.",
  coding: "You are MythicAi in coding mode. Give clean, correct code.",
  editing: "You are MythicAi in editing mode. Help with CapCut, motion blur, workflows."
};

// Restore messages
function restoreMessages() {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  conversation.forEach(msg => {
    if (msg.role === "user") {
      messagesDiv.innerHTML += `<div class="msg user">${msg.content}</div>`;
    }
    if (msg.role === "assistant") {
      messagesDiv.innerHTML += `<div class="msg ai">${msg.content}</div>`;
    }
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Save memory
function saveConversation() {
  localStorage.setItem(
    "mythicai_conversation",
    JSON.stringify(conversation)
  );
}

// ⌨️ TYPEWRITER EFFECT
async function typeText(element, text, speed = 18) {
  let i = 0;
  element.innerHTML = "";

  const cursor = document.createElement("span");
  cursor.textContent = "●";
  cursor.style.marginLeft = "4px";
  cursor.style.color = "#7dd3fc";
  cursor.style.opacity = "0.8";

  element.appendChild(cursor);

  while (i < text.length) {
    element.insertBefore(
      document.createTextNode(text.charAt(i)),
      cursor
    );
    i++;
    await new Promise(r => setTimeout(r, speed));
  }

  cursor.remove(); // remove dot when done
}

// 🚀 Send message
async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  const messagesDiv = document.getElementById("messages");
  const mode = document.getElementById("mode").value;

  // User message
  messagesDiv.innerHTML += `<div class="msg user">${text}</div>`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  // System prompt (once)
  if (!conversation.some(m => m.role === "system")) {
    conversation.unshift({
      role: "system",
      content: modePrompts[mode]
    });
  }

  conversation.push({ role: "user", content: text });
  saveConversation();

  // Placeholder AI bubble
  const aiBubble = document.createElement("div");
  aiBubble.className = "msg ai";
  messagesDiv.appendChild(aiBubble);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation })
    });

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    // Type the reply slowly ✨
    await typeText(aiBubble, reply, 16);

    conversation.push({
      role: "assistant",
      content: reply
    });
    saveConversation();

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  } catch (err) {
    aiBubble.textContent = "⚠️ Error connecting to MythicAi.";
  }
}

// Enter key
document.addEventListener("DOMContentLoaded", () => {
  restoreMessages();

  document.getElementById("input").addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
});
