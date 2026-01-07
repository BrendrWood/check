// radioDateScroll.js
// Создание и управление радио-прокруткой для навигации по датам

import { formatDateForDisplay } from './utils.js';

/**
 * Создает HTML структуру радио-прокрутки для навигации по датам
 * @param {Array} dates - Массив объектов с датами и количеством заявок
 * @param {string} containerId - ID контейнера для вставки
 * @returns {string} HTML код радио-прокрутки
 */
export function createRadioDateScroll(dates, containerId = 'dateRadioScrollContainer') {
    if (dates.length === 0) return '';

    let html = `
        <div class="date-radio-scroll-container">
            <div class="date-radio-center-marker"></div>
            <div class="date-radio-scroll" id="dateRadioScroll">
    `;

    dates.forEach(dateObj => {
        const displayText = getCompactDateText(dateObj.date, dateObj.count);
        const isToday = isTodayDate(dateObj.date);

        html += `
            <div class="date-radio-chip ${isToday ? 'active' : ''}"
                 data-date="${dateObj.date}"
                 data-count="${dateObj.count}"
                 onclick="toggleDateByChip('${dateObj.date}')"
                 title="${getFullDateTitle(dateObj.date, dateObj.count)}">
                ${displayText}
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Форматирует дату в компактный текст для отображения
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @param {number} count - Количество заявок
 * @returns {string} Компактный текст даты
 */
function getCompactDateText(dateString, count) {
    const display = formatDateForDisplay(dateString);

    if (display === 'Сегодня') return `С ${count}`;      // Укоротили "Сег" до "С"
    if (display === 'Вчера') return `В ${count}`;        // Укоротили "Вч" до "В"

    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');

    // Сокращаем название месяцев для компактности
    const shortMonths = {
        'янв': 'янв',
        'фев': 'фев',
        'мар': 'мар',
        'апр': 'апр',
        'май': 'мая',  // Для мая своя форма
        'июн': 'июн',
        'июл': 'июл',
        'авг': 'авг',
        'сен': 'сен',
        'окт': 'окт',
        'ноя': 'ноя',
        'дек': 'дек'
    };

    const shortMonth = shortMonths[month.toLowerCase()] || month.slice(0, 3);

    return `${day} ${shortMonth} ${count}`;
}

/**
 * Создает полное название даты для всплывающей подсказки
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @param {number} count - Количество заявок
 * @returns {string} Полное название даты
 */
function getFullDateTitle(dateString, count) {
    const date = new Date(dateString);
    const fullDate = date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `${fullDate} (${count} заявок)`;
}

/**
 * Проверяет, является ли дата сегодняшней
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @returns {boolean} true если дата сегодняшняя
 */
function isTodayDate(dateString) {
    const today = new Date();
    const checkDate = new Date(dateString);
    return today.toDateString() === checkDate.toDateString();
}

/**
 * Инициализирует радио-прокрутку
 * Центрирует сегодняшний день и настраивает обработчики
 */
export function initRadioDateScroll() {
    const scrollContainer = document.getElementById('dateRadioScroll');
    if (!scrollContainer) return;

    // Устанавливаем активный чип (сегодня или первый)
    const todayChip = scrollContainer.querySelector('.date-radio-chip.active');
    if (todayChip) {
        centerElement(todayChip);
    } else {
        const firstChip = scrollContainer.querySelector('.date-radio-chip');
        if (firstChip) {
            firstChip.classList.add('active');
            centerElement(firstChip);
        }
    }

    // Настраиваем прокрутку колесом мыши с увеличенной скоростью
    setupMouseWheelScroll(scrollContainer);

    // Обновляем визуальное состояние чипов
    updateChipOpacity();

    // Обновляем прозрачность при скролле
    scrollContainer.addEventListener('scroll', updateChipOpacity);
}

/**
 * Центрирует элемент в контейнере прокрутки
 * @param {HTMLElement} element - Элемент для центрирования
 */
function centerElement(element) {
    const container = element.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const elementLeft = element.offsetLeft;
    const elementWidth = element.clientWidth;

    const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);

    container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
    });
}

/**
 * Настраивает прокрутку колесом мыши с увеличенной скоростью
 * @param {HTMLElement} container - Контейнер для прокрутки
 */
function setupMouseWheelScroll(container) {
    let isScrolling = false;

    container.addEventListener('wheel', function(e) {
        e.preventDefault();

        // Увеличиваем скорость прокрутки в 1.5 раза
        const scrollSpeedMultiplier = 1.5;
        const scrollAmount = e.deltaY * scrollSpeedMultiplier;

        // Прокручиваем с плавностью
        container.scrollLeft += scrollAmount;

        // Обновляем визуализацию
        if (!isScrolling) {
            isScrolling = true;
            updateChipOpacity();

            // Сбрасываем флаг через короткую задержку
            setTimeout(() => {
                isScrolling = false;
            }, 50);
        }
    });

    // Также добавляем поддержку тачпада для Mac
    container.addEventListener('touchstart', function(e) {
        this.touchStartX = e.touches[0].clientX;
        this.scrollStartLeft = this.scrollLeft;
        this.isTouchScrolling = true;
    });

    container.addEventListener('touchmove', function(e) {
        if (!this.isTouchScrolling) return;

        const touchX = e.touches[0].clientX;
        const diffX = this.touchStartX - touchX;

        // Увеличиваем скорость прокрутки на тачпаде
        const touchSpeedMultiplier = 1.5;
        this.scrollLeft = this.scrollStartLeft + (diffX * touchSpeedMultiplier);

        updateChipOpacity();
        e.preventDefault();
    });

    container.addEventListener('touchend', function() {
        this.isTouchScrolling = false;
    });
}

/**
 * Обновляет прозрачность кнопок при скролле
 * Делает центральные элементы более заметными
 */
export function updateChipOpacity() {
    const container = document.getElementById('dateRadioScroll');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const chips = container.querySelectorAll('.date-radio-chip');

    chips.forEach(chip => {
        const chipRect = chip.getBoundingClientRect();
        const chipCenter = chipRect.left + chipRect.width / 2;
        const distance = Math.abs(chipCenter - containerCenter);

        chip.classList.remove('active', 'near-center');

        const maxDistance = containerRect.width / 2;
        const opacity = 1 - (distance / maxDistance);

        chip.style.opacity = Math.max(0.3, Math.min(1, opacity));
        chip.style.transform = `scale(${0.9 + (opacity * 0.2)})`;

        if (distance < 30) {
            chip.classList.add('active');
        } else if (distance < 100) {
            chip.classList.add('near-center');
        }
    });
}

// Глобальный экспорт функций
if (typeof window !== 'undefined') {
    window.toggleDateByChip = function(date) {
        const chip = document.querySelector(`.date-radio-chip[data-date="${date}"]`);
        if (chip) {
            const content = document.getElementById(`content-${date}`);
            const header = document.getElementById(`date-${date}`);

            // Проверяем, открыта ли уже эта группа
            const isCurrentlyExpanded = content.style.display !== 'none';

            // Если группа уже открыта - сворачиваем ее
            if (isCurrentlyExpanded) {
                content.style.display = 'none';
                header.classList.remove('expanded');
                const icon = header.querySelector('.collapse-icon');
                if (icon) {
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-right');
                }
            } else {
                // Если группа закрыта - открываем и центрируем
                centerElement(chip);
                window.scrollToDate(date);
            }
        }
    };

    window.updateChipOpacity = updateChipOpacity;
}