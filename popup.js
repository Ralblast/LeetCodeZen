if (window.popupInitialized) {
  throw new Error("Popup already initialized");
}
window.popupInitialized = true;

document.addEventListener("DOMContentLoaded", async () => {
  const videoInput = document.getElementById("url");
  const applyBtn = document.getElementById("apply");
  const brushBtn = document.getElementById("brush");
  const stopBtn = document.getElementById("stop");
  const resetBtn = document.getElementById("reset");
  const status = document.getElementById("status");
  
  const quickDynamicBtn = document.getElementById("quickDynamic");
  const quickFixedBtn = document.getElementById("quickFixed");
  
  const playlistContainer = document.getElementById("playlist");
  const addPlaylistBtn = document.getElementById("addPlaylist");
  const videoSection = document.getElementById("videoSection");
  const videoToggle = document.getElementById("videoToggle");
  
  const localVideoPicker = document.getElementById("localVideoPicker");
  const useLocalBtn = document.getElementById("useLocal");

  const localImagePicker = document.getElementById("localImagePicker");
  const useLocalImageBtn = document.getElementById("useLocalImage");

  
  const blurSlider = document.getElementById("blurSlider");
  const blurValue = document.getElementById("blurValue");
  
  const undoBtn = document.getElementById("undo");
  
  const dynamicFocusRadio = document.getElementById("dynamicFocus");
  const fixedFocusRadio = document.getElementById("fixedFocus");
  const dynamicRow = document.getElementById("dynamicRow");
  const fixedRow = document.getElementById("fixedRow");
  const timeoutInput = document.getElementById("timeoutInput");
  const timeoutSeconds = document.getElementById("timeoutSeconds");
  
  const focusSection = document.getElementById("focusSection");
  const focusToggle = document.getElementById("focusToggle");
  const focusOpacitySlider = document.getElementById("focusOpacitySlider");
  const focusOpacityValue = document.getElementById("focusOpacityValue");
  const focusBlurSlider = document.getElementById("focusBlurSlider");
  const focusBlurValue = document.getElementById("focusBlurValue");

  let scriptInjecting = false;
  let currentMode = 'off';
  let sliderDebounceTimer = null;

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  
  if (!tab?.url?.includes("leetcode.com")) {
    alert("⚠️ Open a LeetCode page first");
    window.close();
    return;
  }

  async function loadLocalVideos() {
    localVideoPicker.innerHTML = '<option value="">Scanning videos folder...</option>';
    useLocalBtn.disabled = true;
    
    const commonNames = [
      'space', 'lofi', 'nature', 'study', 'coding', 'rain', 'background',
      'video1', 'video2', 'video3', 'video4', 'video5',
      'video', 'bg', 'wallpaper', 'scene'
    ];
    
    const extensions = ['mp4', 'webm', 'mov'];
    const foundVideos = [];
    
    for (const name of commonNames) {
      for (const ext of extensions) {
        const filename = `${name}.${ext}`;
        const url = chrome.runtime.getURL(`videos/${filename}`);
        
        try {
          const response = await fetch(url, { method: 'HEAD' });
          if (response.ok) {
            foundVideos.push({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              url: url,
              filename: filename
            });
          }
        } catch (e) {
          // File doesn't exist, skip
        }
      }
    }

    
    
    localVideoPicker.innerHTML = '';
    
    if (foundVideos.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No videos found in /videos folder';
      localVideoPicker.appendChild(option);
      useLocalBtn.disabled = true;
      useLocalBtn.style.opacity = '0.5';
    } else {
      foundVideos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.url;
        option.textContent = `${video.name} (${video.filename})`;
        localVideoPicker.appendChild(option);
      });
      useLocalBtn.disabled = false;
      useLocalBtn.style.opacity = '1';
    }
  }


async function loadLocalImages() {
  localImagePicker.innerHTML = '<option value="">Scanning images folder...</option>';
  useLocalImageBtn.disabled = true;

  const commonNames = [
    'space', 'lofi', 'nature', 'study', 'coding', 'rain', 'background',
    'image1', 'image2', 'image3', 'image4', 'image5',
    'wallpaper', 'scene', 'photo', 'bg'
  ];
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const foundImages = [];

  for (const name of commonNames) {
    for (const ext of extensions) {
      const filename = `${name}.${ext}`;
      const url = chrome.runtime.getURL(`images/${filename}`);
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          foundImages.push({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            url: url,
            filename: filename
          });
        }
      } catch (e) {
        // File doesn't exist, skip
      }
    }
  }

  localImagePicker.innerHTML = '';
  if (foundImages.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No images found in /images folder';
    localImagePicker.appendChild(option);
    useLocalImageBtn.disabled = true;
    useLocalImageBtn.style.opacity = '0.5';
  } else {
    foundImages.forEach(image => {
      const option = document.createElement('option');
      option.value = image.url;
      option.textContent = `${image.name} (${image.filename})`;
      localImagePicker.appendChild(option);
    });
    useLocalImageBtn.disabled = false;
    useLocalImageBtn.style.opacity = '1';
  }
 }


  chrome.storage.local.get([
    'zfVideo', 'zfPlaylist', 'zfBlur', 'zfFocusMode', 
    'zfFocusOpacity', 'zfFocusBlur', 'zfTimeout',
    'zfVideoCollapsed', 'zfFocusCollapsed'
  ], (res) => {
    if (res.zfVideo) {
      videoInput.value = res.zfVideo;
      applyBtn.textContent = "Update";
    }
    
    const playlist = res.zfPlaylist || [];
    renderPlaylist(playlist);
    
    if (res.zfBlur !== undefined) {
      blurSlider.value = res.zfBlur;
      blurValue.textContent = res.zfBlur + 'px';
    }
    
    currentMode = res.zfFocusMode || 'off';
    updateFocusUI(currentMode, false);
    updateQuickToggles(currentMode);
    
    if (res.zfTimeout !== undefined) {
      timeoutSeconds.value = res.zfTimeout / 1000;
    }
    
    if (res.zfFocusOpacity !== undefined) {
      focusOpacitySlider.value = res.zfFocusOpacity * 100;
      focusOpacityValue.textContent = Math.round(res.zfFocusOpacity * 100) + '%';
    }
    
    if (res.zfFocusBlur !== undefined) {
      focusBlurSlider.value = res.zfFocusBlur;
      focusBlurValue.textContent = res.zfFocusBlur + 'px';
    }
    
    if (res.zfVideoCollapsed) {
      videoSection.style.display = 'none';
      videoToggle.textContent = '▶';
    }
    
    if (res.zfFocusCollapsed) {
      focusSection.style.display = 'none';
      focusToggle.textContent = '▶';
    }
  });

  loadLocalVideos();
  loadLocalImages();

  checkState();

  videoToggle.onclick = () => {
    const isCollapsed = videoSection.style.display === 'none';
    videoSection.style.display = isCollapsed ? 'block' : 'none';
    videoToggle.textContent = isCollapsed ? '▼' : '▶';
    chrome.storage.local.set({ zfVideoCollapsed: !isCollapsed });
  };

  focusToggle.onclick = () => {
    const isCollapsed = focusSection.style.display === 'none';
    focusSection.style.display = isCollapsed ? 'block' : 'none';
    focusToggle.textContent = isCollapsed ? '▼' : '▶';
    chrome.storage.local.set({ zfFocusCollapsed: !isCollapsed });
  };

  applyBtn.onclick = async () => {
    const url = videoInput.value.trim();
    if (!url) {
      alert("⚠️ Enter a video URL");
      return;
    }
    
    chrome.storage.local.set({ zfVideo: url });
    await send({ action: "updateVideo", url });
    
    applyBtn.textContent = "✓";
    setTimeout(() => applyBtn.textContent = "Apply", 1000);
  };

  useLocalBtn.onclick = async () => {
    const url = localVideoPicker.value;
    if (!url) return;
    
    videoInput.value = url;
    chrome.storage.local.set({ zfVideo: url });
    await send({ action: "updateVideo", url });
    
    useLocalBtn.textContent = "✓";
    setTimeout(() => useLocalBtn.textContent = "Use", 1000);
  };

  useLocalImageBtn.onclick = async () => {
    const url = localImagePicker.value;
    if (!url) return;
    
    videoInput.value = url;
    chrome.storage.local.set({ zfVideo: url });
    await send({ action: "updateVideo", url });
    useLocalImageBtn.textContent = "✓";
    setTimeout(() => useLocalImageBtn.textContent = "Use", 1000);
 };


  addPlaylistBtn.onclick = () => {
    const url = videoInput.value.trim();
    if (!url) return;
    
    chrome.storage.local.get(['zfPlaylist'], (res) => {
      const playlist = res.zfPlaylist || [];
      
      if (playlist.length >= 10) {
        alert("⚠️ Max 10 videos");
        return;
      }
      
      if (playlist.includes(url)) {
        alert("⚠️ Already in playlist");
        return;
      }
      
      playlist.push(url);
      chrome.storage.local.set({ zfPlaylist: playlist });
      renderPlaylist(playlist);
    });
  };

function renderPlaylist(playlist) {
  playlistContainer.innerHTML = '';
  
  playlist.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    
    const label = document.createElement('span');
    
    // Detect if image or video
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const imageHosts = ['images.unsplash.com', 'picsum.photos', 'i.imgur.com', 'images.pexels.com'];
    
    const isImage = imageExtensions.some(ext => url.toLowerCase().includes(ext)) ||
                    imageHosts.some(host => url.includes(host));
    
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isVimeo = url.includes('vimeo.com');
    const isPexelsVideo = url.includes('pexels.com/download/video') || url.includes('videos.pexels.com');
    
    let prefix = '📹 Video';
    if (isImage) {
      prefix = '🖼️ Image';
    } else if (isYouTube) {
      prefix = '▶️ YouTube';
    } else if (isVimeo) {
      prefix = '🎬 Vimeo';
    } else if (isPexelsVideo) {
      prefix = '🎥 Pexels';
    }
    
    // Count how many of same type before this
    const sameTypeBefore = playlist.slice(0, index).filter(u => {
      const isSameImage = isImage && (imageExtensions.some(ext => u.toLowerCase().includes(ext)) || imageHosts.some(host => u.includes(host)));
      const isSameYT = isYouTube && (u.includes('youtube.com') || u.includes('youtu.be'));
      const isSameVimeo = isVimeo && u.includes('vimeo.com');
      const isSamePexels = isPexelsVideo && (u.includes('pexels.com/download/video') || u.includes('videos.pexels.com'));
      return isSameImage || isSameYT || isSameVimeo || isSamePexels;
    }).length + 1;
    
    label.textContent = `${prefix} ${sameTypeBefore}`;
    label.title = url;
    
    label.onclick = async () => {
      videoInput.value = url;
      chrome.storage.local.set({ zfVideo: url });
      await send({ action: "updateVideo", url });
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => {
      playlist.splice(index, 1);
      chrome.storage.local.set({ zfPlaylist: playlist });
      renderPlaylist(playlist);
    };
    
    item.appendChild(label);
    item.appendChild(deleteBtn);
    playlistContainer.appendChild(item);
  });
}


  blurSlider.oninput = () => {
    const blur = parseFloat(blurSlider.value);
    blurValue.textContent = blur + 'px';
    chrome.storage.local.set({ zfBlur: blur });
    
    clearTimeout(sliderDebounceTimer);
    sliderDebounceTimer = setTimeout(() => {
      send({ action: "setBlur", blur });
    }, 150);
  };

  quickDynamicBtn.onclick = () => {
    const newMode = currentMode === 'dynamic' ? 'off' : 'dynamic';
    currentMode = newMode;
    updateFocusUI(newMode, true);
    updateQuickToggles(newMode);
  };

  quickFixedBtn.onclick = () => {
    const newMode = currentMode === 'fixed' ? 'off' : 'fixed';
    currentMode = newMode;
    updateFocusUI(newMode, true);
    updateQuickToggles(newMode);
  };

  dynamicRow.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const newMode = currentMode === 'dynamic' ? 'off' : 'dynamic';
    
    requestAnimationFrame(() => {
      currentMode = newMode;
      updateFocusUI(newMode, true);
      updateQuickToggles(newMode);
    });
  };

  fixedRow.onclick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const newMode = currentMode === 'fixed' ? 'off' : 'fixed';
    
    requestAnimationFrame(() => {
      currentMode = newMode;
      updateFocusUI(newMode, true);
      updateQuickToggles(newMode);
    });
  };

  function updateFocusUI(mode, sendMessage = false) {
    currentMode = mode;
    
    dynamicFocusRadio.checked = false;
    fixedFocusRadio.checked = false;
    dynamicRow.classList.remove('active');
    fixedRow.classList.remove('active');
    
    void dynamicRow.offsetWidth;
    void fixedRow.offsetWidth;
    
    if (mode === 'dynamic') {
      dynamicFocusRadio.checked = true;
      dynamicRow.classList.add('active');
      timeoutInput.style.display = 'flex';
    } else if (mode === 'fixed') {
      fixedFocusRadio.checked = true;
      fixedRow.classList.add('active');
      timeoutInput.style.display = 'none';
    } else {
      timeoutInput.style.display = 'none';
    }
    
    if (sendMessage) {
      const timeout = parseInt(timeoutSeconds.value) * 1000;
      chrome.storage.local.set({ zfFocusMode: mode, zfTimeout: timeout });
      send({ action: "setFocusMode", mode, timeout });
    }
  }

  function updateQuickToggles(mode) {
    quickDynamicBtn.classList.toggle('active', mode === 'dynamic');
    quickFixedBtn.classList.toggle('active', mode === 'fixed');
  }

  timeoutSeconds.onchange = () => {
    let timeout = parseInt(timeoutSeconds.value);
    
    if (isNaN(timeout) || timeout < 2) {
      timeout = 2;
      timeoutSeconds.value = 2;
    } else if (timeout > 30) {
      timeout = 30;
      timeoutSeconds.value = 30;
    }
    
    timeout = timeout * 1000;
    chrome.storage.local.set({ zfTimeout: timeout });
    send({ action: "setTimeout", timeout });
  };

  focusOpacitySlider.oninput = () => {
    const opacity = parseInt(focusOpacitySlider.value) / 100;
    focusOpacityValue.textContent = Math.round(opacity * 100) + '%';
    chrome.storage.local.set({ zfFocusOpacity: opacity });
    
    clearTimeout(sliderDebounceTimer);
    sliderDebounceTimer = setTimeout(() => {
      send({ 
        action: "setFocusSettings", 
        focusOpacity: opacity,
        focusBlur: parseFloat(focusBlurSlider.value)
      });
    }, 150);
  };

  focusBlurSlider.oninput = () => {
    const blur = parseFloat(focusBlurSlider.value);
    focusBlurValue.textContent = blur + 'px';
    chrome.storage.local.set({ zfFocusBlur: blur });
    
    clearTimeout(sliderDebounceTimer);
    sliderDebounceTimer = setTimeout(() => {
      send({ 
        action: "setFocusSettings", 
        focusOpacity: parseInt(focusOpacitySlider.value) / 100,
        focusBlur: blur
      });
    }, 150);
  };

  undoBtn.onclick = async () => {
    await send({ action: "undo" });
  };

  brushBtn.onclick = async () => {
    await send({ action: "startBrush" });
    showStop();
    setTimeout(() => window.close(), 200);
  };

  stopBtn.onclick = async () => {
    await send({ action: "stopBrush" });
    showStart();
  };

  resetBtn.onclick = () => {
    if (!confirm("Reset everything?")) return;
    chrome.storage.local.clear();
    chrome.tabs.reload(tab.id);
  };

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
    if (scriptInjecting) return;
    
    const res = await new Promise(resolve => {
      chrome.tabs.sendMessage(tab.id, { action: "ping" }, r => {
        resolve(chrome.runtime.lastError ? null : r);
      });
    });

    if (!res) {
      scriptInjecting = true;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ["styles.css"]
        });
        await new Promise(r => setTimeout(r, 300));
      } finally {
        scriptInjecting = false;
      }
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
