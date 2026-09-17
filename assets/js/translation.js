/**
 * Translation functionality for the website
 * Custom implementation for Google Translate Language Switcher
 * Handles translation through Google Translate API
 */

// Constants
const TRANSLATION_CONFIG = {
    DEFAULT_LANGUAGE: 'en',
    SCRIPT_LOAD_DELAY: 500,
    TRANSLATION_TRIGGER_DELAY: 1000,
    FALLBACK_TIMEOUT: 1000,
    DROPDOWN_POSITION_THRESHOLD: 800,
    DROPDOWN_MAX_HEIGHT: 180,
    DROPDOWN_MIN_SPACE: 150,
    COOKIE_EXPIRY_TIME: 999999999
};

const SELECTORS = {
    GOOGLE_TRANSLATE_ELEMENT: '#google_translate_element',
    GOOGLE_TRANSLATE_HIDDEN: '#google_translate_element_hidden',
    LANGUAGE_SWITCHER: '#language-switcher',
    GOOGLE_TRANSLATE_COMBO: '.goog-te-combo',
    GOOGLE_TRANSLATE_BANNER: '.goog-te-banner-frame, .skiptranslate',
    GOOGLE_TRANSLATE_GADGET: '.goog-te-gadget',
    GOOGLE_LOGO_LINK: '.goog-logo-link'
};

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: 'gb' },
    { code: 'fr', name: 'French', flag: 'fr' },
    { code: 'de', name: 'German', flag: 'de' },
    { code: 'es', name: 'Spanish', flag: 'es' },
    { code: 'fi', name: 'Finnish', flag: 'fi' },
    { code: 'lv', name: 'Latvian', flag: 'lv' },
    { code: 'sk', name: 'Slovak', flag: 'sk' },
    { code: 'pl', name: 'Polish', flag: 'pl' },
    { code: 'no', name: 'Norwegian', flag: 'no' },
    { code: 'lt', name: 'Lithuanian', flag: 'lt' },
    { code: 'bg', name: 'Bulgarian', flag: 'bg' },
];

/**
 * Main Translation Manager Class
 * Handles all translation functionality and Google Translate integration
 */
class TranslationManager {
    constructor() {
        this.isInitialized = false;
        this.currentLanguage = TRANSLATION_CONFIG.DEFAULT_LANGUAGE;
        this.observer = null;
        this.init();
    }

    /**
     * Initialize the translation system
     */
    init() {
        this.setupGoogleTranslateInit();
        this.loadGoogleTranslateScript();
        this.setupDOMObserver();

        // Initialize language switcher after delay
        setTimeout(() => {
            this.initLanguageSwitcher();
        }, TRANSLATION_CONFIG.SCRIPT_LOAD_DELAY);
    }

    /**
     * Setup Google Translate initialization callback
     */
    setupGoogleTranslateInit() {
        window.googleTranslateElementInit = () => {
            this.createGoogleTranslateElements();
            this.hideGoogleTranslateBranding();
            this.handleInitialTranslation();
        };
    }

    /**
     * Create Google Translate elements
     */
    createGoogleTranslateElements() {
        const config = {
            pageLanguage: TRANSLATION_CONFIG.DEFAULT_LANGUAGE,
            autoDisplay: false,
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        };

        // Create main Google Translate element
        new google.translate.TranslateElement(config, 'google_translate_element');

        // Create hidden element for API access
        new google.translate.TranslateElement(config, 'google_translate_element_hidden');
    }

    /**
     * Hide Google Translate branding and UI elements
     */
    hideGoogleTranslateBranding() {
        const style = document.createElement('style');
        style.textContent = `
            ${SELECTORS.GOOGLE_TRANSLATE_BANNER} { display: none !important; }
            body { top: 0 !important; position: static !important; }
            ${SELECTORS.GOOGLE_TRANSLATE_GADGET} { height: 0 !important; }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            $(SELECTORS.GOOGLE_LOGO_LINK).hide();
            $(SELECTORS.GOOGLE_TRANSLATE_GADGET).css('font-size', '0');

            if (typeof initCustomGoogleTranslate === 'function') {
                initCustomGoogleTranslate();
            }
        }, TRANSLATION_CONFIG.TRANSLATION_TRIGGER_DELAY);
    }

    /**
     * Handle initial translation based on stored preferences
     */
    handleInitialTranslation() {
        setTimeout(() => {
            const cookieLanguage = this.getCurrentLanguageFromCookie();
            if (cookieLanguage && cookieLanguage !== TRANSLATION_CONFIG.DEFAULT_LANGUAGE) {
                this.triggerTranslationFromCookie(cookieLanguage);
            }
        }, TRANSLATION_CONFIG.TRANSLATION_TRIGGER_DELAY);
    }

    /**
     * Trigger translation from cookie value
     */
    triggerTranslationFromCookie(languageCode) {
        const selectElement = document.querySelector(SELECTORS.GOOGLE_TRANSLATE_COMBO);
        if (selectElement) {
            selectElement.value = languageCode;
            selectElement.dispatchEvent(new Event('change'));
        }
    }

    /**
     * Load Google Translate script dynamically
     */
    loadGoogleTranslateScript() {
        if (!window.google || !window.google.translate) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.head.appendChild(script);
        } else {
            window.googleTranslateElementInit();
        }
    }

    /**
     * Initialize the custom language switcher
     */
    initLanguageSwitcher() {
        if ($(SELECTORS.GOOGLE_TRANSLATE_ELEMENT).length && $(SELECTORS.LANGUAGE_SWITCHER).length === 0) {
            this.createLanguageSwitcher();
            this.applyStoredLanguagePreference();
        }
    }

    /**
     * Apply stored language preference from localStorage
     */
    applyStoredLanguagePreference() {
        const storedLanguage = localStorage.getItem('selectedLanguage');
        if (storedLanguage && storedLanguage !== TRANSLATION_CONFIG.DEFAULT_LANGUAGE) {
            const currentLanguage = this.getCurrentLanguageFromCookie();
            if (!currentLanguage || currentLanguage !== storedLanguage) {
                setTimeout(() => {
                    this.translatePage(storedLanguage);
                }, TRANSLATION_CONFIG.TRANSLATION_TRIGGER_DELAY);
            }
        }
    }

    /**
     * Create the custom language switcher dropdown
     */
    createLanguageSwitcher() {
        const currentLanguage = this.getCurrentLanguageInfo();
        const dropdown = this.createDropdownHTML(currentLanguage);

        $(SELECTORS.GOOGLE_TRANSLATE_ELEMENT).html(dropdown);
        this.bindDropdownEvents();
    }

    /**
     * Get current language information
     */
    getCurrentLanguageInfo() {
        const currentLangCode = this.getCurrentLanguageFromCookie() || TRANSLATION_CONFIG.DEFAULT_LANGUAGE;
        const languageInfo = this.findLanguageByCode(currentLangCode);

        return {
            code: currentLangCode,
            name: languageInfo ? languageInfo.name : 'English',
            flag: languageInfo ? languageInfo.flag : 'gb'
        };
    }

    /**
     * Find language information by code
     */
    findLanguageByCode(languageCode) {
        return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
    }

    /**
     * Create dropdown HTML structure
     */
    createDropdownHTML(currentLanguage) {
        const optionsHTML = SUPPORTED_LANGUAGES.map(lang => {
            const isSelected = lang.code === currentLanguage.code;
            return `<div class="language-option${isSelected ? ' selected' : ''}" data-lang-code="${lang.code}">
                        <span class="flag-icon flag-icon-${lang.flag}"></span>
                        ${lang.name}
                    </div>`;
        }).join('');

        return `<div id="language-switcher" class="language-dropdown">
                    <div class="selected-language">
                        <span class="flag-icon flag-icon-${currentLanguage.flag}"></span>
                        <span class="language-text">${currentLanguage.code}</span>
                        <div class="dropdown-arrow"></div>
                    </div>
                    <div class="language-options">${optionsHTML}</div>
                </div>`;
    }

    /**
     * Bind event handlers to dropdown elements
     */
    bindDropdownEvents() {
        const $dropdown = $(SELECTORS.LANGUAGE_SWITCHER);

        this.bindDropdownToggle($dropdown);
        this.bindLanguageSelection($dropdown);
        this.bindOutsideClick($dropdown);
        this.bindWindowResize($dropdown);
    }

    /**
     * Bind dropdown toggle functionality
     */
    bindDropdownToggle($dropdown) {
        $dropdown.find('.selected-language').on('click', (e) => {
            e.stopPropagation();
            $dropdown.toggleClass('open');

            if ($dropdown.hasClass('open')) {
                this.scrollToSelectedOption($dropdown);
                this.adjustDropdownPosition($dropdown);
            }
        });
    }

    /**
     * Bind language selection functionality
     */
    bindLanguageSelection($dropdown) {
        $dropdown.find('.language-option').on('click', (e) => {
            e.stopPropagation();
            const $option = $(e.currentTarget);
            const languageCode = $option.data('lang-code');

            this.handleLanguageSelection($dropdown, $option, languageCode);
        });
    }

    /**
     * Handle language selection
     */
    handleLanguageSelection($dropdown, $option, languageCode) {
        const languageInfo = this.findLanguageByCode(languageCode);
        if (!languageInfo) return;

        this.updateDropdownDisplay($dropdown, languageInfo);
        this.updateSelectedOption($dropdown, $option);
        $dropdown.removeClass('open');

        localStorage.setItem('selectedLanguage', languageCode);
        this.translatePage(languageCode);

        this.validateTranslationApplication(languageCode, languageInfo);
    }

    /**
     * Update dropdown display with selected language
     */
    updateDropdownDisplay($dropdown, languageInfo) {
        $dropdown.find('.language-text').text(languageInfo.code);
        $dropdown.find('.selected-language .flag-icon')
                 .attr('class', `flag-icon flag-icon-${languageInfo.flag}`);
    }

    /**
     * Update selected option styling
     */
    updateSelectedOption($dropdown, $selectedOption) {
        $dropdown.find('.language-option').removeClass('selected');
        $selectedOption.addClass('selected');
    }

    /**
     * Validate that translation was applied correctly
     */
    validateTranslationApplication(languageCode, languageInfo) {
        setTimeout(() => {
            const currentLanguage = this.getCurrentLanguageFromCookie();
            if (currentLanguage !== languageCode) {
                // Update UI even if translation failed
                const $dropdown = $(SELECTORS.LANGUAGE_SWITCHER);
                this.updateDropdownDisplay($dropdown, languageInfo);
                this.updateSelectedOption($dropdown,
                    $dropdown.find(`[data-lang-code="${languageCode}"]`));
            }
        }, 500);
    }

    /**
     * Bind outside click to close dropdown
     */
    bindOutsideClick($dropdown) {
        $(document).on('click', () => {
            $dropdown.removeClass('open');
        });
    }

    /**
     * Bind window resize events
     */
    bindWindowResize($dropdown) {
        $(window).on('resize', () => {
            if ($dropdown.hasClass('open')) {
                this.adjustDropdownPosition($dropdown);
            }
        });
    }

    /**
     * Scroll to selected option in dropdown
     */
    scrollToSelectedOption($dropdown) {
        const $selectedOption = $dropdown.find('.language-option.selected');
        if ($selectedOption.length) {
            setTimeout(() => {
                const $optionsContainer = $dropdown.find('.language-options');
                const scrollTop = $selectedOption.position().top -
                                $optionsContainer.height() / 2 +
                                $selectedOption.height() / 2;
                $optionsContainer.scrollTop(scrollTop);
            }, 50);
        }
    }

    /**
     * Adjust dropdown position based on available screen space
     */
    adjustDropdownPosition($dropdown) {
        const windowHeight = $(window).height();

        if (windowHeight < TRANSLATION_CONFIG.DROPDOWN_POSITION_THRESHOLD) {
            const dropdownTop = $dropdown.offset().top;
            const dropdownHeight = $dropdown.outerHeight();
            const spaceBelow = windowHeight - dropdownTop - dropdownHeight;
            const spaceAbove = dropdownTop;

            const $options = $dropdown.find('.language-options');
            const maxHeight = this.calculateOptimalDropdownHeight(spaceBelow, spaceAbove);

            $options.css('max-height', maxHeight + 'px');
        }
    }

    /**
     * Calculate optimal dropdown height based on available space
     */
    calculateOptimalDropdownHeight(spaceBelow, spaceAbove) {
        const minSpace = TRANSLATION_CONFIG.DROPDOWN_MIN_SPACE;
        const maxHeight = TRANSLATION_CONFIG.DROPDOWN_MAX_HEIGHT;

        if (spaceBelow < minSpace && spaceAbove > spaceBelow) {
            return Math.min(spaceAbove - 20, maxHeight);
        }
        return Math.min(spaceBelow - 20, maxHeight);
    }

    /**
     * Get current language from Google Translate cookie
     */
    getCurrentLanguageFromCookie() {
        try {
            const match = document.cookie.match(/(^|;)\s*googtrans=([^;]+)/);
            if (match) {
                const parts = decodeURIComponent(match[2]).split('/');
                if (parts.length === 3) {
                    return parts[2]; // Return target language
                }
            }
        } catch (error) {
            console.error("Error reading language cookie:", error);
        }
        return null;
    }

    /**
     * Translate page to specified language
     */
    translatePage(languageCode) {
        if (languageCode === TRANSLATION_CONFIG.DEFAULT_LANGUAGE) {
            this.resetToDefaultLanguage();
            return;
        }

        this.setTranslationCookie(languageCode);
        this.triggerTranslation(languageCode);
    }

    /**
     * Reset page to default language (English)
     */
    resetToDefaultLanguage() {
        this.clearTranslationCookies();
        window.location.reload();
    }

    /**
     * Clear all translation cookies
     */
    clearTranslationCookies() {
        const expiredDate = 'Thu, 01 Jan 1970 00:00:00 UTC';
        const cookieOptions = [
            '; path=/',
            '; path=/; domain=' + document.domain,
            '; path=/; domain=.' + document.domain
        ];

        // Try to clear for main domain as well
        const hostParts = document.domain.split('.');
        if (hostParts.length >= 2) {
            const mainDomain = hostParts.slice(-2).join('.');
            cookieOptions.push('; path=/; domain=.' + mainDomain);
        }

        cookieOptions.forEach(option => {
            document.cookie = `googtrans=; expires=${expiredDate}${option}`;
        });
    }

    /**
     * Set translation cookie for specified language
     */
    setTranslationCookie(languageCode) {
        const now = new Date();
        const expTime = now.getTime() + TRANSLATION_CONFIG.COOKIE_EXPIRY_TIME;
        now.setTime(expTime);

        const cookieValue = `/auto/${languageCode}`;
        const expires = now.toGMTString();

        const cookieOptions = [
            '; path=/',
            '; path=/; domain=' + document.domain,
            '; path=/; domain=.' + document.domain
        ];

        // Set for main domain as well
        const hostParts = document.domain.split('.');
        if (hostParts.length >= 2) {
            const mainDomain = hostParts.slice(-2).join('.');
            cookieOptions.push('; path=/; domain=.' + mainDomain);
        }

        cookieOptions.forEach(option => {
            document.cookie = `googtrans=${cookieValue}; expires=${expires}${option}`;
        });
    }

    /**
     * Trigger translation using Google Translate API
     */
    triggerTranslation(languageCode) {
        let translationTriggered = false;

        if (this.isGoogleTranslateLoaded()) {
            translationTriggered = this.triggerDirectTranslation(languageCode);
        }

        if (!translationTriggered) {
            this.handleTranslationFallback(languageCode);
        } else {
            window.location.reload();
        }
    }

    /**
     * Check if Google Translate is loaded
     */
    isGoogleTranslateLoaded() {
        return typeof google !== 'undefined' && typeof google.translate !== 'undefined';
    }

    /**
     * Trigger direct translation using Google Translate element
     */
    triggerDirectTranslation(languageCode) {
        try {
            const hiddenElement = document.getElementById('google_translate_element_hidden');
            if (hiddenElement) {
                const selectElement = hiddenElement.querySelector(SELECTORS.GOOGLE_TRANSLATE_COMBO);
                if (selectElement) {
                    selectElement.value = languageCode;
                    selectElement.dispatchEvent(new Event('change'));
                    return true;
                }
            }
        } catch (error) {
            console.error('Error triggering Google Translate:', error);
        }
        return false;
    }

    /**
     * Handle translation fallback when direct translation fails
     */
    handleTranslationFallback(languageCode) {
        this.testGoogleTranslateAccessibility(languageCode);

        setTimeout(() => {
            window.location.reload();
        }, TRANSLATION_CONFIG.FALLBACK_TIMEOUT);
    }

    /**
     * Test Google Translate accessibility and provide fallback
     */
    testGoogleTranslateAccessibility(languageCode) {
        const testImage = new Image();
        testImage.src = `https://translate.google.com/favicon.ico?t=${Date.now()}`;

        testImage.onload = () => {
            window.location.reload();
        };

        testImage.onerror = () => {
            this.offerExternalTranslation(languageCode);
        };
    }

    /**
     * Offer external translation service as fallback
     */
    offerExternalTranslation(languageCode) {
        localStorage.setItem('selectedLanguage', languageCode);

        const useExternal = confirm(
            'Translation service may be blocked by your browser. ' +
            'Would you like to use an external translation service?'
        );

        if (useExternal) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href =
                `https://translate.google.com/translate?sl=auto&tl=${languageCode}&u=${currentUrl}`;
        }
    }

    /**
     * Setup DOM mutation observer for Google Translate iframes
     */
    setupDOMObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    this.handleNewNodes(mutation.addedNodes);
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Handle newly added DOM nodes
     */
    handleNewNodes(addedNodes) {
        for (let i = 0; i < addedNodes.length; i++) {
            const node = addedNodes[i];
            if (this.isGoogleTranslateIframe(node)) {
                this.styleGoogleTranslateIframe(node);
                break;
            }
        }
    }

    /**
     * Check if node is a Google Translate iframe
     */
    isGoogleTranslateIframe(node) {
        return node.tagName &&
               node.tagName.toLowerCase() === 'iframe' &&
               node.classList.contains('goog-te-menu-frame');
    }

    /**
     * Apply custom styles to Google Translate iframe
     */
    styleGoogleTranslateIframe(iframe) {
        try {
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

            const style = iframeDocument.createElement('style');
            style.textContent = `
                .goog-te-menu2 {
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    background-color: #000 !important;
                    border: 1px solid #444 !important;
                }

                .goog-te-menu2-item div, .goog-te-menu2-item:link div,
                .goog-te-menu2-item:visited div, .goog-te-menu2-item:active div {
                    color: #fff !important;
                    background-color: #000 !important;
                }

                .goog-te-menu2-item:hover div {
                    background-color: #111 !important;
                }

                .goog-te-menu2-item-selected div {
                    background-color: #111 !important;
                }
            `;

            iframeDocument.head.appendChild(style);
        } catch (error) {
            console.error("Could not style Google Translate iframe:", error);
        }
    }

    /**
     * Cleanup method to remove event listeners and observers
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

// Initialize translation system when DOM is ready
$(document).ready(() => {
    new TranslationManager();
});
