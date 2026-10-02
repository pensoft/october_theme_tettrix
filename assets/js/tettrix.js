/**
 * TETTRIX theme behaviours.
 */
(function () {
    'use strict';

    /* ------------------------------------------------------------------
     * Per-letter label roll on .tx-btn
     *
     * Ported from the [data-fast-label] treatment in the <style> block of
     * design/TETTRIX Homepage.dc.html. The canvas hand-authored one <span>
     * per character and one nth-child delay rule per position (34 of them);
     * splitting at runtime instead means CMS-entered and translated labels
     * get the effect too, and the stagger is a single CSS calc().
     *
     * The animation itself is pure CSS - see .tx-btn__label--split in
     * assets/less/components/tettrix.less. All this does is produce the
     * spans and index them.
     * ---------------------------------------------------------------- */
    function prefersReducedMotion() {
        return window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function splitLabel(label) {
        if (label.classList.contains('tx-btn__label--split')) {
            return;
        }

        var text = label.textContent.replace(/\s+/g, ' ').trim();

        if (!text) {
            return;
        }

        var chars = text.split('');
        var frag = document.createDocumentFragment();

        for (var i = 0; i < chars.length; i++) {
            var span = document.createElement('span');

            if (chars[i] === ' ') {
                span.className = 'tx-btn__space';
                span.appendChild(document.createTextNode(' '));
            } else {
                span.appendChild(document.createTextNode(chars[i]));
            }

            span.style.setProperty('--tx-i', String(i));
            frag.appendChild(span);
        }

        label.textContent = '';
        label.appendChild(frag);
        label.classList.add('tx-btn__label--split');

        // Some screen readers announce split text one character at a time, so
        // the letters are hidden and the label is restored as off-screen text.
        // Without this a button with no aria-label would lose its name.
        label.setAttribute('aria-hidden', 'true');

        var name = document.createElement('span');
        name.className = 'sr-only';
        name.appendChild(document.createTextNode(text));
        label.parentNode.insertBefore(name, label.nextSibling);
    }

    function initButtonLabels() {
        if (prefersReducedMotion()) {
            return;
        }

        var labels = document.querySelectorAll('.tx-btn > .tx-btn__label');

        for (var i = 0; i < labels.length; i++) {
            splitLabel(labels[i]);
        }
    }

    /* ------------------------------------------------------------------
     * Split text ([data-tx-split], [data-tx-fade])
     *
     * Per-letter headline reveal, ported from heroIn() in the artboard's
     * componentDidMount() (design/TETTRIX Homepage.dc.html:644). The canvas
     * hand-authored one <span data-hl="n"> per character; this splits at
     * runtime so CMS-entered and translated titles get it too.
     *
     * The animation is CSS (.tx-split in components/tettrix.less). This only
     * builds the spans, indexes them for the stagger, then flips
     * --ready -> --in on the next frame.
     *
     * Nothing is hidden before the split completes, so a title stays visible
     * if this never runs - the canvas notes the same guarantee.
     * ---------------------------------------------------------------- */

    // Splits the text of `node` in place, preserving <br> and any inline
    // wrappers (the hero title carries both: line breaks and an <em> for the
    // orange word). `counter.n` runs across the whole element so the stagger
    // reads left-to-right through every line.
    //
    // `byWord` animates whole words instead of characters - the granularity
    // the canvas uses for the pull-quote, and the only sensible one for a
    // 230-character sentence.
    function splitInto(node, counter, byWord) {
        var out = document.createDocumentFragment();
        var kids = Array.prototype.slice.call(node.childNodes);

        for (var i = 0; i < kids.length; i++) {
            var kid = kids[i];

            if (kid.nodeType === 3) {
                // Text: one inline-block per word, one per character inside.
                var chunks = kid.nodeValue.split(/(\s+)/);

                for (var j = 0; j < chunks.length; j++) {
                    var chunk = chunks[j];

                    if (!chunk) {
                        continue;
                    }

                    if (/^\s+$/.test(chunk)) {
                        // Real whitespace, so the line can break here.
                        out.appendChild(document.createTextNode(' '));
                        continue;
                    }

                    var word = document.createElement('span');
                    word.className = 'tx-split__word';

                    if (byWord) {
                        // The word itself is the animated unit.
                        word.className += ' tx-split__char';
                        word.style.setProperty('--tx-n', String(counter.n++));
                        word.appendChild(document.createTextNode(chunk));
                    } else {
                        for (var k = 0; k < chunk.length; k++) {
                            var ch = document.createElement('span');
                            ch.className = 'tx-split__char';
                            ch.style.setProperty('--tx-n', String(counter.n++));
                            ch.appendChild(document.createTextNode(chunk.charAt(k)));
                            word.appendChild(ch);
                        }
                    }

                    out.appendChild(word);
                }
            } else if (kid.nodeType === 1) {
                // <br> has no children and must pass through untouched;
                // anything else keeps its tag and gets split inside.
                var clone = kid.cloneNode(false);

                if (kid.childNodes.length) {
                    clone.appendChild(splitInto(kid, counter, byWord));
                }

                out.appendChild(clone);
            }
        }

        return out;
    }

    function splitText(el) {
        if (el.getAttribute('data-tx-split-ready')) {
            return;
        }

        var text = el.textContent.replace(/\s+/g, ' ').trim();

        if (!text) {
            return;
        }

        el.setAttribute('data-tx-split-ready', '1');

        var byWord = el.getAttribute('data-tx-split') === 'words';
        var counter = { n: 0 };
        var split = splitInto(el, counter, byWord);

        // The letters are hidden from assistive tech (inline-block boxes can
        // be announced one character at a time) and the name is supplied by
        // aria-label instead.
        //
        // aria-label rather than an off-screen text copy on purpose: a copy
        // would leave the heading's textContent reading the title twice, which
        // anything that ignores aria-hidden - crawlers included - would see.
        // aria-label also satisfies the section's aria-labelledby, which
        // points at this heading.
        var visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        visual.appendChild(split);

        if (!el.getAttribute('aria-label')) {
            el.setAttribute('aria-label', text);
        }

        el.textContent = '';
        el.appendChild(visual);
        el.classList.add('tx-split', 'tx-split--ready');

        if (byWord) {
            el.classList.add('tx-split--words');
        }
    }

    // Reveals when the element reaches the viewport. The hero is already in
    // view on load so it fires on the observer's first callback; the pull
    // quote is ~2000px down, where a load-time reveal would have finished
    // long before anyone scrolled to it.
    /*
     * One-shot by default. With data-tx-replay the element goes back to its
     * start state once it has left the viewport entirely, so the reveal plays
     * again on the way back - the canvas does this for the section headings
     * ([data-sh="1"]). The start state has no transition, so the reset is
     * never seen.
     */
    function revealOnView(el, cls) {
        if (typeof window.IntersectionObserver !== 'function') {
            el.classList.add(cls);
            return;
        }

        var replay = el.hasAttribute('data-tx-replay');

        var io = new window.IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];

                if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                    entry.target.classList.add(cls);

                    if (!replay) {
                        io.unobserve(entry.target);
                    }
                } else if (replay && !entry.isIntersecting) {
                    entry.target.classList.remove(cls);
                }
            }
        }, { threshold: [0, 0.25], rootMargin: '0px 0px -10% 0px' });

        io.observe(el);
    }

    function initSplitText() {
        if (prefersReducedMotion()) {
            return;
        }

        var titles = document.querySelectorAll('[data-tx-split]');
        var fades = document.querySelectorAll('[data-tx-fade]');
        var i;

        for (i = 0; i < titles.length; i++) {
            splitText(titles[i]);
        }

        for (i = 0; i < fades.length; i++) {
            fades[i].classList.add('tx-fade--ready');
        }

        if (!titles.length && !fades.length) {
            return;
        }

        // Two frames: one for the hidden state to be committed, the next to
        // hand over to the observer. The canvas uses a 60ms timeout for this.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var n;

                for (n = 0; n < titles.length; n++) {
                    revealOnView(titles[n], 'tx-split--in');
                }

                for (n = 0; n < fades.length; n++) {
                    revealOnView(fades[n], 'tx-fade--in');
                }
            });
        });
    }

    /* ------------------------------------------------------------------
     * Scroll-scrubbed reveal ([data-tx-reveal])
     *
     * The collage tiles in the dark section: hidden, small and blurred, then
     * zooming and un-blurring as you scroll past. Ported from the check()
     * loop in the artboard's componentDidMount()
     * (design/TETTRIX Homepage.dc.html:680), which drives [data-reveal="1"].
     *
     * Unlike the split-text reveal this is genuinely scrubbed, not a one-shot:
     * progress comes from the element's position every frame, so it runs
     * backwards when you scroll up. Same numbers as the canvas:
     *
     *   span = h * 0.62
     *   p    = ease(clamp((h * 0.95 - top) / span - delay))
     *   scale 0.86 -> 1.00,  rotate 0 -> data-tx-rot,  blur 6px -> 0
     *
     * data-tx-delay staggers the three tiles (0, 0.12, 0.24) in progress
     * units, not seconds - a later tile needs more scroll to catch up.
     *
     * Nothing is hidden until this runs, so the photos stay visible if the
     * script never does.
     * ---------------------------------------------------------------- */
    var REVEAL_SCALE_FROM = 0.86;
    var REVEAL_BLUR_FROM = 6;

    function clamp01(v) {
        return v < 0 ? 0 : (v > 1 ? 1 : v);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function initScrollReveal() {
        var items = document.querySelectorAll('[data-tx-reveal]');

        if (!items.length || prefersReducedMotion()) {
            return;
        }

        // The canvas is a 1200px-wide artboard and never defines a small
        // screen. The tilt is the part that reads badly in a narrow two-column
        // grid, so it is dropped there; the zoom and fade still run.
        var noTilt = window.matchMedia ? window.matchMedia('(max-width: 767.98px)') : null;

        var list = Array.prototype.slice.call(items);
        var queued = false;

        function paint() {
            queued = false;

            var h = window.innerHeight || 800;
            var span = h * 0.62;
            var flat = noTilt && noTilt.matches;

            for (var i = 0; i < list.length; i++) {
                var el = list[i];
                var top = el.getBoundingClientRect().top;
                var delay = parseFloat(el.getAttribute('data-tx-delay') || '0');
                var rot = flat ? 0 : parseFloat(el.getAttribute('data-tx-rot') || '0');
                var p = easeOutCubic(clamp01((h * 0.95 - top) / span - delay));

                el.style.opacity = String(p);
                el.style.transform =
                    'scale(' + (REVEAL_SCALE_FROM + (1 - REVEAL_SCALE_FROM) * p).toFixed(4) + ') ' +
                    'rotate(' + (rot * p).toFixed(2) + 'deg)';
                el.style.filter = 'blur(' + (REVEAL_BLUR_FROM * (1 - p)).toFixed(2) + 'px)';
            }
        }

        // One paint per frame at most, however often scroll fires.
        function request() {
            if (!queued) {
                queued = true;
                window.requestAnimationFrame(paint);
            }
        }

        for (var i = 0; i < list.length; i++) {
            list[i].style.willChange = 'transform, opacity, filter';
        }

        window.addEventListener('scroll', request, { passive: true });
        window.addEventListener('resize', request);

        // Images settling changes the tiles' offsets, so re-measure on load.
        window.addEventListener('load', request);

        paint();
    }

    /* ------------------------------------------------------------------
     * Drawers ([data-tx-dialog] -> <dialog class="tx-drawer">)
     *
     * The pillar cards open the right-hand detail panel from the canvas.
     * Built on the native <dialog> so the browser supplies the top layer
     * (clearing the z-index: 9999 fixed header), Escape, the backdrop, the
     * focus trap and inertness for the rest of the page.
     * What is left to do here: open it, close it on the close button or a
     * click outside the panel, and put focus back on the card that opened
     * it.
     *
     * No page-level scroll lock on purpose - it made the document jump to
     * the top. See the note under .tx-drawer in components/tettrix.less.
     * ---------------------------------------------------------------- */
    var lastTrigger = null;

    function closeDialog(dialog) {
        if (dialog.open) {
            dialog.close();
        }
    }

    function bindDialog(dialog) {
        if (dialog.getAttribute('data-tx-dialog-ready')) {
            return;
        }

        dialog.setAttribute('data-tx-dialog-ready', '1');

        var closers = dialog.querySelectorAll('[data-tx-dialog-close]');

        for (var i = 0; i < closers.length; i++) {
            closers[i].addEventListener('click', function () {
                closeDialog(dialog);
            });
        }

        // Click outside the panel. The backdrop is a pseudo-element, so a
        // click on it still targets the <dialog>; and because the <dialog>
        // IS the panel here, the only reliable test is geometric.
        dialog.addEventListener('click', function (event) {
            var box = dialog.getBoundingClientRect();
            var inside = event.clientX >= box.left &&
                event.clientX <= box.right &&
                event.clientY >= box.top &&
                event.clientY <= box.bottom;

            if (!inside) {
                closeDialog(dialog);
            }
        });

        // Fires for the close button, Escape and the backdrop alike.
        dialog.addEventListener('close', function () {
            if (lastTrigger) {
                lastTrigger.focus();
                lastTrigger = null;
            }
        });
    }

    function initDialogs() {
        var triggers = document.querySelectorAll('[data-tx-dialog]');

        for (var i = 0; i < triggers.length; i++) {
            (function (trigger) {
                if (trigger.getAttribute('data-tx-dialog-ready')) {
                    return;
                }

                var dialog = document.getElementById(trigger.getAttribute('data-tx-dialog'));

                // No dialog, or a browser without showModal: leave the
                // trigger inert rather than opening a panel that cannot be
                // dismissed.
                if (!dialog || typeof dialog.showModal !== 'function') {
                    return;
                }

                // Guard the trigger as well as the dialog: a second bind
                // would call showModal() twice, and the second call throws
                // InvalidStateError on an already-open dialog.
                trigger.setAttribute('data-tx-dialog-ready', '1');

                bindDialog(dialog);

                trigger.addEventListener('click', function (event) {
                    event.preventDefault();
                    lastTrigger = trigger;
                    dialog.showModal();
                });
            })(triggers[i]);
        }
    }

    /* ------------------------------------------------------------------
     * Accordion (.tx-acc) - the output rows inside a pillar drawer
     *
     * The reveal itself is CSS (grid-template-rows 0fr -> 1fr, see .tx-acc
     * in assets/less/components/tettrix.less). This only flips the state:
     * aria-expanded for assistive tech, and .is-open on the <li> for the
     * stylesheet - the trigger sits inside a heading, so the panel is not
     * its sibling and a CSS-only sibling selector cannot reach it.
     *
     * Rows toggle independently; opening one does not close the others.
     * ---------------------------------------------------------------- */
    function initAccordions() {
        var triggers = document.querySelectorAll('.tx-acc__trigger');

        for (var i = 0; i < triggers.length; i++) {
            (function (trigger) {
                if (trigger.getAttribute('data-tx-acc-ready')) {
                    return;
                }

                trigger.setAttribute('data-tx-acc-ready', '1');

                trigger.addEventListener('click', function () {
                    var item = trigger.closest ?
                        trigger.closest('.tx-acc__item') :
                        trigger.parentNode.parentNode;

                    var open = trigger.getAttribute('aria-expanded') === 'true';

                    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');

                    if (item) {
                        if (open) {
                            item.classList.remove('is-open');
                        } else {
                            item.classList.add('is-open');
                        }
                    }
                });
            })(triggers[i]);
        }
    }

    /* ------------------------------------------------------------------
     * Announcement ticker pause/play
     *
     * partials/site/banner.htm. The scroll itself is a CSS animation; this
     * only flips .is-paused and keeps the button's accessible name in step.
     * Reduced-motion visitors get it paused from the start.
     * ---------------------------------------------------------------- */
    function initBanner() {
        var banner = document.getElementById('tx-banner');
        var toggle = banner && banner.querySelector('.tx-banner__toggle');

        if (!toggle) {
            return;
        }

        function setPaused(paused) {
            if (paused) {
                banner.classList.add('is-paused');
            } else {
                banner.classList.remove('is-paused');
            }
            toggle.setAttribute('aria-label', paused ? 'Play announcement' : 'Pause announcement');
        }

        setPaused(prefersReducedMotion());

        toggle.addEventListener('click', function () {
            setPaused(!banner.classList.contains('is-paused'));
        });
    }

    /* ------------------------------------------------------------------
     * Hero background clips
     *
     * Ported from the [data-hv] rotation in the artboard's
     * componentDidMount(): muted clips stacked over the hero image, one
     * crossfading to the next every 2s (the fade itself is the 1.4s opacity
     * transition on .tx-hero__video).
     *
     * The canvas sets src + preload="auto" on all six up front, which is
     * ~80MB before the page is usable. Here the clips carry data-src and are
     * fetched one after another: the first as soon as possible, each next
     * one once the previous can play through. A tick whose next clip is not
     * buffered yet is simply skipped, so a slow connection lingers on the
     * current clip instead of fading to a blank frame.
     *
     * Whether to play at all (not under reduced motion, Save-Data or below
     * 768px) is decided before first paint by the inline script after
     * .tx-hero__media in pages/home.htm, which adds .is-video-mode and so
     * hides the hero image. Without that class the image is the whole
     * background. If the clips fail, or have not started within
     * HERO_VIDEO_GRACE, the class comes off and the image returns.
     * ---------------------------------------------------------------- */
    var HERO_VIDEO_INTERVAL = 2000;
    var HERO_VIDEO_FADE = 1400;
    var HERO_VIDEO_GRACE = 6000;

    function initHeroVideos() {
        var media = document.querySelector('[data-tx-hero-videos]');
        var hero = media && (media.closest ? media.closest('.tx-hero') : media.parentNode);
        var videos = media ? media.querySelectorAll('.tx-hero__video') : [];
        var toggle = hero && hero.querySelector('.tx-hero__video-toggle');
        if (!videos.length || !media.classList.contains('is-video-mode')) {
            return;
        }

        var current = 0;
        var timer = null;
        var paused = false;
        var started = false;

        // Back to the still image: stop everything and drop the clips.
        function fallBack() {
            if (started) {
                return;
            }

            started = true;
            clearTimeout(grace);

            for (var i = 0; i < videos.length; i++) {
                videos[i].removeAttribute('src');
                videos[i].load();
            }

            media.classList.remove('is-video-mode');
        }

        var grace = setTimeout(fallBack, HERO_VIDEO_GRACE);

        function load(video) {
            if (!video.getAttribute('src')) {
                video.muted = true;
                video.setAttribute('src', video.getAttribute('data-src'));
                video.preload = 'auto';
                video.load();
            }
        }

        // Each clip starts buffering once the one before it can play through.
        function loadAfter(index) {
            var next = videos[index + 1];

            if (!next) {
                return;
            }

            videos[index].addEventListener('canplaythrough', function () {
                load(next);
                loadAfter(index + 1);
            }, { once: true });
        }

        function play(video) {
            var p = video.play();

            if (p && p.catch) {
                p.catch(function () {
                    // Autoplay refused for the first clip: nothing will run.
                    if (video === videos[0] && !started) {
                        fallBack();
                    }
                });
            }
        }

        function advance() {
            var nextIndex = (current + 1) % videos.length;
            var next = videos[nextIndex];
            var prev = videos[current];

            // HAVE_FUTURE_DATA: enough to start without stalling.
            if (nextIndex === current || next.readyState < 3) {
                return;
            }

            try { next.currentTime = 0; } catch (e) {}
            play(next);
            next.classList.add('is-active');
            prev.classList.remove('is-active');
            current = nextIndex;

            // Stop decoding the outgoing clip once it has faded out.
            setTimeout(function () {
                if (videos[current] !== prev) {
                    prev.pause();
                }
            }, HERO_VIDEO_FADE);
        }

        function start() {
            if (!timer && videos.length > 1) {
                timer = setInterval(advance, HERO_VIDEO_INTERVAL);
            }
        }

        function stop() {
            clearInterval(timer);
            timer = null;
        }

        function setPaused(value) {
            paused = value;
            hero.classList.toggle('is-video-paused', paused);
            toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');

            if (paused) {
                stop();
                videos[current].pause();
            } else {
                play(videos[current]);
                start();
            }
        }

        var first = videos[0];

        first.addEventListener('error', fallBack, { once: true });

        first.addEventListener('playing', function () {
            if (started) {
                return;
            }

            started = true;
            clearTimeout(grace);
            first.classList.add('is-active');

            if (toggle) {
                toggle.hidden = false;
            }

            start();
        }, { once: true });

        load(first);
        loadAfter(0);
        play(first);

        if (toggle) {
            toggle.addEventListener('click', function () {
                setPaused(!paused);
            });
        }
    }

    function init() {
        initButtonLabels();
        initSplitText();
        initScrollReveal();
        initDialogs();
        initAccordions();
        initBanner();
        initHeroVideos();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
