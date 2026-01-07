// ============================================
// МОДУЛЬ ЭКСПОРТА И ЗАГРУЗКИ ДАННЫХ
// Функции для экспорта заявок в различные форматы
// ============================================

import { state, MESSAGES } from '../config.js';
import { showTempMessage } from './ui.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Экспортирует одну заявку по номеру в Excel файл
 * Проверяет наличие заявки и показывает индикатор загрузки
 */
export function exportSingle() {
    const numberInput = document.getElementById('exportNumber');
    const number = numberInput.value.trim();

    if (!number) {
        numberInput.classList.add('is-invalid');
        const originalPlaceholder = numberInput.placeholder;
        numberInput.placeholder = 'Введите номер!';

        setTimeout(() => {
            numberInput.placeholder = originalPlaceholder;
            numberInput.classList.remove('is-invalid');
        }, 3000);
        return;
    }

    const exportButton = document.querySelector('[onclick="exportSingle()"]');
    const originalButtonHTML = exportButton.innerHTML;
    exportButton.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    exportButton.disabled = true;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'exportFrame_' + Date.now();

    iframe.onload = function() {
        exportButton.innerHTML = originalButtonHTML;
        exportButton.disabled = false;

        setTimeout(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const bodyText = iframeDoc.body ? iframeDoc.body.textContent || iframeDoc.body.innerText : '';

                if (bodyText.includes('Заявки не найдены') ||
                    bodyText.includes('Нет заявок') ||
                    bodyText.trim() === 'Заявки не найдены') {

                    numberInput.classList.add('is-invalid');
                    const originalPlaceholder = numberInput.placeholder;
                    numberInput.placeholder = 'Заявка не найдена!';
                    numberInput.value = '';

                    setTimeout(() => {
                        numberInput.placeholder = originalPlaceholder;
                        numberInput.classList.remove('is-invalid');
                    }, 3000);

                    showTempMessage('Заявка не найдена', 'error');
                } else {
                    showTempMessage('Файл скачан успешно', 'success');
                    numberInput.value = '';
                }
            } catch (e) {
                showTempMessage('Файл скачан успешно', 'success');
                numberInput.value = '';
            }

            setTimeout(() => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };

    iframe.onerror = function() {
        exportButton.innerHTML = originalButtonHTML;
        exportButton.disabled = false;
        showTempMessage('Ошибка при скачивании', 'error');

        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    };

    document.body.appendChild(iframe);
    iframe.src = `/api/applications/export?number=${encodeURIComponent(number)}`;
}

/**
 * Экспортирует все заявки в Excel файл
 * Открывает новую вкладку для скачивания файла
 */
export function exportAllToExcel() {
    window.open('/api/applications/export', '_blank');
}

/**
 * Экспортирует результаты фильтра по дате
 * @param {string} date - Дата для экспорта
 * @param {string} fileNameSuffix - Суффикс для имени файла
 */
export function exportDateFilterResults(date, fileNameSuffix) {
    const fileName = `applications_${fileNameSuffix}.xlsx`;
    const url = `/api/applications/export/date/${date}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Экспортирует результаты поиска в Excel файл
 * Создает временную форму для отправки данных на сервер
 */
export function exportSearchResults() {
    if (state.searchResults.length === 0) {
        showTempMessage('Нет результатов для экспорта', 'warning');
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/search';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'searchResults';
    input.value = JSON.stringify(state.searchResults.map(app => app.id));
    form.appendChild(input);

    const searchTerm = document.getElementById('searchAllTable').value.trim();
    const searchNameInput = document.createElement('input');
    searchNameInput.type = 'hidden';
    searchNameInput.name = 'searchName';
    searchNameInput.value = searchTerm || 'Результаты поиска';
    form.appendChild(searchNameInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}