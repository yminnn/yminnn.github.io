// Interactive Matrix Flow Animation
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let particleCount = 600; // 增加粒子数量
let animationId;
let mouseX = -100;
let mouseY = -100;
let mouseMoved = false;
let lastMouseMoveTime = 0;

// 高级配置
const config = {
  // 节点配置
  baseNodeSize: 2,            // 增大基础节点尺寸
  nodeSizeVariation: 3.0,     // 增加尺寸变化范围，允许更大的粒子
  nodeColors: [               // 扩展的节点颜色数组
    { r: 0, g: 0, b: 0, a: 0.8 },        // 深黑色
    { r: 10, g: 10, b: 10, a: 0.7 },     // 黑色
    { r: 30, g: 30, b: 30, a: 0.6 },     // 深灰色
    { r: 60, g: 60, b: 60, a: 0.4 },     // 中灰色
    { r: 100, g: 100, b: 100, a: 0.25 }, // 浅灰色
    { r: 255, g: 0, b: 0, a: 0.7 },      // 红色
    { r: 240, g: 20, b: 20, a: 0.5 },    // 亮红色
    { r: 200, g: 0, b: 0, a: 0.4 },      // 更柔和的红色，用于大粒子
  ],
  redNodesRatio: 0.12,        // 增加红色节点比例
  featheringLevels: [0.4, 0.6, 0.8, 1.0], // 不同的羽化程度
  largeParticleRatio: 0.12,   // 提高特大粒子的比例
  largeParticleSizeMultiplier: 3.5, // 特大粒子比普通粒子大的倍数
  pulseDuration: 4000,        // 脉冲周期，单位毫秒
  pulseIntensity: 0.4,        // 脉冲强度

  // 连接线配置
  maxConnections: 6,          // 增加连接数
  connectionDistance: 120,    // 增加连接距离
  lineOpacity: 0.18,          // 降低基础透明度使画面不那么密集
  minLineWidth: 0.3,          // 更细的线条
  maxLineWidth: 1.2,          // 最粗线条
  
  // 运动配置
  baseSpeed: 0.04,            // 减小基础移动速度，让大粒子移动更慢
  activeSpeed: 0.8,            // 激活时的移动速度
  mouseForce: 0.25,            // 增加鼠标引力/斥力强度
  mouseRadius: 140,            // 增加鼠标影响半径
  mouseRepelThreshold: 50,     // 增加鼠标排斥阈值
  
  // 行为配置
  idleAnimationDuration: 1500, // 鼠标不动后进入缓慢模式的时间缩短
  glowIntensity: 0.55,         // 增强光晕强度
  glowSizeMultiplier: 3.0,     // 增大光晕大小倍数
  
  // 视觉层次
  layerCount: 3,               // 视觉层次数量
  layerDistanceMultiplier: 1.5 // 层次距离倍数
};

// 重设画布和初始化
function resizeCanvas() {
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = canvas.parentElement.offsetHeight || 160; // Use container height or fallback to 160px
  
  // 根据屏幕尺寸调整粒子数量
  if (canvas.width < 600) {
    particleCount = Math.max(280, Math.floor(canvas.width * canvas.height / 8000));
  } else if (canvas.width < 1200) {
    particleCount = Math.max(320, Math.floor(canvas.width * canvas.height / 7000));
  } else {
    particleCount = Math.max(400, Math.floor(canvas.width * canvas.height / 6000));
  }

  // 对粒子最大数量进行限制
  particleCount = Math.min(particleCount, 700);
  
  // Re-initialize particles with new count
  initParticles();
}

// 创建随机粒子
function initParticles() {
  particles = [];
  
  // 创建按视觉层次分组的粒子
  for (let layer = 0; layer < config.layerCount; layer++) {
    const layerParticles = Math.floor(particleCount / config.layerCount);
    const layerDepth = layer / (config.layerCount - 1); // 0-1范围
    
    for (let i = 0; i < layerParticles; i++) {
      // 确定是否创建特大粒子
      const isLargeParticle = Math.random() < config.largeParticleRatio && layer === 0;
      
      // 为不同层次应用不同的视觉特性
      const isRed = Math.random() < (config.redNodesRatio * (layer === 0 ? 1.5 : 1)); // 前景层红色节点更多
      
      // 更丰富的颜色选择
      let colorIndex;
      if (isRed) {
        colorIndex = isLargeParticle ? 7 : 5 + Math.floor(Math.random() * 2); // 大粒子用柔和红，普通粒子用亮红
      } else {
        colorIndex = Math.floor(Math.random() * 5); // 0-4是灰度系
      }
      
      // 更多样的大小
      const layerSizeMultiplier = 1 - (layerDepth * 0.3); // 前景层粒子更大
      const sizeVariation = (Math.random() - 0.2) * config.nodeSizeVariation; // 更偏向大粒子
      let size = (config.baseNodeSize + sizeVariation) * layerSizeMultiplier;
      
      // 特大粒子尺寸
      if (isLargeParticle) {
        size *= config.largeParticleSizeMultiplier;
      }
      
      // 随机羽化程度 - 特大粒子有更强的羽化效果
      const featheringIndex = isLargeParticle 
        ? Math.min(2, Math.floor(Math.random() * config.featheringLevels.length)) 
        : Math.floor(Math.random() * config.featheringLevels.length);
      const feathering = config.featheringLevels[featheringIndex];
      
      // 计算速度因子 - 粒子越大移动越慢
      const sizeFactor = isLargeParticle ? 0.2 : 1.0; // 大粒子比普通粒子慢5倍
      const speedFactor = Math.max(0.1, 1.0 - (size / (config.baseNodeSize * config.largeParticleSizeMultiplier * 2)) * 0.9);
      
      // 创建粒子
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        originalSize: size,
        
        // 速度根据粒子大小调整 - 越大越慢
        vx: (Math.random() - 0.5) * config.baseSpeed * (1 + (1 - layerDepth) * 0.5) * speedFactor,
        vy: (Math.random() - 0.5) * config.baseSpeed * (1 + (1 - layerDepth) * 0.5) * speedFactor,
        
        // 颜色和透明度
        color: { ...config.nodeColors[colorIndex] }, // 复制一个新的颜色对象
        
        // 羽化和视觉效果
        feathering: feathering,
        layer: layer,
        layerDepth: layerDepth,
        
        // 存储状态
        active: false,
        activationLevel: 0,
        pulsePhase: Math.random() * Math.PI * 2, // 随机初始相位
        pulseSpeed: isLargeParticle ? 0.02 + Math.random() * 0.03 : 0.05 + Math.random() * 0.05, // 大粒子脉动更慢
        isLargeParticle: isLargeParticle,        // 标记为特大粒子
        speedFactor: speedFactor,                // 保存速度因子
        connections: []
      });
    }
  }
  
  // 预计算每个粒子可能的连接
  calculateConnections();
}

// 计算粒子之间的连接
function calculateConnections() {
  // 为每个粒子找到最近的几个其他粒子
  particles.forEach((particle, index) => {
    // 计算到所有其他粒子的距离
    const distances = [];
    
    for (let i = 0; i < particles.length; i++) {
      if (i !== index) {
        const other = particles[i];
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 连接距离随层级调整
        const effectiveDistance = config.connectionDistance * 
          (1 - Math.abs(particle.layer - other.layer) * 0.2); // 同层粒子更容易连接
        
        if (distance < effectiveDistance) {
          distances.push({ index: i, distance: distance });
        }
      }
    }
    
    // 按距离排序，选择最近的几个
    distances.sort((a, b) => a.distance - b.distance);
    
    // 大粒子有更多的连接
    let maxConn = config.maxConnections;
    if (particle.isLargeParticle) {
      maxConn *= 2; // 大粒子连接数翻倍
    } else {
      maxConn -= Math.floor(particle.layer * 1.5); // 背景层连接更少
    }
    
    particle.connections = distances.slice(0, Math.max(2, maxConn)).map(d => d.index);
    
    // 大粒子必须连接到它的宿主粒子
    if (particle.isLargeParticle && particle.attachedToParticleIndex >= 0) {
      if (!particle.connections.includes(particle.attachedToParticleIndex)) {
        particle.connections.push(particle.attachedToParticleIndex);
      }
    }
  });
}

// 主动画循环
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 检查鼠标是否长时间未移动
  const currentTime = Date.now();
  const mouseIdle = currentTime - lastMouseMoveTime > config.idleAnimationDuration;
  
  // 更新和绘制粒子 - 从后向前绘制层级（背景到前景）
  updateParticles(mouseIdle);
  
  // 绘制层级（从后向前）
  for (let layer = config.layerCount - 1; layer >= 0; layer--) {
    // 先绘制当前层的连接线
    drawLayerConnections(layer);
    // 然后绘制当前层的粒子
    drawLayerParticles(layer);
  }
  
  animationId = requestAnimationFrame(animate);
}

// 更新粒子位置和状态
function updateParticles(mouseIdle) {
  const time = Date.now() / 1000; // 当前时间，用于脉动效果
  const slowPulseTime = Date.now() % config.pulseDuration / config.pulseDuration; // 缓慢脉冲0-1循环
  const slowPulseValue = Math.sin(slowPulseTime * Math.PI * 2) * 0.5 + 0.5; // 0-1值
  
  // 计算画布底部的引力场 - 粒子会逐渐靠近底部
  const bottomGravityY = canvas.height * 0.9; // 底部引力位置
  const bottomGravityRange = canvas.height * 0.4; // 引力影响范围
  const bottomGravityStrength = 0.005; // 引力强度 - 较弱以保持自然运动
  
  particles.forEach((particle, index) => {
    // 脉动效果 - 即使在静止状态也有微妙的脉动
    const pulse = Math.sin(time * particle.pulseSpeed + particle.pulsePhase);
    const pulseAmount = 0.1 + 0.05 * (1 - particle.layerDepth); // 前景层脉动更明显
    
    // 特大粒子使用缓慢脉冲效果
    if (particle.isLargeParticle) {
      // 缓慢呼吸效果
      const breatheEffect = slowPulseValue * config.pulseIntensity; 
      // 更新大粒子尺寸，让它们缓慢呼吸
      particle.size = particle.originalSize * (1 - config.pulseIntensity/2 + breatheEffect);
      // 更新活跃度
      particle.activationLevel = 0.1 + breatheEffect * 0.5;
    }
    
    // 鼠标交互
    if (mouseMoved && !mouseIdle) {
      // 计算与鼠标的距离
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 前景层对鼠标反应更强烈
      const mouseRadiusEffect = config.mouseRadius * (1 + (1 - particle.layerDepth) * 0.3);
      
      if (distance < mouseRadiusEffect) {
        // 激活粒子
        particle.active = true;
        
        // 近距离排斥，远距离吸引
        if (distance < config.mouseRepelThreshold) {
          // 排斥力 - 越近越强，大粒子受力更小
          const force = (1 - distance / config.mouseRepelThreshold) * (1 + (1 - particle.layerDepth) * 0.5) * particle.speedFactor;
          particle.vx -= dx * force * config.mouseForce * 0.05;
          particle.vy -= dy * force * config.mouseForce * 0.05;
          
          // 增加粒子大小
          if (!particle.isLargeParticle) { // 大粒子尺寸仅由呼吸效果控制
            particle.size = particle.originalSize * (1 + force * 0.6);
          }
          particle.activationLevel = Math.min(particle.activationLevel + 0.04, 1);
        } else {
          // 吸引力 - 随距离减弱，大粒子受力更小
          const force = (mouseRadiusEffect - distance) / mouseRadiusEffect * (1 - particle.layerDepth * 0.3) * particle.speedFactor;
          particle.vx += dx * force * config.mouseForce * 0.01;
          particle.vy += dy * force * config.mouseForce * 0.01;
          
          // 轻微增加粒子大小
          if (!particle.isLargeParticle) { // 大粒子尺寸仅由呼吸效果控制
            particle.size = particle.originalSize * (1 + force * 0.3 * pulse * 0.5);
          }
          particle.activationLevel = Math.min(particle.activationLevel + 0.02, 0.7);
        }
      } else {
        // 慢慢恢复未激活状态
        particle.active = false;
        if (!particle.isLargeParticle) { // 大粒子尺寸仅由呼吸效果控制
          particle.size = particle.size * 0.95 + (particle.originalSize * (1 + pulse * pulseAmount)) * 0.05;
        }
        particle.activationLevel *= 0.95;
      }
    } else {
      // 鼠标静止或离开 - 缓慢运动模式
      particle.active = false;
      
      // 添加微小的脉动到粒子大小
      if (!particle.isLargeParticle) { // 大粒子尺寸仅由呼吸效果控制
        particle.size = particle.size * 0.95 + (particle.originalSize * (1 + pulse * pulseAmount)) * 0.05;
      }
      particle.activationLevel *= 0.95;
      
      // 降低速度但不要完全停止
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // 维持最小速度以保持画面有运动感
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      const minSpeed = config.baseSpeed * 0.3 * particle.speedFactor; // 大粒子的最小速度更小
      if (speed < minSpeed) {
        const angle = Math.random() * Math.PI * 2;
        const randomForce = 0.005 * particle.speedFactor; // 大粒子随机力更小
        particle.vx += Math.cos(angle) * randomForce * (1 - particle.layerDepth * 0.5);
        particle.vy += Math.sin(angle) * randomForce * (1 - particle.layerDepth * 0.5);
      }
    }
    
    // 如果在底部引力范围内，增加向下的引力
    if (particle.y < bottomGravityY) {
      const distanceToGravity = bottomGravityY - particle.y;
      if (distanceToGravity < bottomGravityRange) {
        // 距离底部越近，引力越强
        const gravityForce = (distanceToGravity / bottomGravityRange) * bottomGravityStrength * particle.speedFactor;
        // 靠近底部，增加向下的引力
        particle.vy += gravityForce;
      }
    }
    
    // 应用速度更新位置
    particle.x += particle.vx;
    particle.y += particle.vy;
    
    // 边界检查 - 反弹效果
    if (particle.x < 0) {
      particle.x = 0;
      particle.vx *= -0.5;
    } else if (particle.x > canvas.width) {
      particle.x = canvas.width;
      particle.vx *= -0.5;
    }
    
    if (particle.y < 0) {
      particle.y = 0;
      particle.vy *= -0.5;
    } else if (particle.y > canvas.height) {
      particle.y = canvas.height;
      particle.vy *= -0.5;
    }
    
    // 速度限制
    const maxSpeed = particle.active ? 
                    config.activeSpeed * (1 - particle.layerDepth * 0.2) * particle.speedFactor : // 前景层更快，大粒子更慢
                    config.baseSpeed * (1 - particle.layerDepth * 0.3) * particle.speedFactor;
    const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
    
    if (currentSpeed > maxSpeed) {
      particle.vx = (particle.vx / currentSpeed) * maxSpeed;
      particle.vy = (particle.vy / currentSpeed) * maxSpeed;
    }
  });
}

// 绘制特定层级的连接线
function drawLayerConnections(targetLayer) {
  ctx.lineCap = 'round';
  
  // 筛选目标层级的粒子
  const layerParticles = particles.filter(p => p.layer === targetLayer);
  
  // 根据位置调整连接线的不透明度 - 靠近底部的连接线更明显
  layerParticles.forEach((particle, i) => {
    // 获取该粒子在原始数组中的索引
    const particleIndex = particles.indexOf(particle);
    
    // 根据粒子位置计算增强系数 - 越靠近底部越明显
    const positionFactor = Math.min(1.0, particle.y / (canvas.height * 0.8)) * 0.5 + 0.5;
    
    // 只绘制每个连接一次（避免重复）
    particle.connections.forEach(connectionIndex => {
      if (connectionIndex > particleIndex) { // 确保每个连接只画一次
        const other = particles[connectionIndex];
        
        // 计算距离
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 根据距离确定不透明度
        if (distance < config.connectionDistance) {
          // 透明度随距离变化且受层级影响
          const distanceRatio = distance / config.connectionDistance;
          const layerOpacityMultiplier = 1 - particle.layerDepth * 0.3; // 前景层线更明显
          
          // 底部粒子的连接线更明显
          let opacity = (1 - distanceRatio) * config.lineOpacity * layerOpacityMultiplier * (1 + positionFactor * 0.5);
          
          // 不同层间的线透明度降低
          if (other.layer !== particle.layer) {
            opacity *= 0.5;
          }
          
          // 确定线的颜色 - 如果任一端是红色，则连线也为红色
          const isRedParticle = 
            (particle.color.r > 200 && particle.color.g < 50 && particle.color.b < 50);
          const isRedOther = 
            (other.color.r > 200 && other.color.g < 50 && other.color.b < 50);
          const isRedConnection = isRedParticle || isRedOther;
          
          // 两端都激活时，线更亮
          const brightnessBoost = (particle.activationLevel + other.activationLevel) * 0.5;
          
          // 设置线的样式
          if (isRedConnection) {
            ctx.strokeStyle = `rgba(255, ${20 + Math.floor(brightnessBoost * 30)}, ${10 + Math.floor(brightnessBoost * 20)}, ${opacity * (1 + brightnessBoost)})`;
          } else {
            const baseGray = 80 + Math.floor(brightnessBoost * 100);
            ctx.strokeStyle = `rgba(${baseGray}, ${baseGray}, ${baseGray}, ${opacity * (1 + brightnessBoost)})`;
          }
          
          // 设置线宽 - 激活的粒子连线更粗且考虑羽化程度
          const lineWidthMultiplier = 1 - (particle.feathering * 0.3); // 羽化程度影响线宽
          ctx.lineWidth = (config.minLineWidth + brightnessBoost * (config.maxLineWidth - config.minLineWidth)) * lineWidthMultiplier;
          
          // 绘制线
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });
  });
}

// 绘制特定层级的粒子
function drawLayerParticles(targetLayer) {
  // 筛选目标层级的粒子
  const layerParticles = particles.filter(p => p.layer === targetLayer);
  
  layerParticles.forEach(particle => {
    // 绘制主体圆点
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    
    // 特大粒子有不同的渲染方式
    if (particle.isLargeParticle) {
      // 红色粒子使用更强的红色
      if (particle.color.r > 150) {
        // 红色大粒子 - 使用更亮的红色和较低的不透明度
        ctx.fillStyle = `rgba(255, ${30 + Math.floor(particle.activationLevel * 50)}, ${20 + Math.floor(particle.activationLevel * 30)}, ${0.2 + particle.activationLevel * 0.3})`;
      } else {
        // 灰色大粒子 - 使用淡灰色和较低的不透明度
        const baseGray = 120 + Math.floor(particle.activationLevel * 80);
        ctx.fillStyle = `rgba(${baseGray}, ${baseGray}, ${baseGray}, ${0.15 + particle.activationLevel * 0.25})`;
      }
    } else {
      // 普通粒子的常规渲染
      // 激活状态时颜色更亮
      if (particle.color.r > 150 && particle.color.g < 50) {
        // 红色粒子
        const brightness = 30 + Math.floor(particle.activationLevel * 225);
        ctx.fillStyle = `rgba(255, ${brightness * 0.3}, ${brightness * 0.2}, ${particle.color.a * particle.feathering + particle.activationLevel * 0.2})`;
      } else {
        // 灰色粒子
        const baseGray = particle.color.r;
        const brightness = baseGray + Math.floor(particle.activationLevel * (255 - baseGray));
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${particle.color.a * particle.feathering + particle.activationLevel * 0.2})`;
      }
    }
    
    ctx.fill();
    
    // 为所有粒子添加羽化效果，激活粒子效果更强
    // 特大粒子有更强的光晕
    let glowIntensity;
    let glowSizeMultiplier;
    
    if (particle.isLargeParticle) {
      // 特大粒子有更大更强的光晕
      glowIntensity = (0.4 + particle.activationLevel * 0.6) * particle.feathering;
      glowSizeMultiplier = config.glowSizeMultiplier * 2.0; // 更大的光晕
    } else {
      // 普通粒子的标准光晕
      glowIntensity = (0.1 + particle.activationLevel * config.glowIntensity) * particle.feathering;
      glowSizeMultiplier = config.glowSizeMultiplier;
    }
    
    if (glowIntensity > 0.05) {
      const glowSize = particle.size * (glowSizeMultiplier - particle.layerDepth * 0.7); // 前景层光晕更大
      
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, particle.size * 0.5,
        particle.x, particle.y, glowSize
      );
      
      if (particle.isLargeParticle && particle.color.r > 150) {
        // 红色大粒子的光晕 - 更柔和的红色，多层次效果
        gradient.addColorStop(0, `rgba(255, 60, 50, ${0.7 * glowIntensity})`);
        gradient.addColorStop(0.3, `rgba(255, 50, 40, ${0.5 * glowIntensity})`);
        gradient.addColorStop(0.6, `rgba(255, 30, 20, ${0.3 * glowIntensity})`);
        gradient.addColorStop(0.8, `rgba(255, 20, 10, ${0.1 * glowIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      } else if (particle.isLargeParticle) {
        // 灰色大粒子的光晕，多层次效果
        const glowGray = Math.min(255, particle.color.r + 120);
        gradient.addColorStop(0, `rgba(${glowGray}, ${glowGray}, ${glowGray}, ${0.6 * glowIntensity})`);
        gradient.addColorStop(0.4, `rgba(${glowGray}, ${glowGray}, ${glowGray}, ${0.4 * glowIntensity})`);
        gradient.addColorStop(0.7, `rgba(${glowGray}, ${glowGray}, ${glowGray}, ${0.2 * glowIntensity})`);
        gradient.addColorStop(1, `rgba(${glowGray}, ${glowGray}, ${glowGray}, 0)`);
      } else if (particle.color.r > 150 && particle.color.g < 50) {
        // 普通红色粒子的光晕
        gradient.addColorStop(0, `rgba(255, 40, 30, ${0.4 * glowIntensity})`);
        gradient.addColorStop(1, 'rgba(255, 30, 20, 0)');
      } else {
        // 普通灰色粒子的光晕
        const glowGray = Math.min(255, particle.color.r + 100);
        gradient.addColorStop(0, `rgba(${glowGray}, ${glowGray}, ${glowGray}, ${0.35 * glowIntensity})`);
        gradient.addColorStop(1, `rgba(${glowGray}, ${glowGray}, ${glowGray}, 0)`);
      }
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 为大粒子添加额外的外发光
      if (particle.isLargeParticle) {
        const outerGlowSize = glowSize * 2.2; // 更大的外部光晕
        const outerGradient = ctx.createRadialGradient(
          particle.x, particle.y, glowSize * 0.6,
          particle.x, particle.y, outerGlowSize
        );
        
        if (particle.color.r > 150) {
          // 红色粒子的外发光 - 多层次
          outerGradient.addColorStop(0, `rgba(255, 30, 20, ${0.3 * particle.activationLevel})`);
          outerGradient.addColorStop(0.5, `rgba(255, 10, 5, ${0.15 * particle.activationLevel})`);
          outerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        } else {
          // 灰色粒子的外发光 - 多层次
          outerGradient.addColorStop(0, `rgba(200, 200, 200, ${0.2 * particle.activationLevel})`);
          outerGradient.addColorStop(0.6, `rgba(180, 180, 180, ${0.1 * particle.activationLevel})`);
          outerGradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, outerGlowSize, 0, Math.PI * 2);
        ctx.fillStyle = outerGradient;
        ctx.fill();
      }
    }
  });
}

// 鼠标事件处理
function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  
  mouseMoved = true;
  lastMouseMoveTime = Date.now();
}

function handleMouseLeave() {
  mouseX = -100;
  mouseY = -100;
  mouseMoved = false;
}

// 粒子动画系统
document.addEventListener('DOMContentLoaded', function() {
  // 强制刷新随机数生成器
  const randomSeed = Date.now() + Math.floor(Math.random() * 10000);
  Math.random = (function() {
    let seed = randomSeed;
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })();

  // 初始化粒子系统
  initParticleSystem();
});

function initParticleSystem() {
  // 检查是否已经初始化，避免多次执行
  if (window.particlesInitialized) {
    return;
  }
  window.particlesInitialized = true;

  // 原有的粒子系统代码
  // ... 保留原始粒子代码 ...
  resizeCanvas();
  
  // 事件监听
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', resizeCanvas);
  
  // 启动动画
  animate();
}

// 页面加载完成后初始化
window.addEventListener('load', initParticleSystem); 