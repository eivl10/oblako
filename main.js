const tagsList = [
  "музыка", "красота", "шуточки", "вайбкодинг", "культура и искусство", 
  "велосипед", "вегетарианство", "Моника из друзей", "экологичное потребление", 
  "перфекционизм", "автоматизация", "шалости", "гамак", "продакт-менеджмент", 
  "гитары", "глюкофоны", "укулеле", "дудки", "мьюзик продакшн", "Вырыпаев", 
  "плёночкая мыльница", "Шри-Ланка", "Станция Смена", "экстрим", "энкаунтер", 
  "красный чай", "белый чай", "саган дайля", "комнатные растения", 
  "квашеная капуста", "микрозелень", "комбуча", "мигрень", 
  "высокая чувствительность", "покер фейс", "покер", "после 11 спать"
];

const ul = document.querySelector('#tags ul');

// Сначала рассчитываем вес для каждого тэга на основе его изначальной позиции
const tagsWithWeights = tagsList.map((tag, index) => {
  const importance = index / (tagsList.length - 1);
  const weight = 45 - (45 - 12) * Math.pow(importance, 0.6);
  return { tag, weight };
});

// Добавляем новые слова со специфическими весами
tagsWithWeights.push(
  { tag: 'горы', weight: 25 },
  { tag: 'Мася', weight: 45 },
  { tag: 'Космоскай', weight: 25 },
  { tag: 'лето', weight: 25 },
  { tag: 'сарказм', weight: 12 },
  { tag: 'ирония', weight: 12 },
  { tag: 'метаирония', weight: 25 },
  { tag: 'друзья', weight: 45 },
  { tag: 'джемы', weight: 45 }
);

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
