// ==UserScript==
// @name         Disable YouTube Hover Previews (Enhanced)
// @namespace    http://tampermonkey.net/
// @version      3.1.1
// @description  Completely disables video previews with improved performance, reliability, and configurability
// @author       RM
// @homepageURL  https://github.com/ODRise/YTDH
// @match        *://*.youtube.com/*/*
// @exclude      *://music.music.youtube.com/*/1/*
// @exclude      *://studio.music.youtube.com/*/2/*
// @grant        GM_addStyle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_notification
// @downloadURL  https://raw.githubusercontent.com/ODRise/YTDH/main/yt-disable-hover-previews.user.js
// @updateURL    https://raw.githubusercontent.com/ODRise/YTDH/main/yt-disable-hover-previews.user.js
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
    // UTILITY FUNCTIONS (NEW for version comparison)
    // ===============================
    function compareVersions(v1, v2) {
        const parts1 = String(v1).split('.').map(Number);
        const parts2 = String(v2).split('.').map(Number);
        const len = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < len; i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    }

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

        _formatMessage(message) { // Made private helper
            const scriptName = (typeof GM_info !== 'undefined' && GM_info.script) ? GM_info.script.name : this.name;
            const timestamp = new Date().toTimeString().split(' ')[0];
            return `[${scriptName}] ${timestamp} ${message}`;
        }

        log(message) { // General purpose log
            if (!this.enabled && !CONFIG.DEFAULT_SETTINGS.debug) return; // Check global debug if local not enabled
            console.log(this._formatMessage(message));
        }

        error(message) { // Errors should always be logged
            console.error(this._formatMessage(`ERROR: ${message}`));
        }

        warn(message) {
            if (!this.enabled && !CONFIG.DEFAULT_SETTINGS.debug) return;
            console.warn(this._formatMessage(`WARN: ${message}`));
        }

        debug(message) { // Specific debug messages
            if (!this.enabled) return;
            console.debug(this._formatMessage(`DEBUG: ${message}`));
        }
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
                clearTimeout(id); // clearTimeout works for setInterval IDs too
                // clearInterval(id); // This line is redundant if clearTimeout is used for all
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
            this.useCompatibilityMode = typeof GM === 'undefined' || typeof GM.getValue === 'undefined';
        }

        async loadSettings() {
            try {
                const getValue = this.useCompatibilityMode ? GM_getValue : GM.getValue;
                const stored = await getValue('hoverDisableSettings', JSON.stringify(CONFIG.DEFAULT_SETTINGS));
                const parsed = JSON.parse(stored);

                this.settings = { ...CONFIG.DEFAULT_SETTINGS, ...parsed };
                 // Ensure boolean values for toggles
                ['disablePreviews', 'disableHoverEffects', 'disableAnimations', 'debug'].forEach(key => {
                    if (typeof this.settings[key] !== 'boolean') {
                        this.logger.warn(`Invalid type for setting ${key}, reverting to default.`);
                        this.settings[key] = CONFIG.DEFAULT_SETTINGS[key];
                    }
                });
                await this.saveSettings(); // Save after potential validation/migration

                this.logger.debug(`Settings loaded: ${JSON.stringify(this.settings)}`);
                return this.settings;
            } catch (error) {
                this.logger.error(`Failed to load settings: ${error.message}. Using default settings.`);
                this.settings = { ...CONFIG.DEFAULT_SETTINGS }; // Fallback to defaults
                return this.settings;
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
            if (this.settings.hasOwnProperty(key)) {
                this.settings[key] = value;
                await this.saveSettings();
                this.logger.info(`Setting updated: ${key} = ${value}`);
            } else {
                this.logger.warn(`Attempted to update non-existent setting: ${key}`);
            }
        }

        get(key) {
            return this.settings.hasOwnProperty(key) ? this.settings[key] : undefined;
        }
    }

    // ===============================
    // CSS STYLE MANAGER
    // ===============================
    class StyleManager {
        constructor(settingsManager, logger) {
            this.settingsManager = settingsManager;
            this.logger = logger;
            this.styleElementId = 'youtube-hover-disable-styles'; // ID for the style element
            this.styleElement = null;
        }

        _getOrCreateStyleElement() {
            if (!this.styleElement || !document.head.contains(this.styleElement)) {
                this.styleElement = document.getElementById(this.styleElementId);
                if (!this.styleElement) {
                    this.styleElement = document.createElement('style');
                    this.styleElement.id = this.styleElementId;
                    (document.head || document.documentElement).appendChild(this.styleElement);
                    this.logger.debug('Created new style element.');
                } else {
                    this.logger.debug('Re-acquired existing style element.');
                }
            }
            return this.styleElement;
        }

        buildStyles() {
            let css = '';
            if (this.settingsManager.get('disablePreviews')) {
                css += `
                /* Main preview elements */
                ytd-moving-thumbnail-renderer, ytd-video-preview, .ytp-preview, .html5-video-preview,
                .ytp-hover-overlay, .ytp-videowall-still, .rich-thumbnail-renderer, .ytp-videowall-still-image,
                /* Thumbnail hover effects */
                ytd-thumbnail[moving], ytd-thumbnail .moving-thumbnail, ytd-thumbnail .rich-thumbnail,
                /* Additional preview containers */
                .thumbnail-overlay-container, .thumbnail-hover-overlay, .video-thumbnail-overlay,
                /* Mobile preview elements */
                .compact-video-renderer .thumbnail-overlay, .video-renderer .thumbnail-overlay,
                /* Shorts hover previews */
                .ytd-shorts .thumbnail-overlay, #shorts-player .thumbnail-overlay {
                    display: none !important; opacity: 0 !important; visibility: hidden !important;
                    pointer-events: none !important; width: 0 !important; height: 0 !important;
                    position: absolute !important; left: -9999px !important; top: -9999px !important;
                }\n`;
            }
            if (this.settingsManager.get('disableHoverEffects')) {
                css += `
                /* Prevent thumbnail scaling/hover effects */
                ytd-thumbnail img, .thumbnail img, #img.ytd-thumbnail, .video-thumbnail img {
                    transition: none !important; transform: none !important;
                }
                ytd-thumbnail:hover img, .thumbnail:hover img, .video-thumbnail:hover img {
                    transform: none !important; scale: 1 !important; filter: none !important;
                }
                ytd-thumbnail:hover, .thumbnail:hover {
                    transform: none !important; box-shadow: none !important;
                }\n`;
            }
            if (this.settingsManager.get('disableAnimations')) {
                css += `
                /* Disable all thumbnail-related animations */
                ytd-thumbnail, ytd-thumbnail *, .thumbnail, .thumbnail *, .video-thumbnail, .video-thumbnail * {
                    animation: none !important; transition: none !important;
                }
                /* Disable loading animations */
                .thumbnail-loading, .thumbnail-spinner { display: none !important; }\n`;
            }
            return css;
        }

        applyStyles() {
            const styleEl = this._getOrCreateStyleElement();
            const newStyles = this.buildStyles();
            if (styleEl.textContent !== newStyles) {
                styleEl.textContent = newStyles;
                this.logger.debug('CSS styles updated/applied.');
            }
        }

        cleanup() {
            if (this.styleElement && this.styleElement.parentNode) {
                this.styleElement.parentNode.removeChild(this.styleElement);
                this.styleElement = null;
                this.logger.debug('Style element removed.');
            }
        }
    }

    // ===============================
    // EVENT BLOCKER
    // ===============================
    class EventBlocker {
        constructor(logger) {
            this.logger = logger;
            this.processedElements = new WeakSet(); // Store elements to avoid re-attaching
            this.eventCount = 0;
        }

        // Bound event handler to ensure `this` context
        _boundBlockHoverEvents = this.blockHoverEvents.bind(this);

        blockHoverEvents(event) {
            this.eventCount++;
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation(); // More aggressive blocking

            if (this.eventCount % 100 === 0 && this.logger.enabled) { // Check logger enabled for perf
                this.logger.debug(`Blocked ${this.eventCount} hover events`);
            }
            return false; // For good measure
        }

        attachEventListeners(element) {
            if (this.processedElements.has(element)) return;

            CONFIG.HOVER_EVENTS.forEach(eventType => {
                element.addEventListener(eventType, this._boundBlockHoverEvents, { capture: true, passive: false });
            });

            this.processedElements.add(element);
            // this.logger.debug('Event listeners attached to element'); // Too verbose
        }

        detachEventListeners(element) { // Optional: if elements are frequently removed and re-added
            if (this.processedElements.has(element)) {
                CONFIG.HOVER_EVENTS.forEach(eventType => {
                    element.removeEventListener(eventType, this._boundBlockHoverEvents, { capture: true });
                });
                this.processedElements.delete(element);
                // this.logger.debug('Event listeners detached from element'); // Too verbose
            }
        }

        getBlockedCount() {
            return this.eventCount;
        }

        resetProcessedElements() { // Call this on major page navigations if WeakSet isn't clearing fast enough
            this.processedElements = new WeakSet();
            this.logger.debug("EventBlocker processed elements cache cleared.");
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
            if (movingElements.length > 0) {
                movingElements.forEach(element => {
                    element.removeAttribute('moving');
                    this.removedCount++;
                });
                 if (this.logger.enabled) this.logger.debug(`Removed 'moving' attribute from ${movingElements.length} elements`);
            }
        }

        removePreviewAttributes() {
            const attributesToRemove = ['data-preview', 'data-hover-preview', 'preview-enabled'];
            let count = 0;
            attributesToRemove.forEach(attr => {
                document.querySelectorAll(`[${attr}]`).forEach(element => {
                    element.removeAttribute(attr);
                    this.removedCount++;
                    count++;
                });
            });
            if (count > 0 && this.logger.enabled) this.logger.debug(`Removed various preview attributes from ${count} elements.`);
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
            this.intervalId = null; // Store interval ID for cleanup
        }

        applyOverrides() {
            if (this.overridesApplied) return; // Don't re-apply if already done

            const checkYouTube = () => {
                if (typeof window.yt !== 'undefined' && window.yt.www) {
                    this.overridePreviewFunctions();
                    this.overridesApplied = true;
                    this.logger.info('YouTube API overrides applied');
                    if (this.intervalId) this.timer.clearInterval(this.intervalId);
                    return true;
                }
                return false;
            };

            if (checkYouTube()) return;

            if (this.intervalId) this.timer.clearInterval(this.intervalId); // Clear previous interval if any
            this.intervalId = this.timer.setInterval(() => {
                if (checkYouTube()) {
                    // Interval cleared inside checkYouTube on success
                }
            }, CONFIG.TIMERS.YOUTUBE_CHECK_INTERVAL);

            this.timer.setTimeout(() => {
                if (this.intervalId) this.timer.clearInterval(this.intervalId);
                if (!this.overridesApplied) {
                    this.logger.warn('YouTube API override timeout reached. API might not be available.');
                }
            }, CONFIG.TIMERS.YOUTUBE_CHECK_TIMEOUT);
        }

        overridePreviewFunctions() {
            try {
                if (window.yt?.www?.thumbnails) {
                    window.yt.www.thumbnails.startMoving = () => {};
                    window.yt.www.thumbnails.stopMoving = () => {};
                    this.logger.debug('Thumbnail preview functions overridden (yt.www.thumbnails)');
                }
                // It's common for YouTube to change these paths. Add more robust checks or alternatives.
                // For example, some preview logic might be on player instances.
                const player = document.getElementById('movie_player');
                if (player && typeof player.disableVideoPreview === 'function') {
                     player.disableVideoPreview();
                     this.logger.debug('Disabled video preview via movie_player.disableVideoPreview');
                }


                if (window.yt?.player?.exports) {
                     if(window.yt.player.exports.handleInlinePreviewHover) window.yt.player.exports.handleInlinePreviewHover = () => {};
                     if(window.yt.player.exports.showPreview) window.yt.player.exports.showPreview = () => {};
                     this.logger.debug('Thumbnail preview functions overridden (yt.player.exports)');
                }


                if (window.ytInitialPlayerResponse?.microformat?.playerMicroformatRenderer?.thumbnail?.thumbnails) {
                     // This might be too late as it's data, but good to clear if possible
                }

                this.disableConfigPreviewSettings();

            } catch (error) {
                this.logger.error(`Error applying YouTube API overrides: ${error.message}`);
            }
        }

        disableConfigPreviewSettings() {
            try {
                if (window.ytcfg?.data_?.EXPERIMENT_FLAGS) {
                    const flags = window.ytcfg.data_.EXPERIMENT_FLAGS;
                    flags.web_player_show_preview = false;
                    flags.enable_thumbnail_preview = false;
                    flags.web_thumbnail_hover_preview = false;
                    flags.web_player_enable_storyboard_hover_preview = false;
                    flags.web_player_inline_prev_hover_endscreen_enable_thumbnail_preview = false;
                    this.logger.debug('ytcfg EXPERIMENT_FLAGS for previews disabled.');
                }
                 if (window.ytcfg && typeof window.ytcfg.set === 'function') {
                    window.ytcfg.set('PREVIEW_ENABLED', false);
                    window.ytcfg.set('HOVER_PREVIEW_ENABLED', false);
                    this.logger.debug('ytcfg.set PREVIEW_ENABLED flags to false.');
                }
            } catch (error) {
                this.logger.warn(`Could not modify ytcfg flags: ${error.message}`);
            }
        }

        cleanup() { // Ensure interval is cleared
            if (this.intervalId) {
                this.timer.clearInterval(this.intervalId);
                this.intervalId = null;
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
            this.lastProcessedTime = 0;
        }

        processAllThumbnails(force = false) {
            const now = Date.now();
            // Basic throttling: process only if some time has passed or if forced
            if (!force && now - this.lastProcessedTime < 100) { // e.g., 100ms throttle
                return;
            }
            this.lastProcessedTime = now;

            let currentProcessedInCall = 0;
            CONFIG.SELECTORS.thumbnails.forEach(selector => {
                currentProcessedInCall += this.processThumbnailsBySelector(selector);
            });

            if (currentProcessedInCall > 0) {
                 this.logger.debug(`Processed ${currentProcessedInCall} thumbnail elements in this call.`);
            }
            this.attributeManager.cleanupAllAttributes(); // This should be efficient
        }

        processThumbnailsBySelector(selector) {
            let processedNow = 0;
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // Only attach if previews are generally enabled by settings,
                    // as CSS might be doing the job already.
                    // However, event blocking is a fallback.
                    this.eventBlocker.attachEventListeners(element);
                    this.processedCount++;
                    processedNow++;
                });
                 return processedNow;
            } catch (error) {
                this.logger.error(`Error processing selector ${selector}: ${error.message}`);
                return 0;
            }
        }

        getProcessedCount() {
            return this.processedCount;
        }

        resetStats() { // If needed for long sessions
            this.processedCount = 0;
            this.eventBlocker.eventCount = 0; // Accessing directly, better via method if exists
            this.attributeManager.removedCount = 0; // Same here
            this.logger.info("ThumbnailProcessor stats reset.");
        }
    }

    // ===============================
    // MENU MANAGER
    // ===============================
    class MenuManager {
        constructor(settingsManager, mainApp, logger) { // Added mainApp for update check
            this.settingsManager = settingsManager;
            this.mainApp = mainApp; // Store mainApp instance
            this.styleManager = mainApp.styleManager; // Get from mainApp
            this.logger = logger;
            this.menuIds = [];
            this.registerMenuCommand = (typeof GM !== 'undefined' && GM.registerMenuCommand) ?
                                      GM.registerMenuCommand : (typeof GM_registerMenuCommand !== 'undefined' ? GM_registerMenuCommand : null);
        }

        createMenus() {
            if (!this.registerMenuCommand) {
                this.logger.warn("GM_registerMenuCommand or GM.registerMenuCommand not available. Menus not created.");
                return;
            }
            // For true refresh, script managers usually handle this on script update/reinstall.
            // This simple implementation will add new items on each script run if not reloaded.

            const menuItems = [
                {
                    key: 'disablePreviews',
                    label: 'Disable Hover Previews',
                    callback: (newValue) => {
                        this.styleManager.applyStyles(); // Use applyStyles
                        this.logger.info(`Hover previews ${newValue ? 'disabled' : 'enabled'}`);
                    }
                },
                {
                    key: 'disableHoverEffects',
                    label: 'Disable Hover Effects',
                    callback: (newValue) => {
                        this.styleManager.applyStyles();
                        this.logger.info(`Hover effects ${newValue ? 'disabled' : 'enabled'}`);
                    }
                },
                {
                    key: 'disableAnimations',
                    label: 'Disable Animations',
                    callback: (newValue) => {
                        this.styleManager.applyStyles();
                        this.logger.info(`Animations ${newValue ? 'disabled' : 'enabled'}`);
                    }
                },
                {
                    key: 'debug',
                    label: 'Debug Mode',
                    callback: (newValue) => {
                        this.mainApp.logger.setEnabled(newValue); // Use mainApp's logger
                        this.logger.info(`Debug mode ${newValue ? 'enabled' : 'disabled'}`);
                    }
                }
            ];

            menuItems.forEach(({ key, label, callback }) => {
                const isEnabled = this.settingsManager.get(key);
                const menuLabel = `${isEnabled ? '✅' : '⚪'} ${label}`;

                const menuId = this.registerMenuCommand(menuLabel, async () => {
                    const currentValue = this.settingsManager.get(key); // Get current value before toggle
                    const newValue = !currentValue;
                    await this.settingsManager.updateSetting(key, newValue);
                    callback(newValue);
                    this.refreshMenuLabels(); // Request menu refresh
                });
                this.menuIds.push(menuId);
            });

            this.menuIds.push(this.registerMenuCommand('─ Script Updates ─', () => {}));
            this.menuIds.push(this.registerMenuCommand('Check for Updates', () => this.mainApp.checkForUpdates()));
            this.logger.debug("Menus created/updated.");
        }

        refreshMenuLabels() {
            // Standard GM_registerMenuCommand doesn't allow dynamic updating of labels.
            this.logger.debug("Menu label refresh requested. Actual update of checkmarks requires script/page reload or a more advanced menu system if the script manager supports it.");
            // alert("Settings changed. Menu checkmarks will update after a page refresh or script reload.");
        }

        cleanup() {
            this.menuIds = []; // Clear internal tracking
        }
    }

    // ===============================
    // MAIN APPLICATION CLASS
    // ===============================
    class YouTubeHoverDisabler {
        constructor() {
            this.logger = new Logger(CONFIG.SCRIPT_NAME, CONFIG.DEFAULT_SETTINGS.debug);
            this.timer = new Timer();
            this.debouncer = new Debouncer();
            this.settingsManager = new SettingsManager(this.logger);
            this.styleManager = new StyleManager(this.settingsManager, this.logger); // Instantiated here
            this.eventBlocker = new EventBlocker(this.logger);
            this.attributeManager = new AttributeManager(this.logger);
            this.youtubeAPI = new YouTubeAPIOverride(this.logger, this.timer);
            this.thumbnailProcessor = new ThumbnailProcessor(this.eventBlocker, this.attributeManager, this.logger);
            this.menuManager = new MenuManager(this.settingsManager, this, this.logger); // Pass `this` (mainApp)

            this.observer = null;
            this.urlObserver = null; // Specific observer for URL
            this.currentUrl = '';
            this.isInitialized = false;
        }

        async initialize() {
            if (this.isInitialized) {
                this.logger.warn("Already initialized. Skipping.");
                return;
            }
            try {
                await this.settingsManager.loadSettings();
                this.logger.setEnabled(this.settingsManager.get('debug'));

                this.styleManager.applyStyles(); // Initial style application
                this.menuManager.createMenus();
                this.setupMutationObserver();
                this.youtubeAPI.applyOverrides(); // Apply once
                this.thumbnailProcessor.processAllThumbnails(true); // Force initial full scan
                this.startPeriodicCleanup(); // If still desired
                this.setupUrlChangeDetection();

                this.currentUrl = location.href;
                this.isInitialized = true;
                this.logger.log('YouTube Hover Disabler initialized successfully');

                // Expose for debugging if not already done by global script
                if (typeof window.youtubeHoverApp === 'undefined') {
                     window.youtubeHoverApp = {
                        controller: this,
                        getStatus: () => this.getStatus(),
                        toggleDebug: async () => {
                            const newDebugState = !this.settingsManager.get('debug');
                            await this.settingsManager.updateSetting('debug', newDebugState);
                            this.logger.setEnabled(newDebugState);
                            this.logger.log(`Debug mode toggled to ${newDebugState} via console.`);
                            this.menuManager.refreshMenuLabels();
                        },
                        checkForUpdates: () => this.checkForUpdates(),
                    };
                }


            } catch (error) {
                this.logger.error(`Initialization failed: ${error.message}`);
                 console.error(error.stack);
            }
        }

        setupMutationObserver() {
            if (this.observer) this.observer.disconnect(); // Ensure no duplicates
            this.observer = new MutationObserver((mutations) => {
                this.debouncer.debounce('mutationProcess', () => {
                    this.handleMutations(mutations);
                }, CONFIG.TIMERS.DEBOUNCE_DELAY);
            });

            this.observer.observe(document.documentElement, { // Observe documentElement for wider coverage
                childList: true,
                subtree: true,
                attributes: true, // Observe attributes broadly, filter in handler
                attributeFilter: ['moving', 'class', 'id', 'href', 'src', 'data-preview', 'style'], // Common dynamic attributes
                characterData: false // Usually not needed and can be noisy
            });
            this.logger.debug('Mutation observer set up');
        }

        handleMutations(mutations) {
            let shouldProcessThumbnails = false;
            // More specific checks can be added here if certain mutations are too noisy
            // For now, any childList or relevant attribute change triggers a re-scan.
            // This is simpler but might be less performant than very targeted checks.
            shouldProcessThumbnails = true; // Default to true if any mutation observed

            if (shouldProcessThumbnails) {
                this.thumbnailProcessor.processAllThumbnails(); // Not forced, uses internal throttling
            }
            // Attribute cleanup is part of processAllThumbnails now
        }


        startPeriodicCleanup() {
            // This might be redundant if mutation observer and SPA navigation handling are robust.
            // Consider removing or making it less frequent if performance is an issue.
            if (this.cleanupInterval) this.timer.clearInterval(this.cleanupInterval);
            this.cleanupInterval = this.timer.setInterval(() => {
                this.attributeManager.cleanupAllAttributes();
            }, CONFIG.TIMERS.CLEANUP_INTERVAL);
            this.logger.debug('Periodic attribute cleanup started');
        }

        setupUrlChangeDetection() {
            if (this.urlObserver) this.urlObserver.disconnect();

            let lastHref = document.location.href;
            this.urlObserver = new MutationObserver(() => {
                if (document.location.href !== lastHref) {
                    lastHref = document.location.href;
                    this.handleUrlChange(lastHref);
                }
            });
            // Observe the title element as it often changes during SPA navigations on YouTube
            const titleElement = document.querySelector('head > title');
            if (titleElement) {
                this.urlObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
            } else {
                 // Fallback to observing body for SPA, less ideal but better than nothing
                this.urlObserver.observe(document.body, { childList: true, subtree: true });
                this.logger.warn("No <title> element found for URL observer, falling back to body. This might be less reliable for URL change detection.");
            }


            // Also listen to YouTube's specific navigation events
            const ytNavigateEvents = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated', 'spfdone'];
            ytNavigateEvents.forEach(eventName => {
                // Using a named function for potential removal if needed, though not strictly necessary here
                const navHandler = () => this.handleUrlChange(document.location.href);
                window.addEventListener(eventName, navHandler);
                // Store listener details if you plan to remove them in cleanup, e.g., in this.eventListeners array
            });

            this.logger.debug('URL change detection set up.');
        }


        handleUrlChange(newUrl) {
            this.logger.debug(`URL change detected. Old: ${this.currentUrl.substring(0,100)}, New: ${newUrl.substring(0,100)}`);
            if (newUrl === this.currentUrl && this.isInitialized) { // Check if truly different
                // this.logger.debug("URL reported change but is same as current. Possibly a hash change or minor update. Re-processing just in case.");
                 // return; // if it's really the same, do nothing.
            }
            this.currentUrl = newUrl;
            this.eventBlocker.resetProcessedElements(); // Clear cache of processed elements for events

            this.debouncer.debounce('urlChangeProcess', () => {
                this.logger.info(`Processing for new URL: ${newUrl.substring(0,100)}`);
                this.styleManager.applyStyles(); // Ensure styles are correct for the new page context
                this.youtubeAPI.applyOverrides(); // Re-apply API overrides if they can be page-specific
                this.thumbnailProcessor.processAllThumbnails(true); // Force a full scan for the new page
            }, CONFIG.TIMERS.PAGE_CHANGE_DELAY);
        }

        async checkForUpdates() {
            this.logger.log('Checking for script updates...');
            const scriptInfo = (typeof GM_info !== 'undefined' && GM_info.script) ? GM_info.script : null;

            if (!scriptInfo || !scriptInfo.version || !scriptInfo.updateURL) {
                const msg = 'Script metadata (version/updateURL) not available via GM_info. Cannot check for updates.';
                this.logger.error(msg);
                if (typeof GM_notification === 'function') {
                    GM_notification({ text: msg, title: `${CONFIG.SCRIPT_NAME} - Update Error`, timeout: 7000 });
                } else {
                    alert(msg);
                }
                return;
            }

            const currentVersion = scriptInfo.version;
            const updateURL = scriptInfo.updateURL;
            const scriptName = scriptInfo.name || CONFIG.SCRIPT_NAME;
            const downloadURL = scriptInfo.downloadURL || updateURL; // Fallback download to updateURL

            this.logger.debug(`Current Version: ${currentVersion}, Update URL: ${updateURL}`);

            GM_xmlhttpRequest({
                method: 'GET',
                url: updateURL,
                headers: { 'Cache-Control': 'no-cache' },
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        const remoteVersionMatch = response.responseText.match(/@version\s+([\d\w\.-]+)/);
                        if (remoteVersionMatch && remoteVersionMatch[1]) {
                            const remoteVersion = remoteVersionMatch[1];
                            this.logger.log(`Remote version: ${remoteVersion}`);
                            if (compareVersions(remoteVersion, currentVersion) > 0) {
                                const updateMessage = `A new version (${remoteVersion}) of ${scriptName} is available!`;
                                this.logger.log(updateMessage);
                                if (typeof GM_notification === 'function') {
                                    GM_notification({
                                        text: `${updateMessage} Click to install.`,
                                        title: `${scriptName} - Update Available`,
                                        onclick: () => window.open(downloadURL, '_blank'),
                                        timeout: 0 // Persists until clicked or closed
                                    });
                                } else if (confirm(`${updateMessage}\n\nGo to download page?`)) {
                                    window.open(downloadURL, '_blank');
                                }
                            } else {
                                const uptodateMsg = `${scriptName} (v${currentVersion}) is up to date.`;
                                this.logger.log(uptodateMsg);
                                if (typeof GM_notification === 'function') GM_notification({ text: uptodateMsg, title: `${scriptName} - Up to Date`, timeout: 5000 });
                                else alert(uptodateMsg);
                            }
                        } else {
                            this.logger.warn('Could not parse @version from remote script.');
                             if (typeof GM_notification === 'function') GM_notification({ text: 'Could not parse remote version.', title: `${scriptName} - Update Check Failed`, timeout: 7000 });
                        }
                    } else {
                        this.logger.error(`Error fetching update: ${response.status} ${response.statusText}`);
                         if (typeof GM_notification === 'function') GM_notification({ text: `Error fetching update: ${response.statusText}`, title: `${scriptName} - Update Check Failed`, timeout: 7000 });
                    }
                },
                onerror: (error) => {
                    this.logger.error('Network error during update check:', error);
                     if (typeof GM_notification === 'function') GM_notification({ text: 'Network error during update check. See console.', title: `${scriptName} - Update Check Failed`, timeout: 7000 });
                }
            });
        }


        cleanup() {
            this.logger.log('Cleaning up YouTubeHoverDisabler...');
            this.timer.clearAll();
            this.debouncer.clear();
            if (this.observer) this.observer.disconnect();
            if (this.urlObserver) this.urlObserver.disconnect();
            this.styleManager.cleanup();
            this.youtubeAPI.cleanup(); // Clear any intervals in API override
            this.menuManager.cleanup(); // If it needs any cleanup

            // Remove any globally added window event listeners if they were tracked
            // e.g., for yt-navigate-finish etc. (currently not tracked for removal)

            this.isInitialized = false;
            this.logger.log('Cleanup completed');
        }

        getStatus() {
            return {
                settings: this.settingsManager.settings,
                isInitialized: this.isInitialized,
                currentUrl: this.currentUrl,
                loggerEnabled: this.logger.enabled,
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
    if (window.youtubeHoverDisablerInstanceMarker) {
        console.log('[YouTube Hover Disable] Instance marker found. Skipping initialization to prevent duplicates.');
        return;
    }
    window.youtubeHoverDisablerInstanceMarker = true;

    const app = new YouTubeHoverDisabler();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => app.initialize(), { once: true });
    } else {
        app.initialize();
    }

    window.addEventListener('beforeunload', () => app.cleanup());

    // Expose a minimal debug interface - this replaces the one inside initialize for clarity
    // Ensure it's only set once.
     if (typeof window.youtubeHoverApp === 'undefined') {
        window.youtubeHoverApp = {
            controller: app, // For direct access if needed
            getStatus: () => app.getStatus(),
            toggleDebug: async () => {
                if (app && app.settingsManager && app.logger && app.menuManager) {
                    const newDebugState = !app.settingsManager.get('debug');
                    await app.settingsManager.updateSetting('debug', newDebugState);
                    app.logger.setEnabled(newDebugState);
                    app.logger.log(`Debug mode toggled to ${newDebugState} via console.`);
                    app.menuManager.refreshMenuLabels();
                } else {
                    console.error("App not fully initialized for debug toggle.");
                }
            },
            checkForUpdates: () => app.checkForUpdates(),
        };
    }


})();
