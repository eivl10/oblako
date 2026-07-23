import { words as tagsWithWeights } from './words.js';

const ul = document.querySelector('#tags ul');

// Перемешиваем массив (алгоритм Фишера-Йейтса), чтобы большие и маленькие тэги были вразнобой
for (let i = tagsWithWeights.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [tagsWithWeights[i], tagsWithWeights[j]] = [tagsWithWeights[j], tagsWithWeights[i]];
}

// Генерируем элементы списка из перемешанного массива
tagsWithWeights.forEach(item => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = "#"; // Заглушка для ссылки
  a.innerText = item.tag;
  a.setAttribute('data-weight', item.weight);
  
  // Обычный клик теперь просто отменяем, так как делаем drag
  a.onclick = function(e) {
    e.preventDefault();
  };
  
  li.appendChild(a);
  ul.appendChild(li);
});

// Инициализация TagCanvas после загрузки DOM
window.onload = function() {
  try {
    TagCanvas.Start('myCanvas', 'tags', {
      // Настройки в духе оригинального WP-Cumulus
      textColour: '#4B8BCC',    // Pantone 17-4139 TPG Azure Blue
      outlineColour: '#5C9CDD', // Чуть светлее
      reverse: true,            // Вращение за курсором (или от курсора)
      depth: 0.8,               // 3D глубина
      maxSpeed: 0.04,           // Максимальная скорость вращения
      minSpeed: 0.01,           // Минимальная скорость (чтобы никогда не останавливалось полностью)
      initial: [0.08, -0.03],   // Начальное направление вращения
      
      // Настройки веса/важности тэгов
      weight: true,
      weightMode: 'size',       // Размер шрифта зависит от веса
      weightFrom: 'data-weight',// Брать вес из атрибута
      weightSize: 1.0,          // Множитель размера
      
      // Визуальные эффекты
      radiusX: 0.68,            // Уменьшаем диаметр облака еще на 15%
      radiusY: 0.68,
      radiusZ: 0.68,
      textFont: '"Bebas Neue", Arial, sans-serif',
      outlineMethod: 'colour',  // Библиотека может менять либо цвет букв, либо рисовать рамку-фон
      shadow: 'rgba(0,0,0,0.05)',// Тень уменьшена еще в 2 раза
      shadowBlur: 1,
      shadowOffset: [1, 1],
      
      // Прочие настройки
      wheelZoom: false        // Отключаем зум колесиком мыши
    });
    
    // ЛОГИКА ПАНЕЛИ НАСТРОЕК (Ctrl + L)
    const settingsPanel = document.getElementById('settings-panel');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const fontSelect = document.getElementById('font-select');
    const fontHighlightSelect = document.getElementById('font-highlight-select');
    
    // Копируем опции шрифтов во второй селект
    if (fontSelect && fontHighlightSelect) {
      fontHighlightSelect.innerHTML = fontSelect.innerHTML;
    }

    const chkItalic = document.getElementById('chk-italic');
    const chkBold = document.getElementById('chk-bold');
    const chkUppercase = document.getElementById('chk-uppercase');
    const sizeSlider = document.getElementById('size-slider');
    const sizeVal = document.getElementById('size-val');
    const shadowSlider = document.getElementById('shadow-slider');
    const shadowVal = document.getElementById('shadow-val');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    const depthSlider = document.getElementById('depth-slider');
    const depthVal = document.getElementById('depth-val');
    const colorPicker = document.getElementById('color-picker');
    const outlineColorPicker = document.getElementById('outline-color-picker');
    const shadowColorPicker = document.getElementById('shadow-color-picker');
    const bgPresetSelect = document.getElementById('bg-preset-select');
    const bgOpacitySlider = document.getElementById('bg-opacity-slider');
    const bgOpacityVal = document.getElementById('bg-opacity-val');
    const bgOverlaySlider = document.getElementById('bg-overlay-slider');
    const bgOverlayVal = document.getElementById('bg-overlay-val');
    const chkAutoApply = document.getElementById('chk-auto-apply');
    const applyBtn = document.getElementById('apply-btn');
    const auroraBg = document.querySelector('.aurora-bg');
    const bgOverlay = document.getElementById('bg-overlay');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const draggedWordEl = document.getElementById('dragged-word');

    const DEFAULT_SETTINGS = {
      font: 'Bebas Neue',
      fontHighlight: 'Bebas Neue',
      italic: false,
      bold: false,
      uppercase: false,
      size: 24,
      shadowBlur: 1,
      speed: 4,
      depth: 8,
      color: '#ffffff',
      outlineColor: '#000000',
      shadowColor: '#000000',
      bgPreset: 'aurora',
      bgOpacity: 70,
      bgOverlay: 0,
      autoApply: false
    };

    // Переключение видимости панели по Ctrl+L / Cmd+L
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д')) {
        e.preventDefault();
        settingsPanel.classList.toggle('hidden');
      }
    });

    if (closePanelBtn) {
      closePanelBtn.addEventListener('click', () => {
        settingsPanel.classList.add('hidden');
      });
    }

    let applyTimer = null;
    function debouncedApplySettings() {
      if (applyTimer) clearTimeout(applyTimer);
      applyTimer = setTimeout(applySettings, 20);
    }

    // Обработчик кнопок-степперов + и -
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-target');
        const step = parseFloat(e.currentTarget.getAttribute('data-step'));
        const input = document.getElementById(targetId);
        if (input) {
          const min = parseFloat(input.min);
          const max = parseFloat(input.max);
          const curr = parseFloat(input.value);
          const newVal = Math.min(max, Math.max(min, curr + step));
          input.value = newVal;
          
          // Обновляем только текстовые значения рядом со слайдерами мгновенно
          if (targetId === 'shadow-slider' && shadowVal) shadowVal.innerText = newVal + 'px';
          if (targetId === 'size-slider' && sizeVal) sizeVal.innerText = newVal + 'px';
          if (targetId === 'speed-slider' && speedVal) speedVal.innerText = newVal;
          if (targetId === 'depth-slider' && depthVal) depthVal.innerText = newVal;
          if (targetId === 'bg-opacity-slider' && bgOpacityVal) bgOpacityVal.innerText = newVal + '%';
          if (targetId === 'bg-overlay-slider' && bgOverlayVal) bgOverlayVal.innerText = newVal + '%';

          if (chkAutoApply && chkAutoApply.checked) {
            debouncedApplySettings();
          }
        }
      });
    });

    if (chkAutoApply) {
      chkAutoApply.addEventListener('change', () => {
        applyBtn.style.display = chkAutoApply.checked ? 'none' : 'block';
        if (chkAutoApply.checked) debouncedApplySettings();
      });
    }

    async function applySettings() {
      const fontCloud = fontSelect.value;
      const fontHighlight = fontHighlightSelect ? fontHighlightSelect.value : fontCloud;
      const isItalic = chkItalic.checked;
      const isBold = chkBold.checked;
      const isUpper = chkUppercase.checked;
      const fontSizePx = parseInt(sizeSlider ? sizeSlider.value : 24);
      const shadowBlur = parseInt(shadowSlider.value);
      const speedValRaw = parseInt(speedSlider ? speedSlider.value : 4);
      const depthValRaw = parseInt(depthSlider ? depthSlider.value : 8);
      const color = colorPicker.value;
      const outlineColor = outlineColorPicker ? outlineColorPicker.value : '#5C9CDD';
      const shadowColor = shadowColorPicker ? shadowColorPicker.value : '#4B8BCC';
      const bgPreset = bgPresetSelect ? bgPresetSelect.value : 'aurora';
      const bgOpacity = bgOpacitySlider ? parseInt(bgOpacitySlider.value) : 70;
      const overlayOpacity = bgOverlaySlider ? parseInt(bgOverlaySlider.value) : 0;

      // Максимальная скорость в 2 раза быстрее (до 0.20 вместо 0.10)
      const maxSpeed = speedValRaw / 50.0;
      const depth = depthValRaw / 10.0;

      if (shadowVal) shadowVal.innerText = shadowBlur + 'px';
      if (sizeVal) sizeVal.innerText = fontSizePx + 'px';
      if (speedVal) speedVal.innerText = speedValRaw;
      if (depthVal) depthVal.innerText = depthValRaw;
      if (bgOpacityVal) bgOpacityVal.innerText = bgOpacity + '%';
      if (bgOverlayVal) bgOverlayVal.innerText = overlayOpacity + '%';

      // 1. Применяем настройки фона
      if (auroraBg) {
        auroraBg.className = 'aurora-bg preset-' + bgPreset;
        auroraBg.style.opacity = (bgOpacity / 100).toString();
      }
      if (bgOverlay) {
        bgOverlay.style.opacity = (overlayOpacity / 100).toString();
      }

      // 2. Дожидаемся загрузки обоих шрифтов браузером
      try {
        await Promise.all([
          document.fonts.load(`16px "${fontCloud}"`),
          document.fonts.load(`16px "${fontHighlight}"`)
        ]);
        // Ждем 1 кадр, чтобы браузер успел применить шрифты к DOM перед чтением TagCanvas
        await new Promise(r => setTimeout(r, 50));
      } catch (e) {
        console.warn('Font load error:', e);
      }

      // 3. Стилизуем вытянутое слово (шрифт выделения)
      if (draggedWordEl) {
        draggedWordEl.style.fontFamily = `"${fontHighlight}", sans-serif`;
        draggedWordEl.style.fontStyle = isItalic ? 'italic' : 'normal';
        draggedWordEl.style.fontWeight = isBold ? 'bold' : 'normal';
        draggedWordEl.style.textTransform = isUpper ? 'uppercase' : 'none';
        draggedWordEl.style.color = color;
        draggedWordEl.style.textShadow = shadowBlur > 0 ? `0 1px ${shadowBlur * 0.8}px ${shadowColor}` : 'none';
      }

      // 4. Обновляем стили <a> в списках HTML #tags (шрифт облака)
      const aElements = ul.querySelectorAll('a');
      aElements.forEach(a => {
        const original = a.getAttribute('data-original') || a.innerText;
        if (!a.getAttribute('data-original')) a.setAttribute('data-original', original);
        a.innerText = isUpper ? original.toUpperCase() : original;
        a.style.fontFamily = `"${fontCloud}", sans-serif`;
        a.style.fontStyle = isItalic ? 'italic' : 'normal';
        a.style.fontWeight = isBold ? 'bold' : 'normal';
      });

      // 5. Перерисовываем TagCanvas
      if (TagCanvas.tc && TagCanvas.tc['myCanvas']) {
        const tc = TagCanvas.tc['myCanvas'];
        tc.textFont = `"${fontCloud}", sans-serif`;
        tc.textColour = color;
        tc.outlineColour = outlineColor;
        tc.shadowBlur = Math.round(shadowBlur * 0.5);
        tc.shadowOffset = [0.5, 0.5];
        tc.shadow = shadowBlur > 0 ? shadowColor : null;
        tc.weightSize = fontSizePx / 24.0;
        tc.maxSpeed = maxSpeed;
        tc.depth = depth;
        tc.z1 = 250 / Math.max(depth, 0.001);
        tc.z2 = tc.z1 / tc.zoom;

        TagCanvas.Reload('myCanvas');
      }

      if (applyBtn && applyBtn.style.display !== 'none') {
        applyBtn.innerText = 'Применено';
        setTimeout(() => applyBtn.innerText = 'Применить', 1000);
      }
    }

    function saveSettings() {
      const settings = {
        font: fontSelect.value,
        fontHighlight: fontHighlightSelect ? fontHighlightSelect.value : fontSelect.value,
        italic: chkItalic.checked,
        bold: chkBold.checked,
        uppercase: chkUppercase.checked,
        size: sizeSlider ? sizeSlider.value : 24,
        shadowBlur: shadowSlider.value,
        speed: speedSlider ? speedSlider.value : 4,
        depth: depthSlider ? depthSlider.value : 8,
        color: colorPicker.value,
        outlineColor: outlineColorPicker ? outlineColorPicker.value : '#5C9CDD',
        shadowColor: shadowColorPicker ? shadowColorPicker.value : '#4B8BCC',
        bgPreset: bgPresetSelect ? bgPresetSelect.value : 'aurora',
        bgOpacity: bgOpacitySlider ? bgOpacitySlider.value : 70,
        bgOverlay: bgOverlaySlider ? bgOverlaySlider.value : 0,
        autoApply: chkAutoApply ? chkAutoApply.checked : false
      };
      localStorage.setItem('cloudSettings', JSON.stringify(settings));
      if (saveBtn) {
        saveBtn.innerText = 'Сохранено';
        setTimeout(() => saveBtn.innerText = 'Сохранить', 1000);
      }
    }

    function resetSettings() {
      localStorage.removeItem('cloudSettings');
      fontSelect.value = DEFAULT_SETTINGS.font;
      if (fontHighlightSelect) fontHighlightSelect.value = DEFAULT_SETTINGS.fontHighlight;
      chkItalic.checked = DEFAULT_SETTINGS.italic;
      chkBold.checked = DEFAULT_SETTINGS.bold;
      chkUppercase.checked = DEFAULT_SETTINGS.uppercase;
      if (sizeSlider) sizeSlider.value = DEFAULT_SETTINGS.size;
      shadowSlider.value = DEFAULT_SETTINGS.shadowBlur;
      if (speedSlider) speedSlider.value = DEFAULT_SETTINGS.speed;
      if (depthSlider) depthSlider.value = DEFAULT_SETTINGS.depth;
      colorPicker.value = DEFAULT_SETTINGS.color;
      if (outlineColorPicker) outlineColorPicker.value = DEFAULT_SETTINGS.outlineColor;
      if (shadowColorPicker) shadowColorPicker.value = DEFAULT_SETTINGS.shadowColor;
      if (bgPresetSelect) bgPresetSelect.value = DEFAULT_SETTINGS.bgPreset;
      if (bgOpacitySlider) bgOpacitySlider.value = DEFAULT_SETTINGS.bgOpacity;
      if (bgOverlaySlider) bgOverlaySlider.value = DEFAULT_SETTINGS.bgOverlay;
      if (chkAutoApply) {
        chkAutoApply.checked = DEFAULT_SETTINGS.autoApply;
        applyBtn.style.display = chkAutoApply.checked ? 'none' : 'block';
      }
      applySettings();
      if (resetBtn) {
        resetBtn.innerText = 'Сброшено';
        setTimeout(() => resetBtn.innerText = 'Сброс', 1000);
      }
    }

    function loadSavedSettings() {
      const saved = localStorage.getItem('cloudSettings');
      if (saved) {
        try {
          const s = JSON.parse(saved);
          if (s.font) fontSelect.value = s.font;
          if (s.fontHighlight && fontHighlightSelect) fontHighlightSelect.value = s.fontHighlight;
          if (s.italic !== undefined) chkItalic.checked = s.italic;
          if (s.bold !== undefined) chkBold.checked = s.bold;
          if (s.uppercase !== undefined) chkUppercase.checked = s.uppercase;
          if (s.size !== undefined && sizeSlider) sizeSlider.value = s.size;
          if (s.shadowBlur !== undefined) shadowSlider.value = s.shadowBlur;
          if (s.speed !== undefined && speedSlider) speedSlider.value = s.speed;
          if (s.depth !== undefined && depthSlider) depthSlider.value = s.depth;
          if (s.color) colorPicker.value = s.color;
          if (s.outlineColor && outlineColorPicker) outlineColorPicker.value = s.outlineColor;
          if (s.shadowColor && shadowColorPicker) shadowColorPicker.value = s.shadowColor;
          if (s.bgPreset && bgPresetSelect) bgPresetSelect.value = s.bgPreset;
          if (s.bgOpacity !== undefined && bgOpacitySlider) bgOpacitySlider.value = s.bgOpacity;
          if (s.bgOverlay !== undefined && bgOverlaySlider) bgOverlaySlider.value = s.bgOverlay;
          if (s.autoApply !== undefined && chkAutoApply) {
            chkAutoApply.checked = s.autoApply;
            applyBtn.style.display = chkAutoApply.checked ? 'none' : 'block';
          }
        } catch(e) {}
      }
      applySettings();
    }

    const autoApplyCheck = () => { if (chkAutoApply && chkAutoApply.checked) debouncedApplySettings(); };

    if (fontSelect) fontSelect.addEventListener('change', autoApplyCheck);
    if (fontHighlightSelect) fontHighlightSelect.addEventListener('change', autoApplyCheck);
    if (chkItalic) chkItalic.addEventListener('change', autoApplyCheck);
    if (chkBold) chkBold.addEventListener('change', autoApplyCheck);
    if (chkUppercase) chkUppercase.addEventListener('change', autoApplyCheck);
    if (colorPicker) colorPicker.addEventListener('input', autoApplyCheck);
    if (outlineColorPicker) outlineColorPicker.addEventListener('input', autoApplyCheck);
    if (shadowColorPicker) shadowColorPicker.addEventListener('input', autoApplyCheck);
    if (bgPresetSelect) bgPresetSelect.addEventListener('change', autoApplyCheck);

    // Обновление цифр при движении ползунков без перерисовки Canvas
    if (sizeSlider) sizeSlider.addEventListener('input', (e) => { if(sizeVal) sizeVal.innerText = e.target.value + 'px'; autoApplyCheck(); });
    if (shadowSlider) shadowSlider.addEventListener('input', (e) => { if(shadowVal) shadowVal.innerText = e.target.value + 'px'; autoApplyCheck(); });
    if (speedSlider) speedSlider.addEventListener('input', (e) => { if(speedVal) speedVal.innerText = e.target.value; autoApplyCheck(); });
    if (depthSlider) depthSlider.addEventListener('input', (e) => { if(depthVal) depthVal.innerText = e.target.value; autoApplyCheck(); });
    if (bgOpacitySlider) bgOpacitySlider.addEventListener('input', (e) => { if(bgOpacityVal) bgOpacityVal.innerText = e.target.value + '%'; autoApplyCheck(); });
    if (bgOverlaySlider) bgOverlaySlider.addEventListener('input', (e) => { if(bgOverlayVal) bgOverlayVal.innerText = e.target.value + '%'; autoApplyCheck(); });

    if (applyBtn) applyBtn.addEventListener('click', applySettings);
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
    if (resetBtn) resetBtn.addEventListener('click', resetSettings);

    loadSavedSettings();
    
    // ЛОГИКА ПОДСКАЗКИ
    const hint = document.getElementById('hint');
    let hasInteracted = false;
    let hintInterval = null;

    function showHint() {
      if (hasInteracted) return;
      hint.classList.add('visible');
      setTimeout(() => {
        if (!hasInteracted) hint.classList.remove('visible');
      }, 5000); // Подсказка висит 5 секунд
    }

    // Появляется через 1.5 секунды после открытия
    setTimeout(() => {
      showHint();
      // Затем каждые 2 минуты (120 000 мс)
      hintInterval = setInterval(() => {
        showHint();
      }, 120000);
    }, 1500);

    // ЛОГИКА ВЫТЯГИВАНИЯ СЛОВА
    const canvas = document.getElementById('myCanvas');
    const draggedWord = document.getElementById('dragged-word');
    
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let springAnim = null;
    let dragAnim = null;
    let dragStartTime = 0;
    
    // Переменные для замедленного дрожания
    let jitterFrameCount = 0;
    let currentJitterX = 0, currentJitterY = 0;
    
    // Пасхалка с Масей
    let lastHeartSpawnTime = 0;
    
    function handleDown(x, y) {
      const tc = TagCanvas.tc['myCanvas'];
      const activeTag = tc && tc.active ? (tc.active.tag || tc.active) : null;
      
      hasInteracted = true;
      if (hintInterval) clearInterval(hintInterval);
      if (hint) hint.classList.remove('visible');
      
      if (activeTag && activeTag.a) {
        isDragging = true;
        startX = x;
        startY = y;
        currentX = startX;
        currentY = startY;
        dragStartTime = Date.now();
        lastHeartSpawnTime = 0;
        
        tc.maxSpeed = 0.0052;
        
        draggedWord.innerText = activeTag.a.innerText;
        draggedWord.style.fontSize = '34px';
        draggedWord.classList.remove('hidden');
        
        if (springAnim) cancelAnimationFrame(springAnim);
        if (dragAnim) cancelAnimationFrame(dragAnim);
        dragLoop();
      }
    }

    canvas.addEventListener('mousedown', function(e) {
      handleDown(e.clientX, e.clientY);
    }, true);
    
    canvas.addEventListener('touchstart', function(e) {
      // Ждем 1 кадр, чтобы TagCanvas успел обновить tc.active своими внутренними обработчиками
      setTimeout(() => {
        if (e.touches.length > 0) {
          handleDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, 0);
    }, { passive: true, capture: true });

    function handleMove(x, y, e) {
      if (isDragging) {
        currentX = x;
        currentY = y;
        // Отменяем скролл экрана телефона при вытягивании слова
        if (e && e.cancelable) e.preventDefault();
      }
    }

    window.addEventListener('mousemove', function(e) {
      handleMove(e.clientX, e.clientY, e);
    });

    window.addEventListener('touchmove', function(e) {
      if (isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: false });

    function handleUp() {
      if (isDragging) {
        isDragging = false;
        if (dragAnim) cancelAnimationFrame(dragAnim);
        snapBack();
      }
    }

    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', handleUp);
    
    function dragLoop() {
      if (!isDragging) return;
      
      const elapsed = Date.now() - dragStartTime;
      let displayX = currentX;
      let displayY = currentY;
      
      // Вектор от текущего курсора к центру (точке захвата)
      const dx = startX - currentX;
      const dy = startY - currentY;
      
      const isMasya = draggedWord.innerText.trim().toLowerCase() === 'мася';
      
      if (!isMasya) {
        let pullStrength = 0;
        
        // Первая попытка убежать: на 2-й секунде (2000-2200 мс)
        if (elapsed > 2000 && elapsed < 2200) {
          const progress = (elapsed - 2000) / 200;
          pullStrength = Math.sin(progress * Math.PI) * 0.3; // Дергается на 30% к центру
        }
        
        // Вторая попытка убежать (сильнее): на 4-й секунде (4000-4300 мс)
        if (elapsed > 4000 && elapsed < 4300) {
          const progress = (elapsed - 4000) / 300;
          pullStrength = Math.sin(progress * Math.PI) * 0.6; // Дергается на 60% к центру
        }
        
        displayX += dx * pullStrength;
        displayY += dy * pullStrength;
        
        // Добавляем эффект дрожания (собачка)
        let jitterAmplitude = 1.0; // Легкая дрожь всегда
        if (pullStrength > 0) {
           jitterAmplitude = 4.0; // Сильная дрожь, когда вырывается
        }
        
        // Обновляем дрожание только каждый 2-й кадр, чтобы оно было в 2 раза медленнее
        jitterFrameCount++;
        if (jitterFrameCount % 2 === 0) {
          currentJitterX = (Math.random() - 0.5) * 2 * jitterAmplitude;
          currentJitterY = (Math.random() - 0.5) * 2 * jitterAmplitude;
        }
        
        displayX += currentJitterX;
        displayY += currentJitterY;
      } else {
        // Мягкое плавание для Маси
        displayX += Math.sin(elapsed / 800) * 15;
        displayY += Math.cos(elapsed / 1000) * 10;
        
        // Всплывающие сердечки
        if (elapsed - lastHeartSpawnTime > 700) {
          lastHeartSpawnTime = elapsed;
          spawnHeart(displayX, displayY);
        }
      }
      
      updateDraggedPosition(displayX, displayY);
      
      // Динамический размер рассчитываем от фактического положения с учетом вырывания
      const distance = Math.sqrt(Math.pow(displayX - startX, 2) + Math.pow(displayY - startY, 2));
      const maxDistance = Math.min(window.innerWidth, window.innerHeight) / 1.5;
      const baseSize = 34;
      const maxSize = 70;
      let newSize = baseSize + (Math.min(distance, maxDistance) / maxDistance) * (maxSize - baseSize);
      draggedWord.style.fontSize = newSize + 'px';
      
      dragAnim = requestAnimationFrame(dragLoop);
    }

    function updateDraggedPosition(x, y) {
      draggedWord.style.left = x + 'px';
      draggedWord.style.top = y + 'px';
    }
    
    function snapBack() {
      let vx = 0, vy = 0;
      const tension = 0.3; // Сила натяжения резинки
      const friction = 0.65; // Трение (чем меньше, тем быстрее затухают колебания)
      
      function animate() {
        const dx = startX - currentX;
        const dy = startY - currentY;
        
        vx += dx * tension;
        vy += dy * tension;
        vx *= friction;
        vy *= friction;
        
        currentX += vx;
        currentY += vy;
        
        updateDraggedPosition(currentX, currentY);
        
        // При возврате слово тоже плавно уменьшается
        const distance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
        const maxDistance = Math.min(window.innerWidth, window.innerHeight) / 1.5;
        const baseSize = 34;
        const maxSize = 70;
        let newSize = baseSize + (Math.min(distance, maxDistance) / maxDistance) * (maxSize - baseSize);
        draggedWord.style.fontSize = newSize + 'px';
        
        // Если слово почти вернулось в центр и остановилось
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(vx) < 1 && Math.abs(vy) < 1) {
          draggedWord.classList.add('hidden');
          // Возвращаем нормальную скорость вращения облаку
          if (TagCanvas.tc['myCanvas']) {
            TagCanvas.tc['myCanvas'].maxSpeed = 0.04; 
          }
        } else {
          springAnim = requestAnimationFrame(animate);
        }
      }
      
      animate();
    }
    
    // Спавн сердечек для Маси
    function spawnHeart(x, y) {
      const heart = document.createElement('img');
      heart.src = '/heart.jpg';
      heart.className = 'floating-heart';
      
      // Случайное смещение
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 40 - 20; 
      
      heart.style.left = (x + offsetX) + 'px';
      heart.style.top = (y + offsetY) + 'px';
      
      document.body.appendChild(heart);
      
      setTimeout(() => {
        if (heart.parentNode) heart.parentNode.removeChild(heart);
      }, 4000);
    }
    
  } catch (e) {
    // Выполнится, если canvas не поддерживается браузером
    document.getElementById('canvas-container').style.display = 'none';
  }
};
