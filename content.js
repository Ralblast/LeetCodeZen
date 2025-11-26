let brushActive = false;
let hoveredElement = null;
let toastTimer = null;
let watchdogInterval = null;
let blurAmount = 3;
let focusMode = 'off';
let focusOpacity = 0.85;
let focusBlur = 1;
let typingTimer = null;
let isFocusActive = false;
let focusListenersActive = false;
let focusKeydownHandler = null;
let focusKeypressHandler = null;
let TYPING_TIMEOUT = 6000;
const DEFAULT_VIDEO = "https://www.youtube.com/watch?v=5qap5aO4i9A";

let undoHistory = [];
const MAX_HISTORY = 15;

window.addEventListener('error', (e) => {
  if (e.message.includes('Extension context invalidated')) {
    setTimeout(() => location.reload(), 1000);
  }
});

function isValid() {
  try {
    return !!(chrome && chrome.runtime && chrome.runtime.id);
  } catch {
    return false;
  }
}

function getElementSelector(el) {
  if (el.id) return `#${el.id}`;
  
  if (!el.dataset.zfElementId) {
    el.dataset.zfElementId = `zf-el-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  
  return `[data-zf-element-id="${el.dataset.zfElementId}"]`;
}

function addToHistory(element, action, previousState, previousOpacity) {
  undoHistory.push({
    selector: getElementSelector(element),
    action,
    previousState,
    previousOpacity,
    timestamp: Date.now()
  });
  
  if (undoHistory.length > MAX_HISTORY) {
    undoHistory.shift();
  }
}

function undo() {
  if (undoHistory.length === 0) {
    toast("Nothing to undo");
    return;
  }
  
  const lastAction = undoHistory.pop();
  const el = document.querySelector(lastAction.selector);
  
  if (!el) {
    toast("Element no longer exists");
    if (undoHistory.length > 0) return undo();
    return;
  }
  
  if (lastAction.previousState === 'normal') {
    el.classList.remove('zf-glass', 'zf-hidden');
    el.style.removeProperty('background-color');
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('border');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
    delete el.dataset.zfOpacity;
    delete el.dataset.zfInFocus;
    delete el.dataset.zfElementId;
  } else if (lastAction.previousState === 'glass') {
    setGlass(el, lastAction.previousOpacity || 0.55, true);
  } else if (lastAction.previousState === 'hidden') {
    el.classList.add('zf-hidden');
    el.classList.remove('zf-glass');
  }
  
  toast("Undone");
}

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
    const params = [
      'autoplay=1',
      'mute=1',
      'controls=0',
      'loop=1',
      `playlist=${ytId}`,
      'playsinline=1',
      'modestbranding=1',
      'rel=0',
      'iv_load_policy=3',
      'quality=highres',
      'vq=hd1080',
      'hd=1'
    ].join('&');
    
    container.innerHTML = `<iframe 
      src="https://www.youtube-nocookie.com/embed/${ytId}?${params}" 
      allow="autoplay; encrypted-media" 
      frameborder="0"
      width="1920"
      height="1080"
      loading="eager"
      allowfullscreen
      onerror="this.src='https://www.youtube-nocookie.com/embed/${ytId}?${params.replace('vq=hd1080', 'vq=hd720')}'"></iframe>`;
  } else {
    container.innerHTML = `<video src="${videoUrl}" autoplay loop muted playsinline></video>`;
  }
}

function extractYouTubeID(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

function initFocusMode() {
  if (focusMode === 'off') return;
  
  if (focusMode === 'fixed') {
    applyFocusSettings();
    toast("Fixed Focus");
    return;
  }
  
  if (focusMode === 'dynamic' && !focusListenersActive) {
    focusKeydownHandler = handleTypingActivity;
    focusKeypressHandler = handleTypingActivity;
    
    document.addEventListener('keydown', focusKeydownHandler, true);
    document.addEventListener('keypress', focusKeypressHandler, true);
    focusListenersActive = true;
    toast("Dynamic Focus");
  }
}

function handleTypingActivity(e) {
  const ignoredKeys = [
    'Escape', 'Tab', 'CapsLock', 'Shift', 'Control', 'Alt', 'Meta',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'PageUp', 'PageDown', 'Home', 'End', 'Insert', 'Delete'
  ];
  
  if (ignoredKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (brushActive) return;
  
  if (!isFocusActive) {
    isFocusActive = true;
    applyFocusSettings();
  }
  
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    isFocusActive = false;
    restoreAestheticSettings();
  }, TYPING_TIMEOUT);
}

function applyFocusSettings() {
  const glassElements = document.querySelectorAll('.zf-glass');
  
  glassElements.forEach(el => {
    const userOpacity = parseFloat(el.dataset.zfOpacity);
    
    if (!userOpacity || userOpacity === 0) return;
    
    el.style.setProperty('background-color', `rgba(20, 20, 20, ${focusOpacity})`, 'important');
    el.style.setProperty('backdrop-filter', `blur(${focusBlur}px)`, 'important');
    el.dataset.zfInFocus = 'true';
  });
}

function restoreAestheticSettings() {
  const focusedElements = document.querySelectorAll('.zf-glass[data-zf-in-focus="true"]');
  
  focusedElements.forEach(el => {
    const userOpacity = parseFloat(el.dataset.zfOpacity);
    
    if (userOpacity === 0 || isNaN(userOpacity)) return;
    
    if (userOpacity > 0) {
      el.style.setProperty('background-color', `rgba(20, 20, 20, ${userOpacity})`, 'important');
      el.style.setProperty('backdrop-filter', `blur(${blurAmount}px)`, 'important');
    }
    
    delete el.dataset.zfInFocus;
  });
}

function disableFocusMode() {
  if (focusMode === 'fixed') {
    restoreAestheticSettings();
  }
  
  if (focusListenersActive && focusKeydownHandler) {
    document.removeEventListener('keydown', focusKeydownHandler, true);
    document.removeEventListener('keypress', focusKeypressHandler, true);
    focusKeydownHandler = null;
    focusKeypressHandler = null;
    focusListenersActive = false;
  }
  
  isFocusActive = false;
  clearTimeout(typingTimer);
  focusMode = 'off';
}

function cycleTransparency(el) {
  const currentOp = parseFloat(el.dataset.zfOpacity);
  const wasHidden = el.classList.contains('zf-hidden');
  const wasGlass = el.classList.contains('zf-glass');
  const previousOpacity = currentOp;
  
  let prevState = 'normal';
  if (wasHidden) prevState = 'hidden';
  else if (wasGlass) prevState = 'glass';
  
  if (isNaN(currentOp)) {
    setGlass(el, 0.55);
    toast("Glass 55%");
    addToHistory(el, 'glass', prevState);
  } else if (currentOp > 0) {
    setGlass(el, 0);
    toast("Transparent");
    addToHistory(el, 'transparent', prevState, previousOpacity);
  } else {
    setGlass(el, 0.55);
    toast("Glass 55%");
    addToHistory(el, 'glass', prevState);
  }
}

function setGlass(el, opacity, skipHistory = false) {
  const wasHidden = el.classList.contains('zf-hidden');
  const wasGlass = el.classList.contains('zf-glass');
  const previousOpacity = parseFloat(el.dataset.zfOpacity);
  
  el.dataset.zfOpacity = opacity;
  el.classList.remove('zf-hidden');
  el.classList.add('zf-glass');
  
  if (opacity === 0) {
    el.style.setProperty('background-color', 'transparent', 'important');
    el.style.setProperty('backdrop-filter', 'none', 'important');
    el.style.setProperty('border', 'none', 'important');
  } else {
    if (isFocusActive && focusMode !== 'off') {
      el.style.setProperty('background-color', `rgba(20, 20, 20, ${focusOpacity})`, 'important');
      el.style.setProperty('backdrop-filter', `blur(${focusBlur}px)`, 'important');
      el.dataset.zfInFocus = 'true';
    } else {
      el.style.setProperty('background-color', `rgba(20, 20, 20, ${opacity})`, 'important');
      el.style.setProperty('backdrop-filter', `blur(${blurAmount}px)`, 'important');
    }
    el.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
  }
  
  clearParents(el);
  
  if (!skipHistory) {
    let prevState = 'normal';
    if (wasHidden) prevState = 'hidden';
    else if (wasGlass) prevState = 'glass';
    addToHistory(el, 'glass', prevState, previousOpacity);
  }
}

function toggleHidden(el) {
  const wasHidden = el.classList.contains('zf-hidden');
  const wasGlass = el.classList.contains('zf-glass');
  const previousOpacity = parseFloat(el.dataset.zfOpacity);
  
  if (wasHidden) {
    el.classList.remove('zf-hidden', 'zf-glass');
    el.style.removeProperty('visibility');
    el.style.removeProperty('opacity');
    el.style.removeProperty('background-color');
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('border');
    el.style.removeProperty('background');
    delete el.dataset.zfOpacity;
    delete el.dataset.zfInFocus;
    
    toast("Restored");
    addToHistory(el, 'restore', 'hidden');
  } else {
    el.classList.add('zf-hidden');
    el.classList.remove('zf-glass');
    delete el.dataset.zfOpacity;
    delete el.dataset.zfInFocus;
    
    toast("Hidden");
    
    let prevState = 'normal';
    if (wasGlass) prevState = 'glass';
    addToHistory(el, 'hidden', prevState, previousOpacity);
  }
}

function adjustOpacity(el, delta) {
  let currentOp = parseFloat(el.dataset.zfOpacity);
  
  if (isNaN(currentOp)) {
    currentOp = 0.5;
  }
  
  currentOp = Math.max(0, Math.min(1, currentOp + delta));
  setGlass(el, currentOp);
  
  toast(`${Math.round(currentOp * 100)}%`);
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

function enableBrush() {
  if (brushActive) return;
  
  brushActive = true;
  document.body.classList.add('zf-brush');
  
  document.addEventListener('mouseover', onHover, true);
  document.addEventListener('click', onLeftClick, true);
  document.addEventListener('contextmenu', onRightClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  
  startWatchdog();
  toast("Brush Active");
}

function disableBrush() {
  if (!brushActive) return;
  
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
  toast("Brush Off");
}

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
  
  if (e.altKey && e.key === 'z') {
    e.preventDefault();
    undo();
    return;
  }
  
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

function toast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  
  let t = document.getElementById('zf-toast');
  if (t) t.remove();
  
  t = document.createElement('div');
  t.id = 'zf-toast';
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;top:16px;left:50%;transform:translateX(-50%);
    background:#1f2937;color:#fff;padding:8px 16px;border-radius:6px;
    font:500 12px system-ui;box-shadow:0 4px 12px rgba(0,0,0,0.4);
    z-index:2147483647;pointer-events:none;
    animation:slideIn 0.2s ease;border:1px solid #374151;
  `;
  
  document.body.appendChild(t);
  
  toastTimer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.2s';
    setTimeout(() => t.remove(), 200);
  }, 1200);
}

function startWatchdog() {
  if (watchdogInterval) return;
  
  let stableCount = 0;
  
  watchdogInterval = setInterval(() => {
    if (!isValid()) {
      stopWatchdog();
      return;
    }
    
    if (brushActive && !document.body.classList.contains('zf-brush')) {
      document.body.classList.add('zf-brush');
      stableCount = 0;
    } else {
      stableCount++;
      
      if (stableCount > 5) {
        clearInterval(watchdogInterval);
        watchdogInterval = setInterval(() => {
          if (brushActive && !document.body.classList.contains('zf-brush')) {
            document.body.classList.add('zf-brush');
          }
        }, 2000);
      }
    }
  }, 500);
}

function stopWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

if (isValid()) {
  chrome.runtime.onMessage.addListener((msg, sender, respond) => {
    if (!isValid()) {
      respond({ ok: false, error: "Extension context lost" });
      return true;
    }
    
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
          
        case "setBlur":
          blurAmount = msg.blur;
          if (!isFocusActive || focusMode === 'off') {
            document.querySelectorAll('.zf-glass').forEach(el => {
              const opacity = parseFloat(el.dataset.zfOpacity);
              if (opacity > 0) {
                el.style.setProperty('backdrop-filter', `blur(${blurAmount}px)`, 'important');
              }
            });
          }
          respond({ ok: true });
          break;
          
        case "setFocusSettings":
          focusOpacity = msg.focusOpacity;
          focusBlur = msg.focusBlur;
          chrome.storage.local.set({ 
            zfFocusOpacity: focusOpacity,
            zfFocusBlur: focusBlur 
          });
          
          if (focusMode === 'fixed') {
            applyFocusSettings();
          }
          
          respond({ ok: true });
          break;
          
        case "setTimeout":
          TYPING_TIMEOUT = msg.timeout;
          respond({ ok: true });
          break;
          
        case "setFocusMode":
          disableFocusMode();
          focusMode = msg.mode;
          
          if (msg.timeout !== undefined) {
            TYPING_TIMEOUT = msg.timeout;
          }
          
          if (focusMode !== 'off') {
            initFocusMode();
          }
          
          chrome.storage.local.set({ zfFocusMode: focusMode });
          respond({ ok: true });
          break;
          
        case "undo":
          undo();
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
          respond({ ok: false, error: "Unknown action" });
      }
    } catch (err) {
      respond({ ok: false, error: err.message });
      toast(`Error: ${err.message}`);
    }
    
    return true;
  });
}

function init() {
  if (!isValid()) return;
  
  chrome.storage.local.get([
    'zfVideo', 'zfBlur', 'zfFocusMode', 'zfFocusOpacity', 'zfFocusBlur', 'zfTimeout'
  ], (res) => {
    if (chrome.runtime.lastError) return;
    
    injectVideo(res.zfVideo);
    
    if (res.zfBlur !== undefined) {
      blurAmount = res.zfBlur;
    }
    
    if (res.zfFocusOpacity !== undefined) {
      focusOpacity = res.zfFocusOpacity;
    }
    
    if (res.zfFocusBlur !== undefined) {
      focusBlur = res.zfFocusBlur;
    }
    
    if (res.zfTimeout !== undefined) {
      TYPING_TIMEOUT = res.zfTimeout;
    }
    
    if (res.zfFocusMode) {
      focusMode = res.zfFocusMode;
      initFocusMode();
    }
  });
  
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
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
