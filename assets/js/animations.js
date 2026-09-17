/**
 * Animations.js - Contains all animation logic for the AGRI4POL site
 */

// Animation functions
function animateHeaderText() {
    // const mainTitle = $('.hero h1');
    // // Hide H1 initially for reveal animation (can also be done via CSS)
    // mainTitle.css('opacity', 0);
    // animateHeadingWords(mainTitle); // Use new word animation for H1

    // Animate the subtitle after H1 animation starts
    setTimeout(() => {
        const subtitles = $('.hero h1');
        subtitles.each(function (index) {
            setTimeout(() => {
                animateSubtitleWords($(this), 0.5);
            }, index * 300); // Stagger subtitle lines
        });
    }, 0); // Start subtitle animation ~1s after H1 starts -- 1000
}



// Animation functions
function animateAboutText(element) {
    // const mainTitle = $('.hero h1');
    // // Hide H1 initially for reveal animation (can also be done via CSS)
    // mainTitle.css('opacity', 0);
    // animateHeadingWords(mainTitle); // Use new word animation for H1

    // Animate the subtitle after H1 animation starts
    setTimeout(() => {
        const subtitles = element;
        subtitles.each(function (index) {
            setTimeout(() => {
                animateSubtitleWords($(this), 0.3);
            }, index * 300); // Stagger subtitle lines
        });
    }, 0); // Start subtitle animation ~1s after H1 starts -- 1000
}

// New animation function for H1 heading: Fade-in + Scale-up word by word
function animateHeadingWords(element) {
    const text = element.text();
    element.empty(); // Clear original content

    const words = text.split(/(\s+)/);
    let wordIndex = 0;

    words.forEach((part) => {
        if (part.match(/\s+/)) {
            element.append(part); // Append spaces directly
        } else if (part.length > 0) {
            // Create a single span for the word
            const wordSpan = $(
                `<span class="heading-word-animation" style="
                    display: inline-block; /* Allows transform */
                    opacity: 0;
                    transform: scale(0.95);
                    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
                ">${part}</span>`
            );
            element.append(wordSpan);

            // Trigger the animation with a stagger
            setTimeout(() => {
                 wordSpan.css({
                     'opacity': '1',
                     'transform': 'scale(1)'
                 });
            }, wordIndex * 75); // 75ms delay between words

            wordIndex++;
        }
    });
    // Make the H1 visible now that its content is set up for animation
    element.css('opacity', 1);
}

// New animation function for subtitles: Masked slide-up reveal word by word
function animateSubtitleWords(element, delay) {
    const text = element.text();
    element.empty(); // Clear original content

    const words = text.split(/(\s+)/); // Split by spaces, preserving them
    let wordIndex = 0;
    words.forEach((part) => {
        if (part.match(/\s+/)) {
            // Append spaces directly
            element.append(part);
        } else if (part.length > 0) {
            // It's a word - create mask and content structure
            const wordMask = $(
                `<span class="subtitle-word-mask" style="
                    display: inline-block;
                    overflow: hidden;
                    vertical-align: bottom; /* Adjust as needed */
                "></span>`
            );

            const wordContent = $(
                `<span class="subtitle-word-content" style=" text-transform: capitalize;
                    display: block; /* Important for transform */
                    transform: translateY(100%); /* Start at edge of mask */
                    transition: transform ${delay}s ease-out; /* Slower, softer easing */
                ">${part}</span>`
            );

            wordMask.append(wordContent);
            element.append(wordMask);

            // Trigger the animation with a stagger
            setTimeout(() => {
                 wordContent.css({
                    'transform': 'translateY(0%)'
                });
            }, wordIndex * 100); // Slower 100ms delay between words

            wordIndex++;
        }
    });

    // Make the parent <p> element visible now that its content is set up for animation
    element.css('opacity', 1);
}

function prepareTextAnimation() {
    // Process each news excerpt to prepare for word animation
    $('.news-excerpt').each(function() {
        // Skip if already processed
        if ($(this).find('.word-animation').length > 0) {
            return;
        }

        const text = $(this).text();
        const words = text.split(' ');

        // Clear original content
        $(this).empty();

        // Append each word wrapped in a span with staggered delay
        words.forEach((word, index) => {
            const delay = 0.015 * index; // Significantly faster delay (was 0.05)
            $(this).append(`<span class="word-animation" style="transition-delay: ${delay}s; display: inline-block; white-space: normal;">${word}&nbsp;</span>`);
        });
    });
}

function animateText(element) {
    // Skip if no word animations found or already processed
    if (element.find('.word-animation').length === 0) {
        // Maybe this element wasn't processed earlier, let's do it now
        const text = element.text();
        const words = text.split(' ');

        // Clear original content
        element.empty();

        // Append each word wrapped in a span with staggered delay
        words.forEach((word, index) => {
            const delay = 0.015 * index; // Significantly faster delay (was 0.05)
            const span = $(`<span class="word-animation" style="transition-delay: ${delay}s; display: inline-block; white-space: normal;">${word}&nbsp;</span>`);
            element.append(span);
        });
    }

    // Animate each word in sequence
    const words = element.find('.word-animation');

    words.each(function(index) {
        const word = $(this);
        setTimeout(() => {
            word.css({
                'opacity': '1',
                'transform': 'translateY(0)'
            });
        }, 15 * index); // Much faster animation (was 50ms)
    });
}

function animateNumbers() {
    if (window.numbersAnimated) return;

    const numberElements = document.querySelectorAll('.number');
    const finalNumbers = [23, 4, 14, 8];
    const duration = 2000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const countUp = () => {
        frame++;
        const progress = frame / totalFrames;
        const easeProgress = easeOutQuad(progress);

        numberElements.forEach((el, index) => {
            if (index < finalNumbers.length) {
                const currentValue = Math.round(easeProgress * finalNumbers[index]);
                el.textContent = currentValue;
            }
        });

        if (frame < totalFrames) {
            requestAnimationFrame(countUp);
        } else {
            numberElements.forEach((el, index) => {
                if (index < finalNumbers.length) {
                    el.textContent = finalNumbers[index];
                }
            });
            window.numbersAnimated = true;
        }
    };

    requestAnimationFrame(countUp);
}

function easeOutQuad(t) {
    return t * (2 - t);
}

function setupAnimations() {
    // Animate header title and subtitle if on homepage
    if ($('.hero').length > 0) {
        animateHeaderText();
    }

    // Prepare the text animation for news excerpts only
    prepareTextAnimation();

    // Initialize animations when hovering on news items
    $('.news-item').hover(
        function() {
            // Mouse enter
            const backContent = $(this).find('.back-content');

            // Animate text excerpt word by word
            setTimeout(() => {
                animateText(backContent.find('.news-excerpt'));
                backContent.find('.news-excerpt').addClass('animating');
            }, 50); // Slightly quicker animation start

            // Animate read more with immediate effect
            setTimeout(() => {
                backContent.find('.read-more').addClass('animated');
            }, 150); // Faster animation timing

            // Animate date with fade in
            setTimeout(() => {
                backContent.find('.news-date').addClass('animated');
            }, 200); // Faster timing

            setTimeout(() => {
                backContent.find('.news-excerpt::after').css('opacity', '1');
            }, 150); // Faster for gradient animation
        },
        function() {
            // Mouse leave - reset all animations
            const backContent = $(this).find('.back-content');
            backContent.find('.news-excerpt').removeClass('animating');
            backContent.find('.word-animation').css({
                'opacity': '0',
                'transform': 'translateY(8px)'
            });
            backContent.find('.news-excerpt::after').css('opacity', '0');
            backContent.find('.read-more').removeClass('animated');
            backContent.find('.news-date').removeClass('animated');
        }
    );

    // Set up scroll listener for number animation
    window.addEventListener('scroll', function() {
        // Check if numbers section is in view to trigger animation
        const numbersSection = document.querySelector('.numbers');
        if (numbersSection && isScrolledIntoView(numbersSection) && !window.numbersAnimated) {
            animateNumbers();
        }
    });
}

// Helper function to check if element is in view
function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    if($(elem).height()){
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }
    return;
}



// Function to animate text rows
function animateTextRowsSmooth() {

    const $rows = $('.animate_text');
    const totalRows = $rows.length;
    let currentRow = 0;

    // Reset all rows
    $rows.removeClass('loaded');

    function showNextRow() {
        if (currentRow < totalRows) {
            // Animate progress bar
            const progress = ((currentRow + 1) / totalRows) * 100;

            // Show current row
            $rows.eq(currentRow).addClass('loaded');
            currentRow++;

            // Schedule next row
            setTimeout(showNextRow, 600);
        } else {
            // Animation complete
            isAnimating = false;
        }
    }

    // Start the animation
    showNextRow();
}

// Initialize animations when document is ready
$(document).ready(function() {
    setupAnimations();
});
