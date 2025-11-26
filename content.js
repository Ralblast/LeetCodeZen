// ============================================
// LEETCODE FLOW STATE - FINAL CLEAN VERSION
// Video background + Manual brush mode
// NO state persistence (too unreliable with React)
// ============================================

console.log("🎨 LeetCode Flow State loaded");

// --- STATE ---
let brushActive = false;
let hoveredElement = null;
let toastTimer = null;
let watchdogInterval = null;
const DEFAULT_VIDEO = "https://www.youtube.com/watch?v=5qap5aO4i9A";

// --- CONTEXT CHECK ---
function isValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

// --- VIDEO INJECTION ---
function injectVideo(url) {
  if (!isValid()) return;
  
  let container = document.getElementById('zf-video');
  if (!container) {
    container = document.createElement('div');
    container.id = 'zf-video';
    document.body.appendChild(container);
  }

  const videoUrl = url || DEFAULT_VIDEO;
  const ytId = extractYouTubeID(videoUrl);
  
    if (ytId) {
      container.innerHTML = `<iframe 
      src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&quality=hd1080&hd=1&vq=hd1080" 
      allow="autoplay" 
      frameborder="0"
      width="1920"
      height="1080"></iframe>`;
    }

console.log("✅ Video injected:", videoUrl.substring(0, 50));

}

function extractYouTubeID(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

// --- ELEMENT STATE MANAGEMENT ---

function cycleTransparency(el) {
  const currentOp = parseFloat(el.dataset.zfOpacity);
  
  if (isNaN(currentOp)) {
    setGlass(el, 0.55);
    toast("✨ Glass (55%)");
  } else if (currentOp > 0) {
    setGlass(el, 0);
    toast("👁️ Transparent (0%)");
  } else {
    setGlass(el, 0.55);
    toast("✨ Glass (55%)");
  }
}

function setGlass(el, opacity) {
  el.dataset.zfOpacity = opacity;
  el.classList.remove('zf-hidden');
  el.classList.add('zf-glass');
  
  if (opacity === 0) {
    el.style.setProperty('background-color', 'transparent', 'important');
    el.style.setProperty('backdrop-filter', 'none', 'important');
    el.style.setProperty('border', 'none', 'important');
  } else {
    el.style.setProperty('background-color', `rgba(20, 20, 20, ${opacity})`, 'important');
    el.style.setProperty('backdrop-filter', 'blur(3px)', 'important');
    el.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
  }
  
  clearParents(el);
}

function toggleHidden(el) {
  if (el.classList.contains('zf-hidden')) {
    // RESTORE
    console.log("🔄 RESTORING:", el.tagName);
    
    el.classList.remove('zf-hidden', 'zf-glass');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
    el.style.removeProperty('background-color');
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('border');
    el.style.removeProperty('background');
    delete el.dataset.zfOpacity;
    
    toast("🔄 Restored");
  } else {
    // HIDE
    console.log("👻 HIDING:", el.tagName);
    
    el.classList.add('zf-hidden');
    el.classList.remove('zf-glass');
    delete el.dataset.zfOpacity;
    
    toast("👻 Hidden");
  }
}

function adjustOpacity(el, delta) {
  let currentOp = parseFloat(el.dataset.zfOpacity);
  
  // Start from 50%
  if (isNaN(currentOp)) {
    currentOp = 0.5;
  }
  
  currentOp = Math.max(0, Math.min(1, currentOp + delta));
  setGlass(el, currentOp);
  
  toast(`💎 ${Math.round(currentOp * 100)}%`);
}

function clearParents(el) {
  let parent = el.parentElement;
  let depth = 0;
  
  while (parent && depth < 50) {
    if (parent.tagName === 'HTML' || parent.tagName === 'BODY') break;
    if (parent.classList.contains('zf-glass')) break;
    
    parent.classList.add('zf-clear');
    parent.style.setProperty('background', 'transparent', 'important');
    parent.style.setProperty('background-color', 'transparent', 'important');
    parent.style.setProperty('background-image', 'none', 'important');
    
    parent = parent.parentElement;
    depth++;
  }
}

// --- BRUSH MODE ---

function enableBrush() {
  if (brushActive) return;
  
  console.log("🖌️ BRUSH ON");
  brushActive = true;
  document.body.classList.add('zf-brush');
  
  document.addEventListener('mouseover', onHover, true);
  document.addEventListener('click', onLeftClick, true);
  document.addEventListener('contextmenu', onRightClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  
  startWatchdog();
  toast("🖌️ Brush Active");
}

function disableBrush() {
  if (!brushActive) return;
  
  console.log("🛑 BRUSH OFF");
  brushActive = false;
  document.body.classList.remove('zf-brush');
  
  document.removeEventListener('mouseover', onHover, true);
  document.removeEventListener('click', onLeftClick, true);
  document.removeEventListener('contextmenu', onRightClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  
  if (hoveredElement) {
    hoveredElement.classList.remove('zf-highlight');
    hoveredElement = null;
  }
  
  stopWatchdog();
  toast("✋ Brush Off");
}

// --- EVENT HANDLERS ---

function onHover(e) {
  if (!brushActive) return;
  
  const prev = document.querySelector('.zf-highlight');
  if (prev) prev.classList.remove('zf-highlight');
  
  e.target.classList.add('zf-highlight');
  hoveredElement = e.target;
}

function onLeftClick(e) {
  if (!brushActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  cycleTransparency(e.target);
}

function onRightClick(e) {
  if (!brushActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  toggleHidden(e.target);
}

function onKeyDown(e) {
  if (!brushActive) return;
  
  if (e.key === 'Escape') {
    disableBrush();
    if (isValid()) {
      chrome.runtime.sendMessage({ action: "brushStopped" }).catch(() => {});
    }
    return;
  }
  
  if (!hoveredElement) return;
  
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    adjustOpacity(hoveredElement, 0.05);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    adjustOpacity(hoveredElement, -0.05);
  }
}

// --- TOAST ---

function toast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  
  let t = document.getElementById('zf-toast');
  if (t) t.remove();
  
  t = document.createElement('div');
  t.id = 'zf-toast';
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;top:16px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#667eea,#764ba2);
    color:#fff;padding:10px 20px;border-radius:8px;
    font:600 13px/1 -apple-system,sans-serif;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
    z-index:2147483647;pointer-events:none;
    animation:slideIn 0.3s ease;
  `;
  
  document.body.appendChild(t);
  
  toastTimer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.3s';
    setTimeout(() => t.remove(), 300);
  }, 1500);
}

// --- WATCHDOG ---

function startWatchdog() {
  if (watchdogInterval) return;
  
  watchdogInterval = setInterval(() => {
    if (!isValid()) {
      stopWatchdog();
      return;
    }
    
    if (brushActive && !document.body.classList.contains('zf-brush')) {
      document.body.classList.add('zf-brush');
    }
  }, 500);
}

function stopWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

// --- MESSAGE HANDLER ---

if (isValid()) {
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (!isValid()) return;
    
    console.log("📨", msg.action);
    
    try {
      switch (msg.action) {
        case "ping":
          respond({ pong: true });
          break;
        case "updateVideo":
          injectVideo(msg.url);
          chrome.storage.local.set({ zfVideo: msg.url });
          respond({ ok: true });
          break;
        case "startBrush":
          enableBrush();
          respond({ ok: true });
          break;
        case "stopBrush":
          disableBrush();
          respond({ ok: true });
          break;
        case "checkState":
          respond({ brushActive });
          break;
        case "reset":
          location.reload();
          break;
        default:
          respond({ error: "Unknown action" });
      }
    } catch (err) {
      console.error("❌", err);
      respond({ error: err.message });
    }
    
    return true;
  });
}

// --- INIT ---

function init() {
  if (!isValid()) return;
  
  console.log("🚀 Initializing...");
  
  // Auto-inject saved video
  chrome.storage.local.get(['zfVideo'], (res) => {
    if (chrome.runtime.lastError) return;
    injectVideo(res.zfVideo);
  });
  
  // Make LeetCode background transparent
  setTimeout(() => {
    ['__next', 'app', 'leetcode-navbar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('background-color', 'transparent', 'important');
      }
    });
    
    document.body.style.setProperty('background', 'transparent', 'important');
    document.documentElement.style.setProperty('background', 'transparent', 'important');
    
    console.log("✅ Background transparency applied");
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log("✅ LeetCode Flow State ready");
