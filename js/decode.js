document.addEventListener('DOMContentLoaded', () => {
    let isDecodingPaused = false;
    const resumeForm = document.getElementById('resume-form');
    if (resumeForm) {
        isDecodingPaused = true;
        window.startResumePageDecoding = () => {
            isDecodingPaused = false;
        };
    }

    const elementsToAnimate = Array.from(document.querySelectorAll(
        '.content h1, .content h2, .content h3, .content p, .content a, .content span, .content li'
    ));

    const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const maxAnimatedChars = 1000; // Skip animation for very large texts on low-performance devices

    const animations = elementsToAnimate.map(element => {
        const originalText = element.textContent;
        const textLength = originalText.length;
        const skipAnimation = isLowPerformance && textLength > maxAnimatedChars;

        if (skipAnimation) {
            return { element, originalText, unrevealedIndices: [] };
        }

        const revealed = new Uint8Array(textLength);
        const unrevealedIndices = [];
        for (let i = 0; i < textLength; i++) {
            if (originalText[i] === " ") revealed[i] = 1;
            else unrevealedIndices.push(i);
        }
        return {
            element,
            originalText,
            revealed,
            unrevealedIndices,
            display: new Array(textLength),
            isAnimating: false
        };
    });

    // Set initial encoded state for all elements
    animations.forEach(animation => {
        if (animation.unrevealedIndices && animation.unrevealedIndices.length > 0) {
            const { element, originalText, revealed, display } = animation;
            for (let i = 0; i < revealed.length; i++) {
                display[i] = revealed[i] ? originalText[i] : "01"[Math.random() * 2 | 0];
            }
            element.textContent = display.join('');
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const animation = animations.find(a => a.element === entry.target);
            if (entry.isIntersecting && animation.unrevealedIndices.length > 0) {
                animation.isAnimating = true;
            }
        });
    }, { threshold: 0.1 });

    elementsToAnimate.forEach(element => observer.observe(element));

    const frameRate = isLowPerformance ? 30 : 15; // Slower frame rate for low-performance devices
    const targetDuration = 1500;
    let lastTime = performance.now();

    function animate(currentTime) {
        if (currentTime - lastTime < frameRate) {
            requestAnimationFrame(animate);
            return;
        }
        lastTime = currentTime;

        let allComplete = true;

        animations.forEach(animation => {
            if (!animation.isAnimating || animation.unrevealedIndices.length === 0) {
                if (animation.unrevealedIndices.length === 0) {
                    animation.element.textContent = animation.originalText;
                }
                return;
            }

            allComplete = false;
            const { element, originalText, revealed, unrevealedIndices, display } = animation;

            // Always do the glitching
            for (let i = 0; i < revealed.length; i++) {
                display[i] = revealed[i] ? originalText[i] : "01"[Math.random() * 2 | 0];
            }
            element.textContent = display.join('');

            // Only do the decoding if not paused
            if (!isDecodingPaused) {
                const charsPerFrame = Math.max(1, Math.ceil(unrevealedIndices.length / (targetDuration / frameRate)));
                for (let i = 0; i < charsPerFrame && unrevealedIndices.length > 0; i++) {
                    const randIdx = Math.random() * unrevealedIndices.length | 0;
                    revealed[unrevealedIndices[randIdx]] = 1;
                    unrevealedIndices.splice(randIdx, 1);
                }
            }
        });

        if (!allComplete) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});
