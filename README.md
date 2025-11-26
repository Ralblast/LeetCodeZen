# 🎯 LeetCode Flow State

A Chrome extension that transforms your LeetCode experience with customizable video/image backgrounds and focus modes to help you enter a productive flow state while coding.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## ✨ Features

### 🖼️ **Background Customization**
- **Video Backgrounds**: YouTube, Vimeo, Pexels, or direct MP4 URLs
- **Image Backgrounds**: Unsplash, Pexels, Imgur, or any direct image URL
- **Local Media**: Use your own videos/images from local folders
- **Playlist**: Save and quickly switch between favorite backgrounds

### 🎨 **Aesthetic Mode**
- Apply glass morphism effect to UI elements
- Adjustable blur intensity (0-10px)
- Customizable opacity levels
- Make elements transparent or hidden

### 🎯 **Focus Mode**
- **Dynamic Focus**: Auto-adjusts when typing, helps reduce distractions
- **Fixed Focus**: Constant dimmed UI for maximum concentration
- Customizable timeout, opacity, and blur settings

### 🖌️ **Brush Mode**
- Interactive element manipulation with mouse
- Left-click: Toggle glass effect (55% → Transparent → 55%)
- Right-click: Hide/restore elements
- Arrow keys: Fine-tune opacity
- Undo support (up to 15 actions)

### ⌨️ **Keyboard Shortcuts**
- `Alt + 1`: Toggle Fixed Focus
- `Alt + 2`: Toggle Dynamic Focus
- `Alt + 3`: Toggle Brush Mode
- `Alt + 4`: Undo last action
- `↑ / ↓`: Adjust opacity in Brush Mode
- `Esc`: Exit Brush Mode

## 🚀 Installation

### Install from Chrome Web Store
*Coming soon*

### Manual Installation (Developer Mode)

1. **Download the extension**
   ```bash
   git clone  https://github.com/Ralblast/LeetCodeZen.git
   cd LeetCodeZen
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the extension folder

3. **Navigate to LeetCode**
   - Go to [leetcode.com](https://leetcode.com)
   - Click the extension icon to start customizing

## 📖 Usage

### Setting Up Background

1. Click the extension icon
2. In the "Image/Video Background" section:
   - Paste a URL (YouTube, Vimeo, Pexels, image URL)
   - Or select from local videos/images dropdown
3. Click "Apply"
4. Use "+" button to add to playlist for quick access

### Using Brush Mode

1. Click "Start Brush" or press `Alt + 3`
2. Hover over any element to highlight it
3. **Left-click**: Cycle through glass effects
4. **Right-click**: Hide/restore element
5. **Arrow keys**: Fine-tune opacity
6. Press `Esc` to exit

### Focus Mode

**Dynamic Focus** (recommended for coding):
- Dims UI when you start typing
- Restores after timeout (default: 6 seconds)
- Keeps you focused on code editor

**Fixed Focus**:
- Constant dimmed UI
- Best for reading problem statements

## 🎬 Supported Media Sources

### Videos
- ✅ YouTube (any video URL)
- ✅ Vimeo (public videos only)
- ✅ Pexels (auto-converts download links)
- ✅ Direct MP4/WebM URLs
- ✅ Local video files

### Images
- ✅ Unsplash
- ✅ Pexels
- ✅ Imgur
- ✅ Picsum Photos
- ✅ Any direct image URL (.jpg, .png, .gif, etc.)
- ✅ Local image files

## 📁 Adding Local Media

1. Create `videos/` or `images/` folder in extension directory
2. Add your files:
   - Videos: `video1.mp4`, `lofi.mp4`, etc.
   - Images: `image1.jpg`, `space.png`, etc.
3. Files will appear in dropdown menu automatically
4. Common names detected: space, lofi, nature, study, coding, rain, background

## 🛠️ Project Structure

```
leetcode-flow-state/
├── manifest.json          # Extension configuration
├── content.js             # Main functionality
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── styles.css             # Styling
├── images/                # Local images folder
│   └── .gitkeep
├── videos/                # Local videos folder
│   └── .gitkeep
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## ⚙️ Configuration

All settings are automatically saved to Chrome storage:
- Selected background URL
- Blur amount
- Focus mode preferences
- Opacity settings
- Playlist items

## 🐛 Troubleshooting

**Video won't play?**
- Ensure URL is a direct video file or supported platform
- For Pexels: Right-click video → "Copy video address"
- Private/restricted videos cannot be embedded

**Brush mode not working?**
- Make sure you're on a LeetCode page
- Try reloading the page
- Check if extension has permissions

**Extension not loading?**
- Reload extension in `chrome://extensions/`
- Check browser console for errors
- Ensure you're on `leetcode.com` domain

## 💡 Tips for Best Experience

- **For Coding**: Use Dynamic Focus with lofi video backgrounds
- **For Reading**: Use Fixed Focus with minimal backgrounds
- **For Customization**: Use Brush Mode to hide distracting elements
- **Performance**: Images load faster than videos on slower connections

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

### Development

1. Clone the repository
2. Make your changes
3. Test thoroughly on LeetCode
4. Submit a pull request with description

## 📝 License

MIT License - feel free to use this project however you'd like!

## 🙏 Acknowledgments

- Inspired by productivity and focus tools
- Built for the LeetCode community
- Background sources: YouTube, Vimeo, Pexels, Unsplash

## 📧 Contact

For questions or feedback, open an issue on GitHub.

## 🔄 Changelog

### Version 1.0.0 (Initial Release)
- ✅ Video and image background support
- ✅ Dynamic and Fixed Focus modes
- ✅ Brush Mode for element customization
- ✅ Playlist management
- ✅ Local media support
- ✅ Keyboard shortcuts
- ✅ Undo functionality

---

**Made with ❤️ for productive coding sessions**

**Star ⭐ this repo if you find it helpful!**
