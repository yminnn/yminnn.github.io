// Theme toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const storedTheme = localStorage.getItem('theme') || 'dark';
    
    // Set initial theme
    root.setAttribute('data-theme', storedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Add smooth transition class
        root.classList.add('theme-transition');
        
        // Update theme
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Play sound effect
        const clickSound = document.getElementById('click-sound');
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(() => {});
        }
        
        // Remove transition class after animation
        setTimeout(() => {
            root.classList.remove('theme-transition');
        }, 300);
    });
}); 