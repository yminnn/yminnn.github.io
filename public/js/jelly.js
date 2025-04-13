// 水波纹边缘效果 - 让粒子容器边缘像水波纹一样变形
document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.particles-container');
  if (!container) return;
  
  // 动画属性
  let isAnimating = false;
  const pointCount = 16; // 控制点数量
  const points = [];     // 存储波浪控制点
  
  // 设置参数 - 控制波浪幅度和速度
  const springStrength = 0.08;  // 弹性强度
  const damping = 0.9;          // 阻尼系数
  const maxWaveHeight = 8;      // 最大波浪高度 - 较小以保持微妙效果
  const mouseInfluence = 0.5;   // 鼠标影响强度
  
  // 初始化控制点
  for (let i = 0; i < pointCount; i++) {
    points.push({
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      velocity: { x: 0, y: 0 },
      random: Math.random() * 0.5 + 0.5,     // 随机因子，使波动更自然
      phase: Math.random() * Math.PI * 2     // 随机相位，用于微小波动
    });
  }
  
  // 初始化容器尺寸
  let containerRect = container.getBoundingClientRect();
  
  // 动画帧计数器和时间
  let frameCount = 0;
  let lastTime = Date.now();
  
  // 窗口大小改变时重新计算容器位置
  window.addEventListener('resize', function() {
    containerRect = container.getBoundingClientRect();
  });
  
  // 鼠标移动事件
  document.addEventListener('mousemove', function(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 计算鼠标和容器的相对位置
    containerRect = container.getBoundingClientRect();
    const containerLeft = containerRect.left;
    const containerTop = containerRect.top;
    
    // 更新控制点的目标位置
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      // 计算点在容器边缘上的基础位置
      // 这里我们将点平均分布在容器的四条边上
      const edgeIndex = Math.floor(i / (pointCount / 4));
      const segmentIndex = i % (pointCount / 4);
      const segmentLength = pointCount / 4;
      
      let baseX = 0, baseY = 0;
      
      // 确定点在哪条边上
      if (edgeIndex === 0) { // 上边
        baseX = containerRect.width * (segmentIndex / segmentLength);
        baseY = 0;
      } else if (edgeIndex === 1) { // 右边
        baseX = containerRect.width;
        baseY = containerRect.height * (segmentIndex / segmentLength);
      } else if (edgeIndex === 2) { // 下边
        baseX = containerRect.width * (1 - segmentIndex / segmentLength);
        baseY = containerRect.height;
      } else { // 左边
        baseX = 0;
        baseY = containerRect.height * (1 - segmentIndex / segmentLength);
      }
      
      // 计算鼠标位置与点的距离
      const dx = mouseX - (containerLeft + baseX);
      const dy = mouseY - (containerTop + baseY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 根据距离计算波动影响 - 越近影响越大
      const maxDistance = 200; // 最大影响距离
      if (distance < maxDistance) {
        // 计算影响强度，使用非线性衰减让近距离效果更强烈
        const distanceRatio = distance / maxDistance;
        const influence = (1 - distanceRatio * distanceRatio) * mouseInfluence * point.random;
        
        // 添加波纹效果 - 波浪推向远离鼠标的方向
        let angle = Math.atan2(dy, dx);
        let offsetX = Math.cos(angle) * maxWaveHeight * influence;
        let offsetY = Math.sin(angle) * maxWaveHeight * influence;
        
        // 使用物理模拟来创建波浪效果
        point.targetX = -offsetX;
        point.targetY = -offsetY;
      } else {
        // 远处的点逐渐回归原位
        point.targetX *= damping;
        point.targetY *= damping;
      }
    }
    
    // 启动动画
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animateWaves);
    }
  });
  
  // 动画循环
  function animateWaves() {
    let stillMoving = false;
    
    // 计算时间差和时间因子
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // 更新帧计数器
    frameCount++;
    
    // 更新每个点的位置
    points.forEach(point => {
      // 添加微小的持续波动效果
      const idleWave = Math.sin(frameCount * 0.05 + point.phase) * 0.3;
      
      // 使用弹簧物理模型
      const dx = point.targetX - point.x;
      const dy = point.targetY - point.y;
      
      // 添加弹簧力
      point.velocity.x += dx * springStrength;
      point.velocity.y += dy * springStrength;
      
      // 添加微小波动
      point.velocity.x += idleWave * 0.03 * point.random;
      point.velocity.y += idleWave * 0.03 * point.random;
      
      // 应用阻尼
      point.velocity.x *= damping;
      point.velocity.y *= damping;
      
      // 更新位置
      point.x += point.velocity.x;
      point.y += point.velocity.y;
      
      // 检查点是否仍在移动
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 ||
          Math.abs(point.velocity.x) > 0.01 || Math.abs(point.velocity.y) > 0.01) {
        stillMoving = true;
      }
    });
    
    // 应用波浪效果 - 构建多边形路径
    applyWaveEffect();
    
    // 即使没有明显运动，也保持轻微的恒定波动
    if (stillMoving || frameCount % 60 === 0) {
      requestAnimationFrame(animateWaves);
    } else {
      isAnimating = false;
      // 恢复默认形状
      container.style.clipPath = 'none';
    }
  }
  
  // 应用波浪效果到容器
  function applyWaveEffect() {
    // 生成路径字符串
    let pathString = 'polygon(';
    const segments = [];
    
    // 生成波浪多边形路径
    for (let i = 0; i < pointCount; i++) {
      const point = points[i];
      
      // 计算在边缘上的基础位置
      const edgeIndex = Math.floor(i / (pointCount / 4));
      const segmentIndex = i % (pointCount / 4);
      const segmentLength = pointCount / 4;
      
      let x, y;
      
      // 确定点在哪条边上
      if (edgeIndex === 0) { // 上边
        x = containerRect.width * (segmentIndex / segmentLength);
        y = 0 + point.y; // 添加波动
      } else if (edgeIndex === 1) { // 右边
        x = containerRect.width + point.x; // 添加波动
        y = containerRect.height * (segmentIndex / segmentLength);
      } else if (edgeIndex === 2) { // 下边
        x = containerRect.width * (1 - segmentIndex / segmentLength);
        y = containerRect.height + point.y; // 添加波动
      } else { // 左边
        x = 0 + point.x; // 添加波动
        y = containerRect.height * (1 - segmentIndex / segmentLength);
      }
      
      // 确保点不会超出容器太多
      x = Math.max(-5, Math.min(containerRect.width + 5, x));
      y = Math.max(-5, Math.min(containerRect.height + 5, y));
      
      // 添加到路径
      segments.push(`${(x / containerRect.width) * 100}% ${(y / containerRect.height) * 100}%`);
    }
    
    // 完成路径字符串
    pathString += segments.join(', ') + ')';
    
    // 应用到容器
    container.style.clipPath = pathString;
  }
  
  // 鼠标离开页面时重置
  document.addEventListener('mouseleave', function() {
    points.forEach(point => {
      point.targetX = 0;
      point.targetY = 0;
    });
    
    if (!isAnimating) {
      isAnimating = true;
      requestAnimationFrame(animateWaves);
    }
  });
}); 