document.addEventListener("DOMContentLoaded", () => {
  const messageForm = document.getElementById("messageArea");
  const messageContainer = document.getElementById("messageFormEight");
  const textInput = document.getElementById("text");

  // GitHub Elements
  const repoInput = document.getElementById("repoUrl");
  const ingestBtn = document.getElementById("ingestBtn");

  // chatbot route
  ingestBtn.addEventListener("click", async () => {
    const repoUrl = repoInput.value.trim();
    if (!repoUrl) {
      alert("Please enter a GitHub URL first.");
      return;
    }

    ingestBtn.disabled = true;
    ingestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    addSystemMessage("Initializing repository... This may take a moment.");

    try {
      const payload = new URLSearchParams();
      payload.append("question", repoUrl);

      const response = await fetch("/chatbot", {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) throw new Error("Ingestion failed");

      const result = await response.json();

      addSystemMessage(
        `Repository loaded successfully! You can now ask questions about: ${result.response}`,
      );
    } catch (error) {
      console.error("Error:", error);
      addSystemMessage(
        "Error: Failed to load repository. Check the console or server logs.",
        true,
      );
    } finally {
      ingestBtn.disabled = false;
      ingestBtn.textContent = "Initialize";
    }
  });

  // get route
  messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const rawText = textInput.value.trim();
    if (!rawText) return;

    appendMessage(rawText, "user");
    textInput.value = "";

    try {
      const payload = new URLSearchParams();
      payload.append("msg", rawText);

      const response = await fetch("/get", {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const botResponseText = await response.text();

      appendMessage(botResponseText, "bot");
    } catch (error) {
      console.error("Error:", error);
      addSystemMessage("Error: Could not connect to chat server.", true);
    }
  });

  // Helper functions below

  function getStrTime() {
    const date = new Date();
    return date.getHours() + ":" + String(date.getMinutes()).padStart(2, "0");
  }

  function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  function appendMessage(text, sender) {
    const isUser = sender === "user";
    const strTime = getStrTime();

    const rowDiv = document.createElement("div");
    rowDiv.classList.add("d-flex", "mb-4");
    rowDiv.classList.add(
      isUser ? "justify-content-end" : "justify-content-start",
    );

    const imgCont = document.createElement("div");
    imgCont.classList.add("img_cont_msg");

    const img = document.createElement("img");
    img.classList.add("rounded-circle", "user_img_msg");
    img.src = isUser
      ? "https://i.ibb.co/d5b84Xw/Untitled-design.png"
      : "https://p7.hiclipart.com/preview/1010/961/279/computer-icons-source-code-html-coding.jpg";

    imgCont.appendChild(img);

    const msgCont = document.createElement("div");
    msgCont.classList.add(isUser ? "msg_cotainer_send" : "msg_cotainer");

    msgCont.textContent = text;

    const timeSpan = document.createElement("span");
    timeSpan.classList.add(isUser ? "msg_time_send" : "msg_time");
    timeSpan.textContent = strTime;

    msgCont.appendChild(timeSpan);

    if (isUser) {
      // User: Message then Image
      rowDiv.appendChild(msgCont);
      rowDiv.appendChild(imgCont);
    } else {
      // Bot: Image then Message
      rowDiv.appendChild(imgCont);
      rowDiv.appendChild(msgCont);
    }

    messageContainer.appendChild(rowDiv);
    scrollToBottom();
  }

  function addSystemMessage(msg, isError = false) {
    const strTime = getStrTime();
    const color = isError ? "#ff6b6b" : "#f0ad4e";

    const rowDiv = document.createElement("div");
    rowDiv.classList.add("d-flex", "justify-content-start", "mb-4");

    const msgCont = document.createElement("div");
    msgCont.classList.add("msg_cotainer");
    msgCont.style.backgroundColor = color;
    msgCont.style.color = "white";
    msgCont.style.opacity = "0.9";
    msgCont.style.fontStyle = "italic";

    const icon = document.createElement("i");
    icon.classList.add(
      "fas",
      isError ? "fa-exclamation-circle" : "fa-info-circle",
    );
    icon.style.marginRight = "8px";

    const textNode = document.createTextNode(msg);

    const timeSpan = document.createElement("span");
    timeSpan.classList.add("msg_time");
    timeSpan.textContent = strTime;

    msgCont.appendChild(icon);
    msgCont.appendChild(textNode);
    msgCont.appendChild(timeSpan);
    rowDiv.appendChild(msgCont);

    messageContainer.appendChild(rowDiv);
    scrollToBottom();
  }
});
