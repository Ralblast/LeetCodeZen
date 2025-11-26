# LeetCode Flow State

A Chrome extension that transforms your LeetCode experience with custom video backgrounds and adaptive glass UI.

## What is this?

Tired of staring at LeetCode's plain interface during long coding sessions? This extension lets you set any video as your background (lofi beats, nature scenes, whatever works for you) and gives you full control over which UI elements you want to see.

The brush tool lets you click on any element to make it glass-like, transparent, or completely hidden. The focus mode automatically adjusts opacity and blur based on whether you're typing or thinking, so the video doesn't distract you mid-problem.

## Installation

1. Download or clone this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. Open any LeetCode problem page

## Features

**Video Backgrounds**
- YouTube or direct MP4 links
- Saves up to 10 videos in a playlist
- Auto-plays in 1080p (or best available quality)

**Brush Mode**
- Left click: cycle between glass and transparent
- Right click: hide or restore elements
- Up/Down arrows: adjust opacity
- Alt+Z: undo last change (stores last 15 actions)

**Focus Modes**
- Dynamic: automatically applies when you type, reverts after 6 seconds idle
- Fixed: stays on until you turn it off manually
- Customize opacity (40-100%) and blur (0-7px) for each mode

**Quick Controls**
- Two buttons at the top of the popup for instant mode switching
- Collapsible sections to save space
- All settings saved automatically

## Usage

1. Click the extension icon
2. Paste a video URL and hit "Apply"
3. Click "Start Brush" to begin customizing
4. Click elements to make them glass/transparent/hidden
5. Press Escape when done
6. Toggle Dynamic or Fixed focus mode if you want

The aesthetic mode blur slider controls how blurry glass elements are when you're not actively coding.

## Tips

- Start with the problem description - make it semi-transparent so you can see the video but still read
- Hide the related topics section if it spoils solutions
- Set Fixed mode to 90% opacity and 1px blur for hardcore focus
- Dynamic mode with 6 seconds works well for interview prep (gives you thinking time)

## Settings

Everything persists across sessions:
- Your video URL and playlist
- Blur amount
- Focus mode settings
- Which sections are collapsed in the popup

The only thing that doesn't persist is which elements you've made glass/hidden (LeetCode's DOM structure changes too much between pages).

## Technical Notes

- Only works on leetcode.com domains
- Video background uses GPU acceleration for smooth performance
- Undo history is limited to 15 actions to avoid memory issues
- Sliders are debounced (150ms) to reduce message spam

## Keyboard Shortcuts

While brush mode is active:
- **Left click** - Glass/Transparent toggle
- **Right click** - Hide/Restore
- **↑** - Increase opacity
- **↓** - Decrease opacity  
- **Alt+Z** - Undo
- **Escape** - Exit brush mode

## Known Issues

- Focus mode doesn't work in brush mode (by design - prevents conflicts)
- Transparent elements (0% opacity) are ignored by focus mode
- If you switch problems mid-session, glass elements won't carry over

## Why I Built This

I spend hours on LeetCode and the white interface was straining my eyes during night sessions. Started with just a video background, then added the glass UI because I liked having both the problem description and the video visible. Focus mode came from realizing I wanted different levels of distraction at different times.

Built it for myself but figured others might find it useful.

## License

Not for any monetization purposes.

---

If something breaks or you have ideas, open an issue. I check GitHub sporadically but will get to it eventually.
