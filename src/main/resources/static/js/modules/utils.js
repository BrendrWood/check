// ============================================
// МОДУЛЬ УТИЛИТ И ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ
// ============================================

import { CSS_CLASSES } from '../config.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Форматирование времени
 */
export function formatTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Форматирование даты для отображения
 */
export function formatDateForDisplay(dateString) {
    if (dateString === 'Без даты') return dateString;

    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    } else {
        return date.toLocaleDateString('ru-RU', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Экранирование спецсимволов в регулярных выражениях
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Прикрепление обработчиков для строк таблицы
 */
export function attachTableRowHandlers() {
    const rows = document.querySelectorAll('.app-row');
    rows.forEach(row => {
        row.addEventListener('dblclick', () => {
            const id = row.getAttribute('data-id');
            if (typeof window.loadFromTable === 'function') {
                window.loadFromTable(id);
            }
        });

        row.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            rows.forEach(r => r.classList.remove(CSS_CLASSES.HIGHLIGHTED));
            row.classList.add(CSS_CLASSES.HIGHLIGHTED);
        });
    });
}