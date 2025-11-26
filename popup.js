document.addEventListener("DOMContentLoaded", async () => {
  const videoInput = document.getElementById("url");
  const applyBtn = document.getElementById("apply");
  const brushBtn = document.getElementById("brush");
  const stopBtn = document.getElementById("stop");
  const resetBtn = document.getElementById("reset");
  const status = document.getElementById("status");

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  
  if (!tab?.url?.includes("leetcode.com")) {
    alert("⚠️ Open a LeetCode page first!");
    window.close();
    return;
  }

  // Load saved video
  chrome.storage.local.get("zfVideo", (res) => {
    if (res.zfVideo) {
      videoInput.value = res.zfVideo;
      applyBtn.textContent = "Update";
    }
  });

  // Check brush state
  checkState();

  // Apply video
  applyBtn.onclick = async () => {
    const url = videoInput.value.trim();
    if (!url) return;
    
    chrome.storage.local.set({ zfVideo: url });
    await send({ action: "updateVideo", url });
    
    applyBtn.textContent = "✓";
    setTimeout(() => applyBtn.textContent = "Update", 1000);
  };

  // Start brush
  brushBtn.onclick = async () => {
    await send({ action: "startBrush" });
    showStop();
    setTimeout(() => window.close(), 200);
  };

  // Stop brush
  stopBtn.onclick = async () => {
    await send({ action: "stopBrush" });
    showStart();
  };

  // Reset
  resetBtn.onclick = () => {
    if (!confirm("Reset everything?")) return;
    chrome.storage.local.clear();
    chrome.tabs.reload(tab.id);
  };

  // Helpers
  async function checkState() {
    const res = await send({ action: "checkState" });
    if (res?.brushActive) showStop();
    else showStart();
  }

  async function send(msg) {
    try {
      await ensureScript();
      return new Promise(resolve => {
        chrome.tabs.sendMessage(tab.id, msg, res => {
          if (chrome.runtime.lastError) resolve(null);
          else resolve(res);
        });
      });
    } catch {
      return null;
    }
  }

  async function ensureScript() {
    const res = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: "ping" }, r => {
        resolve(chrome.runtime.lastError ? null : r);
      });
    });

    if (!res) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["styles.css"]
      });
      await new Promise(r => setTimeout(r, 300));
    }
  }

  function showStop() {
    brushBtn.style.display = "none";
    stopBtn.style.display = "block";
    status.style.display = "block";
  }

  function showStart() {
    brushBtn.style.display = "block";
    stopBtn.style.display = "none";
    status.style.display = "none";
  }
});
