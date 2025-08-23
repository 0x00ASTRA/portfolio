let isDecodingPaused = false; // Global variable to control decoding pause

window.startResumePageDecoding = () => {
    isDecodingPaused = false;
};

document.addEventListener('DOMContentLoaded', () => {
    
    
    

    const elementsToAnimate = Array.from(document.querySelectorAll(
        '.content h1, .content h2, .content h3, .content p, .content a, .content span, .content li'
    )).filter(element => !element.closest('pre'));

    const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    const maxAnimatedChars = 1000; // Skip animation for very large texts on low-performance devices

    const animations = elementsToAnimate.map(element => {
        const originalText = element.textContent;
        const textLength = originalText.length;
        

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
            isAnimating: true
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

    // Convert Mermaid code blocks to div.mermaid immediately
    document.querySelectorAll('pre code').forEach(codeBlock => {
        const code = codeBlock.textContent.trim();
        // Check if the code block contains Mermaid syntax
        if (code.startsWith('graph') || code.startsWith('sequenceDiagram') || code.startsWith('gantt') || code.startsWith('classDiagram') || code.startsWith('stateDiagram') || code.startsWith('pie') || code.startsWith('erDiagram') || code.startsWith('journey') || code.startsWith('flowchart') || code.startsWith('gitGraph')) {
            const mermaidDiv = document.createElement('div');
            mermaidDiv.classList.add('mermaid');
            mermaidDiv.textContent = code;
            codeBlock.parentNode.parentNode.replaceChild(mermaidDiv, codeBlock.parentNode);
        }
    });

    

    

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
            if (animation.unrevealedIndices.length === 0) {
                animation.element.textContent = animation.originalText;
                return;
            }

            allComplete = false;
            const { element, originalText, revealed, unrevealedIndices, display } = animation;

            if (!isDecodingPaused) { // Only decode if not paused
                const charsToReveal = Math.max(1, Math.ceil(unrevealedIndices.length / (targetDuration / frameRate)));
                for (let i = 0; i < charsToReveal && unrevealedIndices.length > 0; i++) {
                    const indexToReveal = unrevealedIndices.shift(); // Reveal from the beginning
                    revealed[indexToReveal] = 1;
                }
            }

            // Always do the glitching and update display after revealing characters
            for (let i = 0; i < revealed.length; i++) {
                display[i] = revealed[i] ? originalText[i] : "01"[Math.random() * 2 | 0];
            }
            element.textContent = display.join('');
        });

        if (!allComplete) {
            requestAnimationFrame(animate);
        } else {
            
        }
    }

    requestAnimationFrame(animate);
});
