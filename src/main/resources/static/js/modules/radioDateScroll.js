// radioDateScroll.js - Радио-прокрутка для навигации по датам

import { formatDateForDisplay } from './utils.js';

/**
 * Создать радио-прокрутку для навигации по датам
 */
export function createRadioDateScroll(dates, containerId = 'dateRadioScrollContainer') {
    if (dates.length === 0) return '';

    // Создаем HTML структуру
    let html = `
        <div class="date-radio-scroll-container">
            <div class="date-radio-center-marker"></div>
            <div class="date-radio-scroll" id="dateRadioScroll">
    `;

    // Добавляем кнопки дат
    dates.forEach(dateObj => {
        const displayText = getCompactDateText(dateObj.date, dateObj.count);
        const isToday = isTodayDate(dateObj.date);
        const isYesterday = isYesterdayDate(dateObj.date);

        html += `
            <div class="date-radio-chip ${isToday ? 'active' : ''}"
                 data-date="${dateObj.date}"
                 data-count="${dateObj.count}"
                 onclick="selectDateRadio('${dateObj.date}')"
                 title="${getFullDateTitle(dateObj.date, dateObj.count)}">
                ${displayText}
            </div>
        `;
    });

    html += `
            </div>
        </div>

        <div class="date-radio-controls">
            <button class="btn btn-sm btn-outline-secondary" onclick="scrollDateRadio(-1)">
                <i class="bi bi-chevron-left"></i> Предыдущий
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="scrollDateRadio(1)">
                Следующий <i class="bi bi-chevron-right"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="centerOnToday()">
                <i class="bi bi-calendar-check"></i> Сегодня
            </button>
        </div>
    `;

    // Если дней много, добавляем пагинацию по месяцам
    if (dates.length > 30) {
        html += createMonthPagination(dates);
    }

    return html;
}

/**
 * Компактное отображение даты
 */
function getCompactDateText(dateString, count) {
    const display = formatDateForDisplay(dateString);

    // Сокращаем для компактности
    if (display === 'Сегодня') return `Сег ${count}`;
    if (display === 'Вчера') return `Вч ${count}`;

    // Форматируем: "25 дек" или "чт 25"
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '');

    return `${day} ${month} ${count}`;
}

/**
 * Полное название для title
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
 * Проверка на сегодня
 */
function isTodayDate(dateString) {
    const today = new Date();
    const checkDate = new Date(dateString);
    return today.toDateString() === checkDate.toDateString();
}

/**
 * Проверка на вчера
 */
function isYesterdayDate(dateString) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(dateString);
    return yesterday.toDateString() === checkDate.toDateString();
}

/**
 * Создать пагинацию по месяцам
 */
function createMonthPagination(dates) {
    const months = groupDatesByMonth(dates);

    let html = '<div class="month-pagination" id="monthPagination">';

    Object.keys(months).forEach(month => {
        const monthDisplay = formatMonth(month);
        const total = months[month].reduce((sum, d) => sum + d.count, 0);

        html += `
            <div class="month-pagination-chip"
                 onclick="scrollToMonth('${month}')"
                 title="${months[month].length} дней, ${total} заявок">
                ${monthDisplay} <span class="badge bg-secondary">${total}</span>
            </div>
        `;
    });

    html += '</div>';

    return html;
}

/**
 * Группировка по месяцам
 */
function groupDatesByMonth(dates) {
    const months = {};

    dates.forEach(dateObj => {
        const month = dateObj.date.substring(0, 7); // "2024-12"

        if (!months[month]) {
            months[month] = [];
        }

        months[month].push(dateObj);
    });

    return months;
}

/**
 * Форматирование месяца
 */
function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const monthNames = [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];

    return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
}

/**
 * Инициализация радио-прокрутки
 */
export function initRadioDateScroll() {
    const scrollContainer = document.getElementById('dateRadioScroll');
    if (!scrollContainer) return;

    // Центрируем сегодняшний день
    const todayChip = scrollContainer.querySelector('.date-radio-chip.active');
    if (todayChip) {
        centerElement(todayChip);
    } else {
        // Или первый элемент
        const firstChip = scrollContainer.querySelector('.date-radio-chip');
        if (firstChip) {
            firstChip.classList.add('active');
            centerElement(firstChip);
        }
    }

    // Обновляем прозрачность при скролле
    scrollContainer.addEventListener('scroll', updateChipOpacity);

    // Инициализируем прозрачность
    updateChipOpacity();
}

/**
 * Центрирование элемента
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
 * Обновление прозрачности кнопок при скролле
 */
function updateChipOpacity() {
    const container = document.getElementById('dateRadioScroll');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    const chips = container.querySelectorAll('.date-radio-chip');

    chips.forEach(chip => {
        const chipRect = chip.getBoundingClientRect();
        const chipCenter = chipRect.left + chipRect.width / 2;
        const distance = Math.abs(chipCenter - containerCenter);

        // Убираем все классы
        chip.classList.remove('active', 'near-center');

        // Вычисляем прозрачность на основе расстояния
        const maxDistance = containerRect.width / 2;
        const opacity = 1 - (distance / maxDistance);

        chip.style.opacity = Math.max(0.3, Math.min(1, opacity));
        chip.style.transform = `scale(${0.9 + (opacity * 0.2)})`;

        // Добавляем классы для ближайших элементов
        if (distance < 30) {
            chip.classList.add('active');
        } else if (distance < 100) {
            chip.classList.add('near-center');
        }
    });
}

// Глобальный экспорт функций
if (typeof window !== 'undefined') {
    window.selectDateRadio = function(date) {
        const chip = document.querySelector(`.date-radio-chip[data-date="${date}"]`);
        if (chip) {
            centerElement(chip);
            // Прокручиваем к соответствующей группе дат
            window.scrollToDate(date);
        }
    };

    window.scrollDateRadio = function(direction) {
        const container = document.getElementById('dateRadioScroll');
        if (!container) return;

        const scrollAmount = 150; // пикселей за клик
        container.scrollBy({
            left: scrollAmount * direction,
            behavior: 'smooth'
        });

        // Обновляем прозрачность после скролла
        setTimeout(updateChipOpacity, 300);
    };

    window.centerOnToday = function() {
        const todayChip = document.querySelector('.date-radio-chip.active');
        if (todayChip) {
            centerElement(todayChip);
        }
    };

    window.scrollToMonth = function(month) {
        const container = document.getElementById('dateRadioScroll');
        if (!container) return;

        // Находим первую дату этого месяца
        const firstDateOfMonth = document.querySelector(`.date-radio-chip[data-date^="${month}"]`);
        if (firstDateOfMonth) {
            centerElement(firstDateOfMonth);
        }
    };

    window.updateChipOpacity = updateChipOpacity;
}