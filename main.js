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
    const chkItalic = document.getElementById('chk-italic');
    const chkBold = document.getElementById('chk-bold');
    const chkUppercase = document.getElementById('chk-uppercase');
    const shadowSlider = document.getElementById('shadow-slider');
    const shadowVal = document.getElementById('shadow-val');
    const colorPicker = document.getElementById('color-picker');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const draggedWordEl = document.getElementById('dragged-word');

    const DEFAULT_SETTINGS = {
      font: 'Bebas Neue',
      italic: false,
      bold: false,
      uppercase: false,
      shadowBlur: 1,
      color: '#4B8BCC'
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

    // Динамическая асинхронная загрузка шрифтов Google Fonts
    function ensureFontLoaded(fontFamily) {
      const linkId = 'gfont-' + fontFamily.replace(/\s+/g, '-');
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
        document.head.appendChild(link);
      }
      return document.fonts ? document.fonts.ready : Promise.resolve();
    }

    async function applySettings() {
      const font = fontSelect.value;
      const isItalic = chkItalic.checked;
      const isBold = chkBold.checked;
      const isUpper = chkUppercase.checked;
      const shadowBlur = parseInt(shadowSlider.value);
      const color = colorPicker.value;

      if (shadowVal) shadowVal.innerText = shadowBlur + 'px';

      // Гарантируем, что шрифт загрузился перед отрисовкой в Canvas
      await ensureFontLoaded(font);

      const fontSpec = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}"${font}", sans-serif`;

      if (draggedWordEl) {
        draggedWordEl.style.fontFamily = `"${font}", sans-serif`;
        draggedWordEl.style.fontStyle = isItalic ? 'italic' : 'normal';
        draggedWordEl.style.fontWeight = isBold ? 'bold' : 'normal';
        draggedWordEl.style.textTransform = isUpper ? 'uppercase' : 'none';
        draggedWordEl.style.color = color;
        draggedWordEl.style.textShadow = shadowBlur > 0 ? `0 1px ${shadowBlur}px ${color}` : 'none';
      }

      if (TagCanvas.tc && TagCanvas.tc['myCanvas']) {
        const tc = TagCanvas.tc['myCanvas'];
        tc.textFont = fontSpec;
        tc.textColour = color;
        tc.shadowBlur = shadowBlur;
        tc.shadowOffset = [1, 1];
        tc.shadow = shadowBlur > 0 ? color : null;

        const aElements = ul.querySelectorAll('a');
        aElements.forEach(a => {
          const original = a.getAttribute('data-original') || a.innerText;
          if (!a.getAttribute('data-original')) a.setAttribute('data-original', original);
          a.innerText = isUpper ? original.toUpperCase() : original;
        });

        TagCanvas.Reload('myCanvas');
      }
    }

    function saveSettings() {
      const settings = {
        font: fontSelect.value,
        italic: chkItalic.checked,
        bold: chkBold.checked,
        uppercase: chkUppercase.checked,
        shadowBlur: shadowSlider.value,
        color: colorPicker.value
      };
      localStorage.setItem('cloudSettings', JSON.stringify(settings));
      if (saveBtn) {
        const oldText = saveBtn.innerText;
        saveBtn.innerText = 'Сохранено! ✓';
        setTimeout(() => saveBtn.innerText = oldText, 1500);
      }
    }

    function resetSettings() {
      localStorage.removeItem('cloudSettings');
      fontSelect.value = DEFAULT_SETTINGS.font;
      chkItalic.checked = DEFAULT_SETTINGS.italic;
      chkBold.checked = DEFAULT_SETTINGS.bold;
      chkUppercase.checked = DEFAULT_SETTINGS.uppercase;
      shadowSlider.value = DEFAULT_SETTINGS.shadowBlur;
      colorPicker.value = DEFAULT_SETTINGS.color;
      applySettings();
      if (resetBtn) {
        const oldText = resetBtn.innerText;
        resetBtn.innerText = 'Сброшено! ✓';
        setTimeout(() => resetBtn.innerText = oldText, 1500);
      }
    }

    function loadSavedSettings() {
      const saved = localStorage.getItem('cloudSettings');
      if (saved) {
        try {
          const s = JSON.parse(saved);
          if (s.font) fontSelect.value = s.font;
          if (s.italic !== undefined) chkItalic.checked = s.italic;
          if (s.bold !== undefined) chkBold.checked = s.bold;
          if (s.uppercase !== undefined) chkUppercase.checked = s.uppercase;
          if (s.shadowBlur !== undefined) shadowSlider.value = s.shadowBlur;
          if (s.color) colorPicker.value = s.color;
        } catch(e) {}
      }
      applySettings();
    }

    if (fontSelect) fontSelect.addEventListener('change', applySettings);
    if (chkItalic) chkItalic.addEventListener('change', applySettings);
    if (chkBold) chkBold.addEventListener('change', applySettings);
    if (chkUppercase) chkUppercase.addEventListener('change', applySettings);
    if (shadowSlider) shadowSlider.addEventListener('input', applySettings);
    if (colorPicker) colorPicker.addEventListener('input', applySettings);
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

    // Появляется через 10 секунд после открытия
    setTimeout(() => {
      showHint();
      // Затем каждые 2 минуты (120 000 мс)
      hintInterval = setInterval(() => {
        showHint();
      }, 120000);
    }, 10000);

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
      
      const isMasya = draggedWord.innerText === 'Мася';
      
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
