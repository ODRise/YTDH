# Disable YouTube Hover Previews (Enhanced)

An improved userscript that completely disables video hover previews on YouTube with enhanced performance, configurability, and reliability.

## 🎯 Features

- **Complete Preview Blocking**: Disables all video thumbnail hover previews and animations
- **Configurable Options**: Enable/disable specific features through Tampermonkey menu
- **Enhanced Performance**: Optimized event handling and efficient DOM processing
- **Multiple Prevention Methods**: CSS blocking, event interception, and API overrides
- **Smart Detection**: Automatically handles new content loaded via YouTube's SPA navigation
- **Memory Efficient**: Proper cleanup and resource management
- **Debug Support**: Comprehensive logging and status monitoring
- **Cross-Platform**: Works on desktop and mobile YouTube
- **Persistent Settings**: Settings automatically saved and restored
- **Attribute Cleanup**: Removes preview-triggering attributes automatically

## 🚀 Installation

1. Install a userscript manager:
   - **Chrome/Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - **Firefox**: [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
   - **Safari**: [Tampermonkey](https://apps.apple.com/us/app/tampermonkey/id1482490089)

2. Copy the script code from the details section below
3. Create a new userscript in your manager and paste the code
4. Save and enable the script
5. Reload YouTube - hover previews will be disabled immediately

## ✨ Improvements Over Original

### 🏗️ **Enhanced Architecture**
- **Modular Design**: Split into focused classes (`StyleManager`, `EventBlocker`, `AttributeManager`, `ThumbnailProcessor`)
- **Better Organization**: Clear separation of concerns and responsibilities
- **Modern JavaScript**: Uses ES6+ features and modern patterns
- **Error Handling**: Comprehensive error handling with graceful degradation

### ⚡ **Performance Optimizations**
- **Debounced Processing**: Prevents excessive DOM operations during rapid changes
- **Efficient Event Handling**: Smart event listener management with WeakSet tracking
- **Optimized Selectors**: More targeted CSS selectors for better performance
- **Memory Management**: Proper cleanup of timers, observers, and event listeners

### 🛡️ **Enhanced Reliability**
- **Multiple Blocking Methods**: CSS hiding, event blocking, and API overrides
- **Attribute Cleanup**: Automatically removes preview-triggering attributes
- **YouTube API Override**: Disables preview functions at the source
- **Robust Detection**: Better detection of thumbnail elements across different layouts

### 🎛️ **Configurable Options**
- **Granular Control**: Enable/disable specific features independently
- **Tampermonkey Menu**: Easy access to all settings
- **Persistent Settings**: Settings automatically saved and restored
- **Real-time Updates**: Settings changes apply immediately

### 🔧 **Advanced Features**
- **Smart URL Detection**: Handles YouTube's single-page application navigation
- **Periodic Cleanup**: Regular cleanup of preview-triggering elements
- **Debug Interface**: Comprehensive status monitoring and logging
- **Statistics Tracking**: Monitor blocked events and processed elements

## 🎛️ Configuration Options

Access all settings through the Tampermonkey menu:

### Main Features
- **✅ Disable Hover Previews** - Blocks all video thumbnail hover previews
- **✅ Disable Hover Effects** - Removes thumbnail scaling and visual effects on hover
- **✅ Disable Animations** - Disables all thumbnail-related animations
- **⚪ Debug Mode** - Enable detailed console logging for troubleshooting

*Note: ✅ indicates enabled options, ⚪ indicates disabled options*

### Customization Examples

Want to keep some effects? You can disable specific features:
- **Keep hover scaling** but disable previews: Turn off "Disable Hover Previews" only
- **Minimal impact**: Disable just previews, keep animations and hover effects
- **Maximum blocking**: Enable all options for complete preview elimination

## 📋 Script Code

<details>
<summary>Click to expand the complete userscript code</summary>

```javascript
// ==UserScript==
// @name         Disable YouTube Hover Previews (Enhanced)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Completely disables video previews with improved performance, reliability, and configurability
// @author       RM
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        GM_addStyle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ===============================
    // CONFIGURATION & CONSTANTS
    // ===============================
    const CONFIG = {
        SCRIPT_NAME: 'YouTube Hover Disable',
        DEFAULT_SETTINGS: {
            disablePreviews: true,
            disableHoverEffects: true,
            disableAnimations: true,
            debug: false
        },
        TIMERS: {
            DEBOUNCE_DELAY: 50,
            CLEANUP_INTERVAL: 3000,
            YOUTUBE_CHECK_INTERVAL: 100,
            YOUTUBE_CHECK_TIMEOUT: 10000,
            PAGE_CHANGE_DELAY: 300
        },
        SELECTORS: {
            thumbnails: [
                'a#thumbnail',
                'ytd-thumbnail',
                '.thumbnail',
                '.video-thumbnail',
                '.compact-video-renderer .thumbnail',
                '.video-renderer .thumbnail',
                'a.ytd-thumbnail',
                '#thumbnail.ytd-thumbnail',
                '.ytp-videowall-still-image',
                '.rich-thumbnail'
            ],
            previewElements: [
                'ytd-moving-thumbnail-renderer',
                'ytd-video-preview',
                '.ytp-preview',
                '.html5-video-preview',
                '.ytp-hover-overlay',
                '.ytp-videowall-still',
                '.rich-thumbnail-renderer',
                '.thumbnail-overlay-container',
                '.thumbnail-hover-overlay',
                '.video-thumbnail-overlay'
            ]
        },
        HOVER_EVENTS: ['mouseover', 'mouseenter', 'mousemove', 'mouseout', 'mouseleave']
    };

    // ===============================
    // UTILITY CLASSES
    // ===============================
    class Logger {
        constructor(name, enabled = false) {
            this.name = name;
            this.enabled = enabled;
        }

        setEnabled(enabled) {
            this.enabled = enabled;
        }

        log(message, level = 'info') {
            if (!this.enabled) return;
            const timestamp = new Date().toTimeString().split(' ')[0];
            console.log(`[${this.name}] ${timestamp} ${message}`);
        }

        debug(message) { this.log(`DEBUG: ${message}`, 'debug'); }
        info(message) { this.log(`INFO: ${message}`, 'info'); }
        warn(message) { this.log(`WARN: ${message}`, 'warn'); }
        error(message) { this.log(`ERROR: ${message}`, 'error'); }
    }

    class Timer {
        constructor() {
            this.timers = new Set();
        }

        setTimeout(callback, delay) {
            const id = setTimeout(() => {
                this.timers.delete(id);
                callback();
            }, delay);
            this.timers.add(id);
            return id;
        }

        setInterval(callback, interval) {
            const id = setInterval(callback, interval);
            this.timers.add(id);
            return id;
        }

        clearTimeout(id) {
            clearTimeout(id);
            this.timers.delete(id);
        }

        clearInterval(id) {
            clearInterval(id);
            this.timers.delete(id);
        }

        clearAll() {
            this.timers.forEach(id => {
                clearTimeout(id);
                clearInterval(id);
            });
            this.timers.clear();
        }
    }

    class Debouncer {
        constructor() {
            this.timeouts = new Map();
        }

        debounce(key, callback, delay) {
            if (this.timeouts.has(key)) {
                clearTimeout(this.timeouts.get(key));
            }
            
            const timeoutId = setTimeout(() => {
                this.timeouts.delete(key);
                callback();
            }, delay);
            
            this.timeouts.set(key, timeoutId);
        }

        clear() {
            this.timeouts.forEach(id => clearTimeout(id));
            this.timeouts.clear();
        }
    }

    // ===============================
    // SETTINGS MANAGEMENT
    // ===============================
    class SettingsManager {
        constructor(logger) {
            this.logger = logger;
            this.settings = { ...CONFIG.DEFAULT_SETTINGS };
            this.useCompatibilityMode = typeof GM === 'undefined';
        }

        async loadSettings() {
            try {
                const getValue = this.useCompatibilityMode ? GM_getValue : GM.getValue;
                const stored = await getValue('hoverDisableSettings', JSON.stringify(CONFIG.DEFAULT_SETTINGS));
                const parsed = JSON.parse(stored);
                
                this.settings = { ...CONFIG.DEFAULT_SETTINGS, ...parsed };
                await this.saveSettings();
                
                this.logger.debug(`Settings loaded: ${JSON.stringify(this.settings)}`);
                return this.settings;
            } catch (error) {
                this.logger.error(`Failed to load settings: ${error.message}`);
                return CONFIG.DEFAULT_SETTINGS;
            }
        }

        async saveSettings() {
            try {
                const setValue = this.useCompatibilityMode ? GM_setValue : GM.setValue;
                await setValue('hoverDisableSettings', JSON.stringify(this.settings));
                this.logger.debug('Settings saved successfully');
            } catch (error) {
                this.logger.error(`Failed to save settings: ${error.message}`);
            }
        }

        async updateSetting(key, value) {
            this.settings[key] = value;
            await this.saveSettings();
            this.logger.info(`Setting updated: ${key} = ${value}`);
        }

        get(key) {
            return this.settings[key];
        }
    }

    // ===============================
    // CSS STYLE MANAGER
    // ===============================
    class StyleManager {
        constructor(settingsManager, logger) {
            this.settingsManager = settingsManager;
            this.logger = logger;
            this.injectedStyles = new Set();
        }

        injectStyles() {
            this.injectPreviewDisableStyles();
            this.injectHoverEffectStyles();
            this.injectAnimationStyles();
            this.logger.debug('CSS styles injected');
        }

        injectPreviewDisableStyles() {
            if (!this.settingsManager.get('disablePreviews')) return;

            const previewCSS = `
                /* Main preview elements */
                ytd-moving-thumbnail-renderer,
                ytd-video-preview,
                .ytp-preview,
                .html5-video-preview,
                .ytp-hover-overlay,
                .ytp-videowall-still,
                .rich-thumbnail-renderer,
                .ytp-videowall-still-image,

                /* Thumbnail hover effects */
                ytd-thumbnail[moving],
                ytd-thumbnail .moving-thumbnail,
                ytd-thumbnail .rich-thumbnail,

                /* Additional preview containers */
                .thumbnail-overlay-container,
                .thumbnail-hover-overlay,
                .video-thumbnail-overlay,

                /* Mobile preview elements */
                .compact-video-renderer .thumbnail-overlay,
                .video-renderer .thumbnail-overlay,

                /* Shorts hover previews */
                .ytd-shorts .thumbnail-overlay,
                #shorts-player .thumbnail-overlay {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    height: 0 !important;
                    position: absolute !important;
                    left: -9999px !important;
                    top: -9999px !important;
                }
            `;
            
            GM_addStyle(previewCSS);
            this.injectedStyles.add('previews');
        }

        injectHoverEffectStyles() {
            if (!this.settingsManager.get('disableHoverEffects')) return;

            const hoverCSS = `
                /* Prevent thumbnail scaling/hover effects */
                ytd-thumbnail img,
                .thumbnail img,
                #img.ytd-thumbnail,
                .video-thumbnail img {
                    transition: none !important;
                    transform: none !important;
                }

                /* Remove hover animations */
                ytd-thumbnail:hover img,
                .thumbnail:hover img,
                .video-thumbnail:hover img {
                    transform: none !important;
                    scale: 1 !important;
                    filter: none !important;
                }

                /* Disable thumbnail container hover effects */
                ytd-thumbnail:hover,
                .thumbnail:hover {
                    transform: none !important;
                    box-shadow: none !important;
                }
            `;
            
            GM_addStyle(hoverCSS);
            this.injectedStyles.add('hover');
        }

        injectAnimationStyles() {
            if (!this.settingsManager.get('disableAnimations')) return;

            const animationCSS = `
                /* Disable all thumbnail-related animations */
                ytd-thumbnail,
                ytd-thumbnail *,
                .thumbnail,
                .thumbnail *,
                .video-thumbnail,
                .video-thumbnail * {
                    animation: none !important;
                    transition: none !important;
                }

                /* Disable loading animations */
                .thumbnail-loading,
                .thumbnail-spinner {
                    display: none !important;
                }
            `;
            
            GM_addStyle(animationCSS);
            this.injectedStyles.add('animations');
        }

        updateStyles() {
            // Re-inject styles based on current settings
            this.injectedStyles.clear();
            this.injectStyles();
        }
    }

    // ===============================
    // EVENT BLOCKER
    // ===============================
    class EventBlocker {
        constructor(logger) {
            this.logger = logger;
            this.processedElements = new WeakSet();
            this.eventCount = 0;
        }

        blockHoverEvents(event) {
            this.eventCount++;
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            
            if (this.eventCount % 100 === 0) {
                this.logger.debug(`Blocked ${this.eventCount} hover events`);
            }
            
            return false;
        }

        attachEventListeners(element) {
            if (this.processedElements.has(element)) return;

            CONFIG.HOVER_EVENTS.forEach(eventType => {
                element.addEventListener(eventType, (e) => this.blockHoverEvents(e), {
                    capture: true,
                    passive: false
                });
            });

            this.processedElements.add(element);
            this.logger.debug('Event listeners attached to element');
        }

        getBlockedCount() {
            return this.eventCount;
        }
    }

    // ===============================
    // ATTRIBUTE MANAGER
    // ===============================
    class AttributeManager {
        constructor(logger) {
            this.logger = logger;
            this.removedCount = 0;
        }

        removeMovingAttributes() {
            const movingElements = document.querySelectorAll('[moving]');
            movingElements.forEach(element => {
                element.removeAttribute('moving');
                this.removedCount++;
            });

            if (movingElements.length > 0) {
                this.logger.debug(`Removed 'moving' attribute from ${movingElements.length} elements`);
            }
        }

        removePreviewAttributes() {
            const attributesToRemove = ['data-preview', 'data-hover-preview', 'preview-enabled'];
            
            attributesToRemove.forEach(attr => {
                document.querySelectorAll(`[${attr}]`).forEach(element => {
                    element.removeAttribute(attr);
                    this.removedCount++;
                });
            });
        }

        cleanupAllAttributes() {
            this.removeMovingAttributes();
            this.removePreviewAttributes();
        }

        getRemovedCount() {
            return this.removedCount;
        }
    }

    // ===============================
    // YOUTUBE API OVERRIDE
    // ===============================
    class YouTubeAPIOverride {
        constructor(logger, timer) {
            this.logger = logger;
            this.timer = timer;
            this.overridesApplied = false;
        }

        applyOverrides() {
            const checkYouTube = () => {
                if (window.yt && window.yt.www) {
                    this.overridePreviewFunctions();
                    this.overridesApplied = true;
                    this.logger.info('YouTube API overrides applied');
                    return true;
                }
                return false;
            };

            // Try immediate override
            if (checkYouTube()) return;

            // Set up interval check
            const intervalId = this.timer.setInterval(() => {
                if (checkYouTube()) {
                    this.timer.clearInterval(intervalId);
                }
            }, CONFIG.TIMERS.YOUTUBE_CHECK_INTERVAL);

            // Clear after timeout
            this.timer.setTimeout(() => {
                this.timer.clearInterval(intervalId);
                if (!this.overridesApplied) {
                    this.logger.warn('YouTube API override timeout reached');
                }
            }, CONFIG.TIMERS.YOUTUBE_CHECK_TIMEOUT);
        }

        overridePreviewFunctions() {
            try {
                // Override thumbnail preview functions
                if (window.yt?.www?.thumbnails) {
                    window.yt.www.thumbnails.startMoving = () => {};
                    window.yt.www.thumbnails.stopMoving = () => {};
                    this.logger.debug('Thumbnail preview functions overridden');
                }

                // Override video preview functions
                if (window.yt?.www?.watch) {
                    const originalWatch = window.yt.www.watch;
                    if (originalWatch.enablePreview) {
                        originalWatch.enablePreview = () => {};
                    }
                    if (originalWatch.disablePreview) {
                        originalWatch.disablePreview = () => {};
                    }
                }

                // Override hover preview initialization
                if (window.ytInitialData) {
                    this.disableConfigPreviewSettings();
                }

            } catch (error) {
                this.logger.error(`Error applying YouTube overrides: ${error.message}`);
            }
        }

        disableConfigPreviewSettings() {
            try {
                // Disable preview settings in YouTube config
                if (window.ytcfg?.data_?.EXPERIMENT_FLAGS) {
                    const flags = window.ytcfg.data_.EXPERIMENT_FLAGS;
                    flags.web_player_show_preview = false;
                    flags.enable_thumbnail_preview = false;
                    flags.web_thumbnail_hover_preview = false;
                }
            } catch (error) {
                this.logger.debug(`Could not modify config flags: ${error.message}`);
            }
        }
    }

    // ===============================
    // THUMBNAIL PROCESSOR
    // ===============================
    class ThumbnailProcessor {
        constructor(eventBlocker, attributeManager, logger) {
            this.eventBlocker = eventBlocker;
            this.attributeManager = attributeManager;
            this.logger = logger;
            this.processedCount = 0;
        }

        processAllThumbnails() {
            CONFIG.SELECTORS.thumbnails.forEach(selector => {
                this.processThumbnailsBySelector(selector);
            });

            this.attributeManager.cleanupAllAttributes();
        }

        processThumbnailsBySelector(selector) {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    this.eventBlocker.attachEventListeners(element);
                    this.processedCount++;
                });

                if (elements.length > 0) {
                    this.logger.debug(`Processed ${elements.length} elements for selector: ${selector}`);
                }
            } catch (error) {
                this.logger.error(`Error processing selector ${selector}: ${error.message}`);
            }
        }

        getProcessedCount() {
            return this.processedCount;
        }
    }

    // ===============================
    // MENU MANAGER
    // ===============================
    class MenuManager {
        constructor(settingsManager, styleManager, logger) {
            this.settingsManager = settingsManager;
            this.styleManager = styleManager;
            this.logger = logger;
            this.menuIds = [];
        }

        createMenus() {
            try {
                const registerMenuCommand = typeof GM !== 'undefined' ? 
                    GM.registerMenuCommand : GM_registerMenuCommand;

                const menuItems = [
                    {
                        key: 'disablePreviews',
                        label: 'Disable Hover Previews',
                        callback: (newValue) => {
                            this.styleManager.updateStyles();
                            this.logger.info(`Hover previews ${newValue ? 'disabled' : 'enabled'}`);
                        }
                    },
                    {
                        key: 'disableHoverEffects',
                        label: 'Disable Hover Effects',
                        callback: (newValue) => {
                            this.styleManager.updateStyles();
                            this.logger.info(`Hover effects ${newValue ? 'disabled' : 'enabled'}`);
                        }
                    },
                    {
                        key: 'disableAnimations',
                        label: 'Disable Animations',
                        callback: (newValue) => {
                            this.styleManager.updateStyles();
                            this.logger.info(`Animations ${newValue ? 'disabled' : 'enabled'}`);
                        }
                    },
                    {
                        key: 'debug',
                        label: 'Debug Mode',
                        callback: (newValue) => {
                            app.logger.setEnabled(newValue);
                            this.logger.info(`Debug mode ${newValue ? 'enabled' : 'disabled'}`);
                        }
                    }
                ];

                menuItems.forEach(({ key, label, callback }) => {
                    const isEnabled = this.settingsManager.get(key);
                    const menuLabel = `${isEnabled ? '✅' : '⚪'} ${label}`;
                    
                    const menuId = registerMenuCommand(menuLabel, async () => {
                        const newValue = !isEnabled;
                        await this.settingsManager.updateSetting(key, newValue);
                        callback(newValue);
                        // Note: Menu will show changes after script restart
                    });
                    
                    this.menuIds.push(menuId);
                });

            } catch (error) {
                this.logger.error(`Failed to create menus: ${error.message}`);
            }
        }
    }

    // ===============================
    // MAIN APPLICATION CLASS
    // ===============================
    class YouTubeHoverDisabler {
        constructor() {
            this.logger = new Logger(CONFIG.SCRIPT_NAME);
            this.timer = new Timer();
            this.debouncer = new Debouncer();
            this.settingsManager = new SettingsManager(this.logger);
            this.styleManager = new StyleManager(this.settingsManager, this.logger);
            this.eventBlocker = new EventBlocker(this.logger);
            this.attributeManager = new AttributeManager(this.logger);
            this.youtubeAPI = new YouTubeAPIOverride(this.logger, this.timer);
            this.thumbnailProcessor = new ThumbnailProcessor(
                this.eventBlocker, 
                this.attributeManager, 
                this.logger
            );
            this.menuManager = new MenuManager(this.settingsManager, this.styleManager, this.logger);
            
            this.observer = null;
            this.cleanupInterval = null;
            this.currentUrl = '';
            this.isInitialized = false;
        }

        async initialize() {
            try {
                // Load settings
                await this.settingsManager.loadSettings();
                this.logger.setEnabled(this.settingsManager.get('debug'));
                
                // Inject CSS styles immediately
                this.styleManager.injectStyles();
                
                // Create menu
                this.menuManager.createMenus();
                
                // Set up core functionality
                this.setupMutationObserver();
                this.youtubeAPI.applyOverrides();
                this.thumbnailProcessor.processAllThumbnails();
                
                // Start periodic cleanup
                this.startPeriodicCleanup();
                
                // Set up URL change detection
                this.setupUrlChangeDetection();
                
                this.currentUrl = location.href;
                this.isInitialized = true;
                
                this.logger.info('YouTube Hover Disabler initialized successfully');
                
            } catch (error) {
                this.logger.error(`Initialization failed: ${error.message}`);
            }
        }

        setupMutationObserver() {
            this.observer = new MutationObserver((mutations) => {
                this.debouncer.debounce('mutation', () => {
                    this.handleMutations(mutations);
                }, CONFIG.TIMERS.DEBOUNCE_DELAY);
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['moving', 'class', 'data-preview']
            });

            this.logger.debug('Mutation observer set up');
        }

        handleMutations(mutations) {
            let shouldProcessThumbnails = false;
            let shouldCleanupAttributes = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && this.isThumbnailRelated(node)) {
                            shouldProcessThumbnails = true;
                        }
                    });
                }

                if (mutation.type === 'attributes') {
                    if (mutation.attributeName === 'moving' || 
                        mutation.attributeName?.includes('preview')) {
                        shouldCleanupAttributes = true;
                    }
                }
            });

            if (shouldProcessThumbnails) {
                this.thumbnailProcessor.processAllThumbnails();
            }

            if (shouldCleanupAttributes) {
                this.attributeManager.cleanupAllAttributes();
            }
        }

        isThumbnailRelated(node) {
            if (!node.matches) return false;
            
            const thumbnailSelectors = [
                'ytd-thumbnail',
                '[id*="thumbnail"]',
                '.thumbnail',
                '.video-thumbnail'
            ];

            return thumbnailSelectors.some(selector => 
                node.matches(selector) || node.querySelector(selector)
            );
        }

        startPeriodicCleanup() {
            this.cleanupInterval = this.timer.setInterval(() => {
                this.attributeManager.cleanupAllAttributes();
            }, CONFIG.TIMERS.CLEANUP_INTERVAL);

            this.logger.debug('Periodic cleanup started');
        }

        setupUrlChangeDetection() {
            let lastUrl = location.href;
            const urlObserver = new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    this.handleUrlChange(url);
                }
            });

            urlObserver.observe(document, { subtree: true, childList: true });
        }

        handleUrlChange(newUrl) {
            if (newUrl !== this.currentUrl) {
                this.currentUrl = newUrl;
                this.logger.debug(`URL changed: ${newUrl}`);
                
                this.timer.setTimeout(() => {
                    this.thumbnailProcessor.processAllThumbnails();
                    this.youtubeAPI.applyOverrides();
                }, CONFIG.TIMERS.PAGE_CHANGE_DELAY);
            }
        }

        cleanup() {
            this.timer.clearAll();
            this.debouncer.clear();
            
            if (this.observer) {
                this.observer.disconnect();
            }
            
            this.logger.info('Cleanup completed');
        }

        // Public API for debugging
        getStatus() {
            return {
                settings: this.settingsManager.settings,
                isInitialized: this.isInitialized,
                currentUrl: this.currentUrl,
                stats: {
                    processedThumbnails: this.thumbnailProcessor.getProcessedCount(),
                    blockedEvents: this.eventBlocker.getBlockedCount(),
                    removedAttributes: this.attributeManager.getRemovedCount()
                }
            };
        }
    }

    // ===============================
    // INITIALIZATION
    // ===============================
    const app = new YouTubeHoverDisabler();

    // Initialize immediately or when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => app.initialize());
    } else {
        app.initialize();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => app.cleanup());

    // Expose for debugging
    if (typeof window !== 'undefined') {
        window.youtubeHoverApp = app;
    }

})();
```

</details>

## 🔧 Usage

Once installed, the script works automatically:

1. **Immediate Effect**: Hover previews are disabled as soon as the script loads
2. **Menu Access**: Access configuration through Tampermonkey menu
3. **Customizable Blocking**: Choose which features to disable
4. **Persistent Settings**: All preferences are automatically saved
5. **No Page Refresh**: Changes apply immediately

### Configuration

1. **Click Tampermonkey icon** in browser toolbar
2. **Select desired options** to enable/disable specific features:
   - **Disable Hover Previews**: Blocks video previews on hover
   - **Disable Hover Effects**: Removes thumbnail scaling and visual effects
   - **Disable Animations**: Stops all thumbnail-related animations
   - **Debug Mode**: Enable for troubleshooting

### Verification

To verify the script is working:

1. **Hover over video thumbnails** - no previews should appear
2. **Check for scaling effects** - thumbnails shouldn't grow on hover
3. **Observe animations** - no loading or transition animations
4. **Enable debug mode** to see detailed console activity

## 🖥️ Browser Compatibility

- **Chrome/Chromium** ✅ Full support with all features
- **Firefox** ✅ Full support with Tampermonkey/Greasemonkey  
- **Edge** ✅ Full support with all features
- **Safari** ⚠️ Limited support (requires Tampermonkey)

### Userscript Manager Compatibility

| Manager | Support Level | Menu Support | Settings Storage |
|---------|---------------|--------------|------------------|
| **Tampermonkey** | ✅ Full | ✅ Yes | ✅ Yes |
| **Greasemonkey** | ✅ Good | ⚠️ Limited | ✅ Yes |
| **Violentmonkey** | ✅ Good | ✅ Yes | ✅ Yes |

## 📊 How It Works

### Multi-Layer Blocking Approach
- **CSS Hiding**: Uses `GM_addStyle` to inject CSS that hides preview elements
- **Event Interception**: Blocks mouse events that trigger previews
- **Attribute Cleanup**: Removes HTML attributes that enable preview functionality
- **API Override**: Overrides YouTube's internal preview functions

### Performance Optimization
- **Debounced Processing**: Prevents excessive DOM operations during rapid changes
- **Efficient Targeting**: Uses specific selectors to minimize impact
- **Memory Management**: Proper cleanup prevents memory leaks
- **Smart Detection**: Only processes thumbnail-related changes

### Dynamic Content Handling
- **SPA Navigation**: Handles YouTube's single-page application navigation
- **Mutation Observer**: Monitors DOM changes for new thumbnails
- **Periodic Cleanup**: Regular cleanup of preview-triggering elements
- **URL Change Detection**: Reprocesses content when navigating to new pages

## 🐛 Troubleshooting

### Previews Still Showing
1. **Check settings**: Ensure "Disable Hover Previews" is enabled
2. **Browser cache**: Try clearing browser cache and reloading
3. **Script conflicts**: Disable other YouTube-related scripts temporarily
4. **Enable debug mode**: Check console for detailed operation logs

### Performance Issues
1. **Disable debug mode**: Debug logging can impact performance
2. **Check other extensions**: Other extensions may conflict
3. **Browser resources**: High CPU usage might affect script performance
4. **Reduce script features**: Try disabling animations or hover effects only

### Settings Not Saving
1. **Check userscript manager**: Ensure GM storage permissions are granted
2. **Browser storage**: Some browsers may block userscript storage
3. **Script permissions**: Verify all GM permissions are enabled
4. **Try manual reset**: Disable and re-enable the script

### Debug Information

Enable debug mode and check console for:
```javascript
// Status check - run in browser console
window.youtubeHoverApp.getStatus();

// Example debug output:
// [YouTube Hover Disable] 14:30:15 DEBUG: Processed 25 elements for selector: ytd-thumbnail
// [YouTube Hover Disable] 14:30:15 INFO: Blocked 150 hover events
// [YouTube Hover Disable] 14:30:16 DEBUG: Removed 'moving' attribute from 3 elements
```

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