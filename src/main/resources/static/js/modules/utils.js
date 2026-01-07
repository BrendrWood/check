// ============================================
// МОДУЛЬ УТИЛИТ И ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ
// Общие вспомогательные функции для приложения
// ============================================

import { CSS_CLASSES } from '../config.js';

/**
 * Форматирует время из строки в читаемый формат
 * @param {string} dateTimeString - Строка с датой и временем
 * @returns {string} Отформатированное время в формате "ЧЧ:ММ"
 */
export function formatTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Форматирует дату для отображения с учетом относительного времени
 * @param {string} dateString - Строка с датой
 * @returns {string} Отформатированная дата (Сегодня/Вчера/полная дата)
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
 * Экранирует специальные символы для использования в регулярных выражениях
 * @param {string} string - Исходная строка
 * @returns {string} Экранированная строка
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Прикрепляет обработчики событий к строкам таблицы
 * Обрабатывает двойной клик для загрузки заявки и клик для выделения
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