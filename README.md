# Disable YouTube Hover Previews (Enhanced)

An improved userscript that completely disables video hover previews on YouTube with enhanced performance, configurability, and reliability.

## 🎯 Features

- **Complete Preview Blocking**: Disables all video thumbnail hover previews and animations.
- **Configurable Options**: Enable/disable specific features through Tampermonkey menu.
- **Enhanced Performance**: Optimized event handling and efficient DOM processing.
- **Multiple Prevention Methods**: CSS blocking, event interception, and API overrides.
- **Smart Detection**: Automatically handles new content loaded via YouTube's SPA navigation.
- **Memory Efficient**: Proper cleanup and resource management.
- **Debug Support**: Comprehensive logging and status monitoring.
- **Persistent Settings**: Settings automatically saved and restored.
- **Attribute Cleanup**: Removes preview-triggering attributes automatically.
- **Update Checker**: Menu option to check for new script versions.

## 🚀 Installation

1.  **Install a userscript manager** (if you don't have one already):
    * **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    * **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
    * **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

2.  **Click the link below to install the script**:
    * [**Install Disable YouTube Hover Previews (Enhanced)**](https://raw.githubusercontent.com/ODRise/YTDH/main/yt-disable-hover-previews.user.js)

3.  Your userscript manager should prompt you to confirm the installation.
4.  Once installed, the script should be automatically enabled.
5.  Reload any open YouTube pages. Hover previews will be disabled immediately.

## ✨ Improvements Over Original

### 🏗️ **Enhanced Architecture**
- **Modular Design**: Split into focused classes (`StyleManager`, `EventBlocker`, `AttributeManager`, `ThumbnailProcessor`).
- **Better Organization**: Clear separation of concerns and responsibilities.
- **Modern JavaScript**: Uses ES6+ features and modern patterns.
- **Error Handling**: Comprehensive error handling with graceful degradation.

### ⚡ **Performance Optimizations**
- **Debounced Processing**: Prevents excessive DOM operations during rapid changes.
- **Efficient Event Handling**: Smart event listener management with WeakSet tracking.
- **Optimized Selectors**: More targeted CSS selectors for better performance.
- **Memory Management**: Proper cleanup of timers, observers, and event listeners.

### 🛡️ **Enhanced Reliability**
- **Multiple Blocking Methods**: CSS hiding, event blocking, and API overrides.
- **Attribute Cleanup**: Automatically removes preview-triggering attributes.
- **YouTube API Override**: Disables preview functions at the source.
- **Robust Detection**: Better detection of thumbnail elements across different layouts.

### 🎛️ **Configurable Options**
- **Granular Control**: Enable/disable specific features independently.
- **Tampermonkey Menu**: Easy access to all settings.
- **Persistent Settings**: Settings automatically saved and restored.
- **Real-time Updates**: Settings changes apply immediately.

### 🔧 **Advanced Features**
- **Smart URL Detection**: Handles YouTube's single-page application navigation.
- **Periodic Cleanup**: Regular cleanup of preview-triggering elements.
- **Debug Interface**: Comprehensive status monitoring and logging.
- **Statistics Tracking**: Monitor blocked events and processed elements.

## 🎛️ Configuration Options

Access all settings through the Tampermonkey menu:

### Main Features
- **✅ Disable Hover Previews** - Blocks all video thumbnail hover previews.
- **✅ Disable Hover Effects** - Removes thumbnail scaling and visual effects on hover.
- **✅ Disable Animations** - Disables all thumbnail-related animations.
- **⚪ Debug Mode** - Enable detailed console logging for troubleshooting.
- **Check for Updates** - Manually check if a new version of the script is available.

*Note: ✅ indicates enabled options, ⚪ indicates disabled options*

### Customization Examples

Want to keep some effects? You can disable specific features:
- **Keep hover scaling** but disable previews: Turn off "Disable Hover Previews" only.
- **Minimal impact**: Disable just previews, keep animations and hover effects.
- **Maximum blocking**: Enable all options for complete preview elimination.

## 🔧 Usage

Once installed, the script works automatically:

1. **Immediate Effect**: Hover previews are disabled as soon as the script loads.
2. **Menu Access**: Access configuration through Tampermonkey menu.
3. **Customizable Blocking**: Choose which features to disable.
4. **Persistent Settings**: All preferences are automatically saved.
5. **No Page Refresh**: Changes apply immediately.

### Configuration

1. **Click Tampermonkey icon** in browser toolbar.
2. **Select desired options** to enable/disable specific features:
   - **Disable Hover Previews**: Blocks video previews on hover.
   - **Disable Hover Effects**: Removes thumbnail scaling and visual effects.
   - **Disable Animations**: Stops all thumbnail-related animations.
   - **Debug Mode**: Enable for troubleshooting.

### Verification

To verify the script is working:

1. **Hover over video thumbnails** - no previews should appear.
2. **Check for scaling effects** - thumbnails shouldn't grow on hover.
3. **Observe animations** - no loading or transition animations.
4. **Enable debug mode** to see detailed console activity.

## 🖥️ Browser Compatibility

- **Chrome/Chromium** ✅ Full support with all features.
- **Firefox** ✅ Full support with Tampermonkey/Greasemonkey.
- **Edge** ✅ Full support with all features.
- **Safari** ⚠️ Limited support (requires Tampermonkey).

### Userscript Manager Compatibility

| Manager         | Support Level | Menu Support | Settings Storage |
|-----------------|---------------|--------------|------------------|
| **Tampermonkey** | ✅ Full       | ✅ Yes       | ✅ Yes           |
| **Greasemonkey** | ✅ Good       | ⚠️ Limited   | ✅ Yes           |
| **Violentmonkey** | ✅ Good       | ✅ Yes       | ✅ Yes           |

## 📊 How It Works

### Multi-Layer Blocking Approach
- **CSS Hiding**: Uses `GM_addStyle` to inject CSS that hides preview elements.
- **Event Interception**: Blocks mouse events that trigger previews.
- **Attribute Cleanup**: Removes HTML attributes that enable preview functionality.
- **API Override**: Overrides YouTube's internal preview functions.

### Performance Optimization
- **Debounced Processing**: Prevents excessive DOM operations during rapid changes.
- **Efficient Targeting**: Uses specific selectors to minimize impact.
- **Memory Management**: Proper cleanup prevents memory leaks.
- **Smart Detection**: Only processes thumbnail-related changes.

### Dynamic Content Handling
- **SPA Navigation**: Handles YouTube's single-page application navigation.
- **Mutation Observer**: Monitors DOM changes for new thumbnails.
- **Periodic Cleanup**: Regular cleanup of preview-triggering elements.
- **URL Change Detection**: Reprocesses content when navigating to new pages.

## 🐛 Troubleshooting

### Previews Still Showing
1. **Check settings**: Ensure "Disable Hover Previews" is enabled.
2. **Browser cache**: Try clearing browser cache and reloading.
3. **Script conflicts**: Disable other YouTube-related scripts temporarily.
4. **Enable debug mode**: Check console for detailed operation logs.

### Performance Issues
1. **Disable debug mode**: Debug logging can impact performance.
2. **Check other extensions**: Other extensions may conflict.
3. **Browser resources**: High CPU usage might affect script performance.
4. **Reduce script features**: Try disabling animations or hover effects only.

### Settings Not Saving
1. **Check userscript manager**: Ensure GM storage permissions are granted.
2. **Browser storage**: Some browsers may block userscript storage.
3. **Script permissions**: Verify all GM permissions are enabled.
4. **Try manual reset**: Disable and re-enable the script.

### Debug Information

Enable debug mode and check console for:
```javascript
// Status check - run in browser console
window.youtubeHoverApp.getStatus();

// Example debug output:
// [YouTube Hover Disable] 14:30:15 DEBUG: Processed 25 elements for selector: ytd-thumbnail
// [YouTube Hover Disable] 14:30:15 INFO: Blocked 150 hover events
// [YouTube Hover Disable] 14:30:16 DEBUG: Removed 'moving' attribute from 3 elements

## 🔧 Advanced Features

### Granular Control
- **Preview Blocking Only**: Keep hover effects but disable video previews
- **Effect Removal**: Remove scaling/visual effects while keeping basic functionality
- **Animation Control**: Disable just loading animations for cleaner experience
- **Full Blocking**: Enable all options for complete preview elimination

### Statistics Monitoring
The script tracks various metrics:
- **Processed Thumbnails**: Number of thumbnail elements processed
- **Blocked Events**: Count of intercepted hover events
- **Removed Attributes**: Number of preview-triggering attributes removed

### API for Advanced Users
```javascript
// Access the app instance
const app = window.youtubeHoverApp;

// Get current status and statistics
console.log(app.getStatus());

// Check current settings
console.log(app.settingsManager.settings);

// Force processing of all thumbnails
app.thumbnailProcessor.processAllThumbnails();
```

## 📝 License

MIT License - feel free to modify and distribute.

## 🤝 Contributing

Found a bug or have an improvement? Feel free to:

- **Report Issues**: Submit detailed bug reports with console logs
- **Feature Requests**: Suggest new blocking features or improvements
- **Testing**: Test on different browsers and YouTube layouts
- **Performance**: Help optimize the script for better performance

### Known Limitations

- **YouTube Updates**: YouTube interface changes may require script updates
- **New Preview Types**: New preview mechanisms may need additional blocking
- **Browser Differences**: Some browsers may handle CSS injection differently
- **Menu Refresh**: Menu changes require script restart to show updated checkmarks

---

**Note**: This script enhances your YouTube browsing experience by eliminating distracting hover previews while maintaining all other functionality.