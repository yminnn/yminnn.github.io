document.addEventListener('DOMContentLoaded', function() {
  console.log("Custom cursor script loaded"); // 调试信息
  
  // 移除任何现有的光标
  const existingCursors = document.querySelectorAll('.custom-cursor');
  existingCursors.forEach(cursor => cursor.remove());
  
  // 创建新的光标元素
  const cursor = document.createElement('div');
  cursor.classList.add('custom-cursor');
  cursor.style.transform = 'translate(50%, 50%)';
  
  // 创建内部光标点
  const cursorDot = document.createElement('div');
  cursorDot.classList.add('cursor-dot');
  
  // 添加到DOM
  cursor.appendChild(cursorDot);
  document.body.appendChild(cursor);
  
  console.log("Cursor element added to DOM"); // 调试信息
  
  // 创建音效函数
  let audioContext;
  let isFirstSound = true; // 标记是否是第一次播放声音
  
  // 标记是否在粒子容器内
  let isOverParticles = false;
  
  // 当前活跃的声音数组，最多允许三个声音同时存在
  const activeSounds = [];
  
  // 声音开关状态变量
  let soundEnabled = true;
  
  // 初始化时从本地存储获取声音设置
  if (localStorage.getItem('soundMuted') === 'true') {
    soundEnabled = false;
  }
  
  // 监听音量控制按钮点击事件
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) {
    // 根据当前状态设置初始类
    if (!soundEnabled) {
      soundToggle.classList.add('muted');
    }
    
    // 添加点击事件来切换声音状态
    soundToggle.addEventListener('click', function() {
      soundEnabled = !soundEnabled;
      localStorage.setItem('soundMuted', (!soundEnabled).toString());
      
      if (soundEnabled) {
        soundToggle.classList.remove('muted');
        // 可以播放一个非常短的声音表示开启
        if (audioContext) {
          const duration = 0.3;
          const volume = 0.1;
          createEtherealSound(0, 0, duration, volume, 0.001);
        }
      } else {
        soundToggle.classList.add('muted');
        // 如果有正在播放的声音，快速淡出它们
        activeSounds.forEach(sound => {
          sound.fadeOut(0.2);
        });
      }
    });
  }
  
  // 创建一个共享的音频上下文
  function getAudioContext() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 预热音频上下文 - 创建并立即释放一个静音的音频节点
        // 这可以解决第一个声音过大的问题
        const silentOsc = audioContext.createOscillator();
        const silentGain = audioContext.createGain();
        silentGain.gain.setValueAtTime(0, audioContext.currentTime); // 完全静音
        silentOsc.connect(silentGain);
        silentGain.connect(audioContext.destination);
        silentOsc.start();
        silentOsc.stop(audioContext.currentTime + 0.001);
        
        console.log("初始化音频上下文");
      } catch (e) {
        console.error("无法创建音频上下文:", e);
        return null;
      }
    }
    return audioContext;
  }
  
  // 空灵音效公共函数
  function createEtherealSound(baseFreq, targetFreq, duration, volumeStart, volumeEnd) {
    // 如果声音被禁用，直接返回
    if (!soundEnabled) return;
    
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
      // 如果是第一次播放声音，音量降低90%，避免初次交互的爆音
      if (isFirstSound) {
        volumeStart = volumeStart * 0.1; // 第一个声音只有10%的音量
        console.log("首次播放声音，音量降低");
        isFirstSound = false;
        
        // 创建静音音符确保后续声音正常
        setTimeout(() => {
          const ctx = getAudioContext();
          if (ctx) {
            const silentOsc = ctx.createOscillator();
            const silentGain = ctx.createGain();
            silentGain.gain.setValueAtTime(0, ctx.currentTime);
            silentOsc.connect(silentGain);
            silentGain.connect(ctx.destination);
            silentOsc.start();
            silentOsc.stop(ctx.currentTime + 0.001);
          }
        }, 100);
      }
      
      // 创建声音对象以跟踪和控制
      const soundObject = {
        gainNodes: [],
        fadeOut: function(fadeTime) {
          // 快速淡出所有增益节点
          this.gainNodes.forEach(gain => {
            const currentValue = gain.gain.value;
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.setValueAtTime(currentValue, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + fadeTime);
          });
        }
      };
      
      // 当新声音加入时，处理已有声音队列
      if (activeSounds.length >= 3) {
        // 队列已满，移除最早的声音并加速其淡出
        const oldestSound = activeSounds.shift();
        oldestSound.fadeOut(0.6); // 从0.2秒增加到0.6秒，让淡出更平滑
      }
      
      // 将新声音添加到队列
      activeSounds.push(soundObject);
      
      // 获取下一个按音阶顺序选择的风铃音符
      const { noteIndex, selectedNote, isHighOctave } = getNextChimeNote();
      
      // 高八度音符使用更轻的音量和更自然的渐隐
      if (isHighOctave) {
        volumeStart = volumeStart * 0.45; // 高八度音符音量略提高到45%，更协调
        duration = duration * 0.8; // 缩短20%持续时间，让高音更快消失
      }
      
      // 记录风铃音符
      if (Array.isArray(selectedNote)) {
        console.log("播放Winter Chimes和弦");
      } else {
        const noteNames = [
          "D4", "F4", "A4", "B4", "C5", "E5", "A#4", "C5",
          "D3", "F3", "A3", "B3", "C4", "E4", "A#3", "C4",
          "D5", "F5", "A5", "B5", "C6", "E6", "A#5", "C6"
        ];
        console.log(`播放Winter Chimes音符: ${noteNames[noteIndex]}${isHighOctave ? " (空灵高音)" : ""}`);
      }
      
      // 风铃特有的金属音色合成
      let oscillators = [];
      let gainNodes = [];
      
      // 风铃音色特点：金属管状，泛音丰富，持续时间长，带有颤动
      if (Array.isArray(selectedNote)) {
        // 和弦处理 - 风铃特有的金属质感
        selectedNote.forEach((freq, i) => {
          // 创建主音振荡器 - 风铃的金属音色是正弦波与三角波的混合
          const oscMain = ctx.createOscillator();
          oscMain.type = 'sine';
          oscMain.frequency.setValueAtTime(freq, ctx.currentTime);
          
          // 风铃金属泛音 (轻微错位的高频泛音)
          const oscHarmonic = ctx.createOscillator();
          oscHarmonic.type = 'triangle';
          // 风铃特有的不完美泛音比，增加金属感
          const harmonicRatio = 3.5 + Math.random() * 0.2; 
          oscHarmonic.frequency.setValueAtTime(freq * harmonicRatio, ctx.currentTime);
          
          // 主音增益
          const gainMain = ctx.createGain();
          gainMain.gain.setValueAtTime(0, ctx.currentTime);
          
          // 风铃特有的快速起音，缓慢衰减
          gainMain.gain.linearRampToValueAtTime(volumeStart * 0.0005, ctx.currentTime + 0.001);
          gainMain.gain.linearRampToValueAtTime(volumeStart * 0.005, ctx.currentTime + 0.002);
          
          // 风铃音量平衡 - 根据位置微调
          const noteVol = 0.06 + (i * 0.01);
          gainMain.gain.linearRampToValueAtTime(volumeStart * noteVol, ctx.currentTime + 0.05);
          
          // 风铃特有的长余音
          gainMain.gain.setTargetAtTime(0.0001, ctx.currentTime + 0.2, duration * 1.0);
          
          // 泛音增益
          const gainHarmonic = ctx.createGain();
          gainHarmonic.gain.setValueAtTime(0, ctx.currentTime);
          // 风铃特有的快速起音，快速衰减
          gainHarmonic.gain.linearRampToValueAtTime(volumeStart * 0.03, ctx.currentTime + 0.01);
          gainHarmonic.gain.setTargetAtTime(0.0001, ctx.currentTime + 0.1, duration * 0.4);
          
          // 添加风铃特有的颤动效果
          const vibrato = ctx.createOscillator();
          vibrato.type = 'sine';
          // 风铃颤动速率 - 较快
          vibrato.frequency.setValueAtTime(8 + Math.random() * 4, ctx.currentTime);
          
          const vibratoGain = ctx.createGain();
          // 轻微颤动 - 风铃特点
          vibratoGain.gain.setValueAtTime(2 + Math.random() * 1, ctx.currentTime);
          
          vibrato.connect(vibratoGain);
          vibratoGain.connect(oscMain.frequency);
          
          oscillators.push(oscMain, oscHarmonic, vibrato);
          gainNodes.push(gainMain, gainHarmonic);
          
          // 连接
          oscMain.connect(gainMain);
          oscHarmonic.connect(gainHarmonic);
        });
      } else {
        // 单音符 - Winter Chimes特有的金属质感
        
        // 1. 主音色层 - 风铃的主体声音
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(selectedNote, ctx.currentTime);
        
        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        // 风铃特有的快速起音，但更柔和
        gain1.gain.linearRampToValueAtTime(volumeStart * 0.0005, ctx.currentTime + 0.002);
        gain1.gain.linearRampToValueAtTime(volumeStart * 0.005, ctx.currentTime + 0.004);
        gain1.gain.linearRampToValueAtTime(volumeStart * 0.05, ctx.currentTime + 0.015);
        // 风铃持续音
        gain1.gain.linearRampToValueAtTime(volumeStart * 0.08, ctx.currentTime + 0.07);
        // 风铃特有的更长余音，多阶段更自然的渐隐
        if (isHighOctave) {
          // 高音使用更快的渐隐效果
          gain1.gain.linearRampToValueAtTime(volumeStart * 0.06, ctx.currentTime + 0.2);
          gain1.gain.linearRampToValueAtTime(volumeStart * 0.01, ctx.currentTime + 0.6);
          gain1.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
        } else {
          // 普通音符使用多阶段渐隐，比之前更平滑
          gain1.gain.linearRampToValueAtTime(volumeStart * 0.06, ctx.currentTime + 0.5);
          gain1.gain.linearRampToValueAtTime(volumeStart * 0.03, ctx.currentTime + 1.0);
          gain1.gain.linearRampToValueAtTime(volumeStart * 0.01, ctx.currentTime + 1.7);
          gain1.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration * 1.4);
        }
        
        // 2. 金属泛音层 - 风铃特有的高频泛音
        const osc2 = ctx.createOscillator();
        osc2.type = isHighOctave ? 'triangle' : 'sine'; // 高音使用三角波增加金属感
        // 风铃特有的不完美泛音比，增加金属感
        const harmonicRatio = 3.8 + Math.random() * 0.4;
        osc2.frequency.setValueAtTime(selectedNote * harmonicRatio, ctx.currentTime);
        
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        // 风铃泛音特点：快速起音，但更轻柔
        gain2.gain.linearRampToValueAtTime(volumeStart * 0.02, ctx.currentTime + 0.02);
        // 高音的泛音衰减更为自然，使用多阶段渐隐
        if (isHighOctave) {
          gain2.gain.linearRampToValueAtTime(volumeStart * 0.01, ctx.currentTime + 0.2);
          gain2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration * 0.6);
        } else {
          gain2.gain.linearRampToValueAtTime(volumeStart * 0.015, ctx.currentTime + 0.3);
          gain2.gain.linearRampToValueAtTime(volumeStart * 0.005, ctx.currentTime + 0.8);
          gain2.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration * 0.9);
        }
        
        // 3. 低频基音层 - 增加风铃厚度
        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(selectedNote * 0.5, ctx.currentTime);
        
        const gain3 = ctx.createGain();
        gain3.gain.setValueAtTime(0, ctx.currentTime);
        // 低频稍微增强，增加厚度 - 更平滑的渐隐
        if (isHighOctave) {
          gain3.gain.linearRampToValueAtTime(volumeStart * 0.015, ctx.currentTime + 0.08);
          gain3.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration * 0.5);
        } else {
          gain3.gain.linearRampToValueAtTime(volumeStart * 0.025, ctx.currentTime + 0.08);
          gain3.gain.linearRampToValueAtTime(volumeStart * 0.015, ctx.currentTime + 0.5);
          gain3.gain.linearRampToValueAtTime(volumeStart * 0.005, ctx.currentTime + 1.0);
          gain3.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration * 1.2);
        }
        
        // 4. 风铃特有的金属打击层，更轻微
        const osc4 = ctx.createOscillator();
        osc4.type = 'triangle';
        osc4.frequency.setValueAtTime(selectedNote * 2, ctx.currentTime);
        
        const gain4 = ctx.createGain();
        gain4.gain.setValueAtTime(0, ctx.currentTime);
        // 非常轻微的打击感，高音时调整为更自然
        if (isHighOctave) {
          gain4.gain.linearRampToValueAtTime(volumeStart * 0.015, ctx.currentTime + 0.004);
          gain4.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
        } else {
          gain4.gain.linearRampToValueAtTime(volumeStart * 0.02, ctx.currentTime + 0.004);
          gain4.gain.linearRampToValueAtTime(volumeStart * 0.008, ctx.currentTime + 0.08);
          gain4.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
        }
        
        // 添加更明显的颤动效果
        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        // 高音颤动调整为更自然
        if (isHighOctave) {
          vibrato.frequency.setValueAtTime(4.5 + Math.random() * 2.0, ctx.currentTime);
        } else {
          vibrato.frequency.setValueAtTime(4.5 + Math.random() * 2.5, ctx.currentTime);
        }
        
        const vibratoGain = ctx.createGain();
        // 增强颤动感，高音颤动降低到更自然的水平
        if (isHighOctave) {
          vibratoGain.gain.setValueAtTime(2.5 + Math.random() * 1.0, ctx.currentTime);
        } else {
          vibratoGain.gain.setValueAtTime(3 + Math.random() * 1.5, ctx.currentTime);
        }
        
        // 添加第二个颤动层，创造更复杂的颤动效果
        const vibrato2 = ctx.createOscillator();
        vibrato2.type = 'sine';
        // 更慢的次级颤动
        vibrato2.frequency.setValueAtTime(1.5 + Math.random() * 1, ctx.currentTime);
        
        const vibratoGain2 = ctx.createGain();
        vibratoGain2.gain.setValueAtTime(1.5 + Math.random() * 0.8, ctx.currentTime);
        
        // 连接双层颤动
        vibrato.connect(vibratoGain);
        vibrato2.connect(vibratoGain2);
        vibratoGain.connect(osc1.frequency);
        vibratoGain2.connect(osc1.frequency);
        
        oscillators = [osc1, osc2, osc3, osc4, vibrato, vibrato2];
        gainNodes = [gain1, gain2, gain3, gain4];
        
        // 连接
        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);
        osc4.connect(gain4);
      }
      
      // 将所有增益节点添加到声音对象中以便控制
      soundObject.gainNodes = gainNodes;
      
      // 创建风铃特有的明亮混响效果
      const convolver = ctx.createConvolver();
      
      // 风铃混响特点：明亮、清脆、悠长
      const rate = ctx.sampleRate;
      const length = Math.floor(rate * 4.5); // 风铃混响延长至4.5秒
      const impulse = ctx.createBuffer(2, length, rate);
      
      for (let channel = 0; channel < 2; channel++) {
        const impulseData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const t = i / rate;
          
          // 风铃特有的混响包络 - 更加平滑的衰减
          // 缓慢起音，更长的衰减
          let envelope;
          if (t < 0.004) {
            // 更缓的起音
            envelope = t / 0.004;
          } else if (t < 0.1) {
            // 更长的峰值保持
            envelope = 1.0;
          } else {
            // 更平缓的长衰减，改用三次方根函数使尾部衰减更加缓慢
            envelope = Math.pow(1 - ((t - 0.1) / 4.4), 0.33); // 三次方根衰减，更加平缓
          }
          
          // 风铃特有的高频调制，创造金属感，但更柔和
          const metallicMod = 0.03 * Math.sin(2 * Math.PI * t * 25) * 
                              Math.cos(2 * Math.PI * t * 15);
          
          // 风铃特有的随机成分，模拟金属不规则振动
          const randomAmount = 0.04 * Math.exp(-t * 0.8);
          const randomComponent = (Math.random() * 2 - 1) * randomAmount;
          
          // 混合所有成分
          impulseData[i] = (randomComponent + metallicMod) * envelope * 0.65;
        }
      }
      
      convolver.buffer = impulse;
      
      // 风铃特有的明亮混响比例
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.85;
      
      // 适当的直接信号
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.75;
      
      // 风铃特有的随机左右摆动
      const stereoEnhancer = ctx.createStereoPanner();
      stereoEnhancer.pan.value = (Math.random() * 1.6) - 0.8;
      
      // 连接节点
      gainNodes.forEach(gain => {
        gain.connect(dryGain);
      });
      
      // 立体声处理
      dryGain.connect(stereoEnhancer);
      
      // 直接输出
      stereoEnhancer.connect(ctx.destination);
      
      // 混响处理 - 纪念碑谷特有的长混响
      stereoEnhancer.connect(convolver);
      convolver.connect(wetGain);
      wetGain.connect(ctx.destination);
      
      // 启动振荡器
      oscillators.forEach(osc => osc.start());
      
      // 停止时间 - 高音音符需要更短的时间
      const stopTime = isHighOctave 
        ? ctx.currentTime + duration * 1.2 // 高音只需要1.2倍时长
        : ctx.currentTime + duration * 2.0; // 其他音符降至2.0倍时长
      
      oscillators.forEach(osc => osc.stop(stopTime));
      
      // 声音完全结束时从活跃列表中移除
      setTimeout(() => {
        const index = activeSounds.indexOf(soundObject);
        if (index !== -1) {
          activeSounds.splice(index, 1);
        }
      }, (isHighOctave ? duration * 1.2 : duration * 2.0) * 1000);
      
    } catch (e) {
      console.error("无法播放卡林巴音效:", e);
    }
  }
  
  function playParticleSound() {
    // 只有在粒子容器内才播放声音
    if (!isOverParticles) return;
    
    // 音符持续时间 - 卡林巴琴音符通常较短
    const duration = 0.6 + Math.random() * 0.4; // 0.6-1.0秒
    
    // 增加音量到0.2
    createEtherealSound(0, 0, duration, 0.2, 0.001); // 传入的频率会被忽略，使用音阶
  }
  
  // 设置初始位置在视窗中心
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let targetX = cursorX;
  let targetY = cursorY;
  
  // 添加鼠标速度检测
  let lastMouseX = cursorX;
  let lastMouseY = cursorY;
  let lastMouseTime = Date.now();
  let mouseSpeed = 0;
  let maxSpeed = 0;
  
  // 速度平滑
  let smoothedSpeed = 0;
  const speedSmoothFactor = 0.3; // 速度平滑系数
  
  // 保存上次播放的音符索引，确保按照音阶顺序播放
  let lastNoteIndex = -1;
  
  // 上次触发风铃声音的时间，用于控制触发频率
  let lastChimeTime = 0;
  
  // 速度记录功能，用于计算合理的最大速度范围
  function updateMouseSpeed(x, y) {
    const currentTime = Date.now();
    const dt = (currentTime - lastMouseTime) / 1000; // 转换为秒
    if (dt > 0) {
      // 计算鼠标移动距离
      const dx = x - lastMouseX;
      const dy = y - lastMouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 计算瞬时速度 (像素/秒)
      const instantSpeed = distance / dt;
      
      // 平滑速度变化，避免突变
      mouseSpeed = instantSpeed;
      smoothedSpeed = smoothedSpeed * (1 - speedSmoothFactor) + mouseSpeed * speedSmoothFactor;
      
      // 记录历史最大速度，用于归一化
      if (smoothedSpeed > maxSpeed && currentTime - lastMouseTime < 100) { // 忽略长时间停顿后的突然移动
        maxSpeed = Math.min(smoothedSpeed, 2000); // 设定合理上限，避免异常值
      }
      
      // 更新上一次的位置和时间
      lastMouseX = x;
      lastMouseY = y;
      lastMouseTime = currentTime;
    }
  }
  
  // 根据鼠标速度计算音量和触发几率
  function getSpeedBasedParameters() {
    // 确保maxSpeed不为0，避免除以0错误
    const effectiveMaxSpeed = Math.max(maxSpeed, 500);
    
    // 归一化速度值到0-1范围
    const normalizedSpeed = Math.min(smoothedSpeed / effectiveMaxSpeed, 1);
    
    // 速度到音量的非线性映射，让快速移动时音量增长更明显
    const volumeFactor = Math.pow(normalizedSpeed, 1.5) * 0.8 + 0.2;
    
    // 速度到触发概率的映射，快速移动时更容易触发，但整体降低触发率
    const triggerChance = normalizedSpeed * 0.04 + 0.003; // 范围从0.003到0.043，降低触发频率
    
    return {
      volumeFactor,
      triggerChance
    };
  }
  
  // 获取音符 - 风铃音效风格模拟，按Wind Chimes音阶顺序播放
  function getNextChimeNote() {
    // Zaphir Blue Moon - Winter Chimes风铃音符
    // 音符: D - F - A - B - C - E - A# - C
    const winterChimesScale = [
      // 基础音符，按照风铃提供的音符顺序，整体音高提高1.2倍
      293.66 * 1.2, // D4
      349.23 * 1.2, // F4
      440.00 * 1.2, // A4
      493.88 * 1.2, // B4
      523.25 * 1.2, // C5
      659.26 * 1.2, // E5
      466.16 * 1.2, // A#4/Bb4
      523.25 * 1.2, // C5(重复)
      
      // 添加低八度版本，增加深度，同样提高音高 - 只保留这些低音
      146.83 * 1.2, // D3
      174.61 * 1.2, // F3
      220.00 * 1.2, // A3
      246.94 * 1.2, // B3
      261.63 * 1.2, // C4
      329.63 * 1.2, // E4
      233.08 * 1.2, // A#3/Bb3
      261.63 * 1.2,  // C4
      
      // 添加高八度音符作为空灵点缀
      587.33 * 1.2, // D5
      698.46 * 1.2, // F5
      880.00 * 1.2, // A5
      987.77 * 1.2, // B5
      1046.50 * 1.2, // C6
      1318.51 * 1.2, // E6
      932.33 * 1.2, // A#5/Bb5
      1046.50 * 1.2  // C6
    ];
    
    // 风铃和弦 - 冬季和谐的组合，同样提高音高
    const winterChords = [
      [293.66 * 1.2, 440.00 * 1.2, 523.25 * 1.2], // D-A-C 和弦
      [349.23 * 1.2, 440.00 * 1.2, 523.25 * 1.2], // F-A-C 和弦 (F大三和弦)
      [440.00 * 1.2, 523.25 * 1.2, 659.26 * 1.2], // A-C-E 和弦 (A小三和弦)
      [293.66 * 1.2, 349.23 * 1.2, 440.00 * 1.2], // D-F-A 和弦 (D小三和弦)
      [349.23 * 1.2, 466.16 * 1.2, 587.33 * 1.2]  // F-Bb-D 和弦 (Bb大三和弦)
    ];
    
    // 将和弦添加到音阶中
    const fullScale = [...winterChimesScale];
    winterChords.forEach(chord => {
      fullScale.push(chord);
    });
    
    // 是否使用和弦 - 降低和弦概率，风铃很少同时响多个音
    const useChord = Math.random() < 0.15; // 只有15%概率使用和弦
    
    let noteIndex;
    let selectedNote;
    
    if (useChord) {
      // 选择风铃和弦 (位于数组末尾)
      noteIndex = Math.floor(Math.random() * winterChords.length);
      selectedNote = winterChords[noteIndex];
    } else {
      // 按顺序选择单音符，确保风铃音阶的完整性
      if (lastNoteIndex === -1 || lastNoteIndex >= 7) {
        // 从头开始，或者随机一个起点
        lastNoteIndex = Math.floor(Math.random() * 8);
      } else {
        // 按顺序移动到下一个音符
        lastNoteIndex = (lastNoteIndex + 1) % 8;
      }
      
      // 随机选择音域
      let octaveShift = 0;
      const octaveRandom = Math.random();
      
      if (octaveRandom < 0.8) {
        // 80%几率使用基本音域 (D4, F4, A4, B4, C5, E5, A#4, C5)
        octaveShift = 0;
      } else if (octaveRandom < 0.95) {
        // 15%几率使用低八度，为风铃添加低音元素
        octaveShift = 8;
      } else {
        // 5%几率使用高八度，作为空灵点缀，降低高音出现概率
        octaveShift = 16;
      }
      
      // 使用音域偏移选择音符
      noteIndex = lastNoteIndex + octaveShift;
      selectedNote = winterChimesScale[noteIndex];
    }
    
    // 额外处理高八度音符，让它们更轻盈、空灵
    const isHighOctave = noteIndex >= 16 && noteIndex < 24;
    
    return { noteIndex, selectedNote, isHighOctave };
  }
  
  // 立即更新位置以确保可见
  updateCursorPosition(cursorX, cursorY);
  
  // 设置光标可见
  setTimeout(() => {
    cursor.style.opacity = "1";
    console.log("Cursor set to visible"); // 调试信息
  }, 100);
  
  // 鼠标移动事件
  document.addEventListener('mousemove', function(e) {
    targetX = e.clientX;
    targetY = e.clientY;
    
    // 更新鼠标速度
    updateMouseSpeed(e.clientX, e.clientY);
    
    // 如果声音被禁用，不处理声音逻辑
    if (!soundEnabled) return;
    
    // 获取基于速度的参数
    const { volumeFactor, triggerChance } = getSpeedBasedParameters();
    
    // 控制触发频率，确保风铃声音足够稀疏
    const currentTime = Date.now();
    const minTimeBetweenChimes = 180 - (volumeFactor * 80); // 100-180ms间隔，速度越快间隔越短
    
    // 随机触发风铃音效 - 触发概率与速度相关，且确保足够稀疏
    if (isOverParticles && 
        Math.random() < triggerChance && 
        currentTime - lastChimeTime > minTimeBetweenChimes) {
      
      lastChimeTime = currentTime;
      
      // 音符持续时间 - 快速移动时略短
      const speedBasedDuration = 0.8 - (volumeFactor * 0.3);
      const duration = Math.max(0.5, speedBasedDuration);
      
      // 音量与速度相关 - 快速移动时音量更大
      const baseVolume = 0.2;
      const speedAdjustedVolume = baseVolume * volumeFactor;
      
      // 播放风铃声音，音量受鼠标速度影响
      createEtherealSound(0, 0, duration, speedAdjustedVolume, 0.001);
    }
  });
  
  // 鼠标点击效果
  document.addEventListener('mousedown', function() {
    cursor.classList.add('clicked');
    // 只有在粒子容器内且声音开启时才播放声音
    if (isOverParticles && soundEnabled) {
      // 获取基于速度的音量参数
      const { volumeFactor } = getSpeedBasedParameters();
      
      // 粒子容器内点击音效 - 音量也受鼠标速度影响，但整体降低为更轻的点击
      const clickVolume = 0.15 * (volumeFactor * 0.5 + 0.5); // 降低点击音量
      createEtherealSound(0, 0, 1.0, clickVolume, 0.001); // 延长点击音效持续时间
    }
  });
  
  document.addEventListener('mouseup', function() {
    cursor.classList.remove('clicked');
  });
  
  // 检测粒子容器
  const particlesContainer = document.querySelector('.particles-container');
  if (particlesContainer) {
    // 进入粒子容器
    particlesContainer.addEventListener('mouseenter', function() {
      isOverParticles = true;
      console.log("进入粒子容器");
      // 进入粒子容器区域时播放特殊音效
      if (soundEnabled) {
        createEtherealSound(0, 0, 0.7, 0.12, 0.001);
      }
    });
    
    // 离开粒子容器
    particlesContainer.addEventListener('mouseleave', function() {
      isOverParticles = false;
      console.log("离开粒子容器");
      // 离开粒子容器区域时播放特殊音效
      if (soundEnabled) {
        createEtherealSound(0, 0, 0.5, 0.08, 0.001);
      }
    });
    
    // 在粒子容器内移动 - 随机触发
    particlesContainer.addEventListener('mousemove', function() {
      // 已在mousemove事件中处理
    });
  } else {
    console.warn("找不到粒子容器元素(.particles-container)");
  }
  
  // 处理可点击元素
  const clickables = document.querySelectorAll('a, button, input, .project-card, .social-link');
  
  clickables.forEach(element => {
    element.addEventListener('mouseenter', function() {
      cursor.classList.add('hovering');
    });
    
    element.addEventListener('mouseleave', function() {
      cursor.classList.remove('hovering');
    });
  });
  
  // 更新光标位置
  function updateCursorPosition(x, y) {
    cursor.style.transform = `translate(${x}px, ${y}px)`;
  }
  
  // 呼吸效果相关变量
  let breathPhase = 0;
  const breathSpeed = 0.035; // 增加呼吸速度
  const minScale = 0.85; // 降低最小缩放值
  const maxScale = 1.25; // 增加最大缩放值
  
  // 应用呼吸效果
  function applyBreathingEffect() {
    breathPhase += breathSpeed;
    
    // 使用三角函数实现更自然的呼吸效果
    const breathValue = Math.sin(breathPhase) * 0.5 + 0.5;
    
    // 添加非线性缓动，让呼吸更自然
    const easedBreath = breathValue * breathValue * (3 - 2 * breathValue);
    const scale = minScale + easedBreath * (maxScale - minScale);
    
    cursorDot.style.transform = `translate(-50%, -50%) scale(${scale})`;
    
    // 减小模糊效果变化范围
    const blurAmount = 1.0 + breathValue * 0.8; // 1.0-1.8px范围
    cursorDot.style.filter = `blur(${blurAmount}px)`;
  }
  
  // 动画循环
  function animateCursor() {
    const dx = targetX - cursorX;
    const dy = targetY - cursorY;
    
    // 计算距离，调整跟随速度
    const distance = Math.sqrt(dx * dx + dy * dy);
    const followSpeed = Math.min(0.12 + distance / 2500, 0.25); // 稍微降低跟随速度
    
    cursorX += dx * followSpeed;
    cursorY += dy * followSpeed;
    
    updateCursorPosition(cursorX, cursorY);
    applyBreathingEffect();
    
    requestAnimationFrame(animateCursor);
  }
  
  // 启动动画
  animateCursor();
  
  // 强制隐藏原始光标
  document.body.style.cursor = 'none';
  
  // 防止在离开窗口时光标消失
  window.addEventListener('mouseout', function(e) {
    if (e.relatedTarget === null) {
      // 鼠标离开窗口，保持光标在最后位置
      cursor.style.opacity = '0.5';
    }
  });
  
  window.addEventListener('mouseover', function() {
    cursor.style.opacity = '1';
  });
  
  console.log("Custom cursor initialization complete"); // 调试信息
}); 