// 音效控制系统
document.addEventListener('DOMContentLoaded', function() {
    // 获取音效元素
    const hoverSound = document.getElementById('hover-sound');
    const clickSound = document.getElementById('click-sound');
    const highlightSound = document.getElementById('highlight-sound');
    
    // 控制音量
    const VOLUME = 0.2; // 全局音量控制
    if (hoverSound) hoverSound.volume = VOLUME * 0.5;
    if (clickSound) clickSound.volume = VOLUME * 0.7;
    if (highlightSound) highlightSound.volume = VOLUME * 0.6;
    
    // 用户互动标志 - 只有在用户交互后才播放音效
    let userInteracted = false;
    
    // 音效开关状态
    let soundEnabled = true;
    
    // 音量控制按钮
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        // 检查本地存储中的声音设置
        if (localStorage.getItem('soundMuted') === 'true') {
            soundEnabled = false;
            soundToggle.classList.add('muted');
        }
        
        // 添加点击事件来切换声音状态
        soundToggle.addEventListener('click', function() {
            soundEnabled = !soundEnabled;
            localStorage.setItem('soundMuted', (!soundEnabled).toString());
            
            if (soundEnabled) {
                soundToggle.classList.remove('muted');
                // 播放一个声音表示开启
                playSound(clickSound);
            } else {
                soundToggle.classList.add('muted');
            }
        });
    }
    
    document.addEventListener('click', function() {
        userInteracted = true;
    });
    
    // 为导航链接添加悬停音效
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            playSound(hoverSound);
        });
    });
    
    // 为高亮文本添加悬停音效
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        highlight.addEventListener('mouseenter', function() {
            playSound(highlightSound);
        });
    });
    
    // 为所有按钮和链接添加点击音效
    const clickables = document.querySelectorAll('a, button, .social-link, .project-card');
    clickables.forEach(element => {
        element.addEventListener('click', function() {
            playSound(clickSound);
        });
    });
    
    // 粒子交互音效
    const particlesCanvas = document.getElementById('particles-canvas');
    if (particlesCanvas) {
        particlesCanvas.addEventListener('click', function() {
            playSound(clickSound);
        });
    }
    
    // 播放音效的函数
    function playSound(sound) {
        // 只在用户有交互、音效存在、且声音开启的情况下播放
        if (userInteracted && sound && sound.readyState >= 2 && soundEnabled) {
            // 重置音效到开始位置以便重新播放
            sound.currentTime = 0;
            sound.play().catch(e => {
                // 忽略自动播放策略导致的错误
                console.log("Sound play prevented:", e);
            });
        }
    }
}); 