document.addEventListener('DOMContentLoaded', () => {
    const nameElement = document.querySelector('.bio-info h1');
    const pageTitleElements = document.querySelectorAll('main .input-box h1');

    // Animate the name only on the first visit of the session
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (nameElement && !hasVisited) {
        const styleSheet = document.createElement('style');
        const text = nameElement.textContent.trim();
        const steps = text.length;
        const duration = steps / 15.6;
        const animationName = 'typing-name';

        styleSheet.innerText = `
            @keyframes ${animationName} {
                from { width: 0; }
                to { width: 100%; }
            }
            .bio-info h1 {
                animation: ${animationName} ${duration}s steps(${steps}, end);
            }
        `;
        document.head.appendChild(styleSheet);
        sessionStorage.setItem('hasVisited', 'true');
    }

    // Animate all page title elements with "> " prefix if they have content
    pageTitleElements.forEach(element => {
        const text = element.textContent.trim();
        if (text) { // Only process non-empty elements
            const prefixedText = `> ${text}`;
            element.textContent = prefixedText; // Add "> " prefix
            const styleSheet = document.createElement('style');
            const steps = prefixedText.length; // Include prefix in animation steps
            const duration = steps / 15.6;
            const animationName = `typing-title-${Math.random().toString(36).slice(2)}`; // Unique animation name

            styleSheet.innerText = `
                @keyframes ${animationName} {
                    from { width: 0; }
                    to { width: 100%; }
                }
                main .input-box h1[data-text="${text}"] {
                    animation: ${animationName} ${duration}s steps(${steps}, end);
                }
            `;
            element.setAttribute('data-text', text); // Add data attribute to target specific element
            document.head.appendChild(styleSheet);
        }
    });
});
