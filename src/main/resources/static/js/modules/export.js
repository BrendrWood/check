// ============================================
// МОДУЛЬ ЭКСПОРТА И ЗАГРУЗКИ ДАННЫХ
// ============================================

import { state, MESSAGES } from '../config.js';
import { showTempMessage } from './ui.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Экспорт одной заявки
 */
export function exportSingle() {
    const numberInput = document.getElementById('exportNumber');
    const number = numberInput.value.trim();

    if (!number) {
        // Подсвечиваем поле и меняем placeholder
        numberInput.classList.add('is-invalid');
        const originalPlaceholder = numberInput.placeholder;
        numberInput.placeholder = 'Введите номер!';

        // Восстанавливаем через 3 секунды
        setTimeout(() => {
            numberInput.placeholder = originalPlaceholder;
            numberInput.classList.remove('is-invalid');
        }, 3000);
        return;
    }

    // Показываем состояние загрузки на кнопке
    const exportButton = document.querySelector('[onclick="exportSingle()"]');
    const originalButtonHTML = exportButton.innerHTML;
    exportButton.innerHTML = '<i class="bi bi-hourglass-split"></i>';
    exportButton.disabled = true;

    // Создаем скрытый iframe для скачивания
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.name = 'exportFrame_' + Date.now();

    // Обработчик загрузки iframe
    iframe.onload = function() {
        // Восстанавливаем кнопку
        exportButton.innerHTML = originalButtonHTML;
        exportButton.disabled = false;

        // Ждем немного, чтобы iframe успел обработать контент
        setTimeout(() => {
            try {
                // Пытаемся получить содержимое iframe
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const bodyText = iframeDoc.body ? iframeDoc.body.textContent || iframeDoc.body.innerText : '';

                // Проверяем, не вернул ли сервер сообщение об ошибке
                if (bodyText.includes('Заявки не найдены') ||
                    bodyText.includes('Нет заявок') ||
                    bodyText.trim() === 'Заявки не найдены') {

                    // Заявка не найдена - подсвечиваем поле
                    numberInput.classList.add('is-invalid');
                    const originalPlaceholder = numberInput.placeholder;
                    numberInput.placeholder = 'Заявка не найдена!';
                    numberInput.value = '';

                    // Восстанавливаем через 3 секунды
                    setTimeout(() => {
                        numberInput.placeholder = originalPlaceholder;
                        numberInput.classList.remove('is-invalid');
                    }, 3000);

                    // Показываем всплывающее сообщение
                    showTempMessage('Заявка не найдена', 'error');
                } else {
                    // Файл скачан успешно - показываем сообщение об успехе
                    showTempMessage('Файл скачан успешно', 'success');
                    numberInput.value = '';
                }
            } catch (e) {
                // Если возникла ошибка доступа (скорее всего файл скачан)
                // Показываем сообщение об успехе
                showTempMessage('Файл скачан успешно', 'success');
                numberInput.value = '';
            }

            // Удаляем iframe через секунду
            setTimeout(() => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 1000);
        }, 500);
    };

    // Обработчик ошибок iframe
    iframe.onerror = function() {
        exportButton.innerHTML = originalButtonHTML;
        exportButton.disabled = false;
        showTempMessage('Ошибка при скачивании', 'error');

        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    };

    // Добавляем iframe в DOM и начинаем загрузку
    document.body.appendChild(iframe);
    iframe.src = `/api/applications/export?number=${encodeURIComponent(number)}`;
}

/**
 * Экспорт всех заявок
 */
export function exportAllToExcel() {
    // Используем существующий endpoint
    window.open('/api/applications/export', '_blank');
}

/**
 * Экспорт результатов фильтра по дате
 */
export function exportDateFilterResults(date, fileNameSuffix) {
    const fileName = `applications_${fileNameSuffix}.xlsx`;
    const url = `/api/applications/export/date/${date}`;

    // Создаем скрытую ссылку для скачивания
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Экспорт результатов поиска
 */
export function exportSearchResults() {
    if (state.searchResults.length === 0) {
        showTempMessage('Нет результатов для экспорта', 'warning');
        return;
    }

    // Создаем временный скрытый форму для отправки данных
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/search';
    form.style.display = 'none';

    // Добавляем данные поиска
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'searchResults';
    input.value = JSON.stringify(state.searchResults.map(app => app.id));
    form.appendChild(input);

    // Добавляем название поиска
    const searchTerm = document.getElementById('searchAllTable').value.trim();
    const searchNameInput = document.createElement('input');
    searchNameInput.type = 'hidden';
    searchNameInput.name = 'searchName';
    searchNameInput.value = searchTerm || 'Результаты поиска';
    form.appendChild(searchNameInput);

    // Добавляем форму на страницу и отправляем
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}