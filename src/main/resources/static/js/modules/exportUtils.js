// ============================================
// УТИЛИТЫ ЭКСПОРТА
// Вспомогательные функции для скачивания файлов
// ============================================

import { showTempMessage } from './ui.js';

/**
 * Универсальная функция для скачивания файла через скрытый iframe
 * @param {string} url - URL для скачивания файла
 * @param {string} filename - Имя файла для сохранения
 */
export function downloadFile(url, filename) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.name = 'downloadFrame_' + Date.now();

    iframe.onload = function() {
        setTimeout(() => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const bodyText = iframeDoc.body ? iframeDoc.body.textContent || iframeDoc.body.innerText : '';

                if (bodyText.includes('Ошибка') ||
                    bodyText.includes('Нет заявок') ||
                    bodyText.includes('Неверный формат')) {

                    showTempMessage(`Ошибка: ${bodyText.substring(0, 100)}`, 'error');
                } else {
                    showTempMessage('Файл успешно скачан', 'success');
                }
            } catch (e) {
                showTempMessage('Файл скачан', 'success');
            }

            setTimeout(() => {
                if (iframe.parentNode) {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 2000);
        }, 1000);
    };

    iframe.onerror = function() {
        console.error('Ошибка загрузки файла');
        showTempMessage('Ошибка при загрузке файла', 'error');

        setTimeout(() => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 1000);
    };

    document.body.appendChild(iframe);

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Загрузка файла</title>
            <meta http-equiv="refresh" content="0; url=${url}">
        </head>
        <body>
            <p>Загрузка файла... Если загрузка не началась, <a href="${url}" download="${filename}">нажмите здесь</a>.</p>
        </body>
        </html>
    `;

    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
}

/**
 * Экспортирует заявки по дате через POST запрос
 * Используется для обхода проблем с загрузкой файлов
 * @param {string} date - Дата для экспорта
 */
export function exportByDateViaPost(date) {
    if (!date) {
        showTempMessage('Дата не указана', 'error');
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/date';
    form.style.display = 'none';
    form.target = '_blank';

    const dateInput = document.createElement('input');
    dateInput.type = 'hidden';
    dateInput.name = 'date';
    dateInput.value = date;
    form.appendChild(dateInput);

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = Date.now();
    form.appendChild(tokenInput);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
        showTempMessage('Загрузка файла началась', 'info');
    }, 1000);
}

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
    window.downloadFile = downloadFile;
    window.exportByDateViaPost = exportByDateViaPost;
}