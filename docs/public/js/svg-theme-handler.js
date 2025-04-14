// SVG主题处理器
document.addEventListener('DOMContentLoaded', function() {
  // 获取所有SVG对象标签
  const svgObjects = document.querySelectorAll('object[type="image/svg+xml"]');
  
  // 初始化SVG主题
  updateSvgThemes();
  
  // 监听主题切换
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        updateSvgThemes();
      }
    });
  });
  
  // 开始观察文档根元素的data-theme属性变化
  observer.observe(document.documentElement, { 
    attributes: true,
    attributeFilter: ['data-theme']
  });
  
  // 更新所有SVG的主题
  function updateSvgThemes() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    console.log('当前主题:', currentTheme);
    
    svgObjects.forEach(function(obj) {
      // 等待SVG加载完成
      obj.addEventListener('load', function() {
        try {
          const svgDoc = obj.contentDocument;
          if (svgDoc) {
            // 设置SVG文档根元素的data-theme属性
            svgDoc.documentElement.setAttribute('data-theme', currentTheme);
            console.log('已更新SVG主题:', obj.getAttribute('data'), currentTheme);
          }
        } catch (e) {
          console.error('无法更新SVG主题:', e);
        }
      });
      
      // 如果SVG已加载，立即应用主题
      if (obj.contentDocument && obj.contentDocument.readyState === 'complete') {
        try {
          obj.contentDocument.documentElement.setAttribute('data-theme', currentTheme);
          console.log('已立即更新SVG主题:', obj.getAttribute('data'));
        } catch (e) {
          console.error('无法立即更新SVG主题:', e);
        }
      }
    });
  }
}); 