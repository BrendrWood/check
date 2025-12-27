// ============================================
// МОДУЛЬ ОБРАБОТЧИКОВ ФОРМ И ПОЛЕЙ
// ============================================

import { state, SELECTORS, CSS_CLASSES } from '../config.js';
import { showCopyNotification, showTempMessage } from './ui.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Настройка обработчиков формы
 */
export function setupFormHandlers() {
    // Мастер-чекбокс
    const masterCheck = document.getElementById('masterCheck');
    if (masterCheck) {
        masterCheck.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });
    }

    // Обработка кликов по чекбоксам
    const checkboxes = document.querySelectorAll('.checkbox-group .form-check');
    checkboxes.forEach(checkbox => {
        const label = checkbox.querySelector('.form-check-label');
        const input = checkbox.querySelector('.form-check-input');

        if (label && input) {
            label.addEventListener('click', function(e) {
                input.checked = !input.checked;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
                e.preventDefault();
            });

            input.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });

    // Обработка кликов по радиокнопкам резолюции
    const radioLabels = document.querySelectorAll('[for^="resolution"]');
    radioLabels.forEach(label => {
        label.addEventListener('click', function(e) {
            const inputId = this.getAttribute('for');
            const input = document.getElementById(inputId);
            if (input) {
                input.checked = true;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });

    // Обработчик для кнопки копирования комментариев
    const copyButton = document.getElementById('copyCommentsBtn');
    if (copyButton) {
        copyButton.addEventListener('mouseenter', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }
        });

        copyButton.addEventListener('mouseleave', function() {
            if (!this.disabled) {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            }
        });
    }
}

/**
 * Копирование комментариев в буфер обмена
 */
export function copyCommentsToClipboard() {
    const commentsField = document.getElementById('commentsField');
    if (!commentsField) return;

    const comments = commentsField.value.trim();

    if (!comments) {
        showCopyNotification('Нет комментариев для копирования', 'error');
        return;
    }

    // Используем современный Clipboard API
    navigator.clipboard.writeText(comments)
        .then(() => {
            // Успешное копирование
            showCopyNotification('Комментарии скопированы в буфер обмена');

            // Временно меняем текст кнопки
            const copyButton = document.getElementById('copyCommentsBtn');
            if (copyButton) {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="bi bi-check-circle"></i> Скопировано!';
                copyButton.disabled = true;

                // Восстанавливаем кнопку через 2 секунды
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.disabled = false;
                }, 2000);
            }
        })
        .catch(err => {
            // Fallback для старых браузеров
            console.error('Ошибка копирования: ', err);

            // Используем старый метод с textarea
            const textArea = document.createElement('textarea');
            textArea.value = comments;
            document.body.appendChild(textArea);
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopyNotification('Комментарии скопированы в буфер обмена');
                } else {
                    showCopyNotification('Не удалось скопировать комментарии', 'error');
                }
            } catch (err) {
                showCopyNotification('Не удалось скопировать комментарии', 'error');
            }

            document.body.removeChild(textArea);
        });
}

/**
 * Заполнить форму данными заявки
 */
export function fillFormWithApplication(app) {
    if (!app) return;

    // Основные поля
    document.getElementById('appId').value = app.id || '';
    document.getElementById('appNumberField').value = app.applicationNumber || '';

    const engineerField = document.querySelector('[name="engineer"]');
    if (engineerField) engineerField.value = app.engineer || '';

    const gsmField = document.querySelector('[name="gsmLevel"]');
    if (gsmField) gsmField.value = app.gsmLevel || '';

    const internetField = document.querySelector('[name="internetLevel"]');
    if (internetField) internetField.value = app.internetLevel || '';

    document.getElementById('internetReason').value = app.internetReason || '';

    const installationField = document.querySelector('[name="installationDate"]');
    if (installationField) installationField.value = app.installationDate || '';

    const inspectorField = document.querySelector('[name="inspector"]');
    if (inspectorField) inspectorField.value = app.inspector || '';

    document.getElementById('commentsField').value = app.comments || '';

    // Чекбоксы
    const checkboxes = [
        'mpkInstalled', 'highCeiling', 'sensorConnectLevel', 'animals',
        'nightMode', 'sensorsOk', 'label', 'avr', 'systemPhoto',
        'floorPlan', 'secondForm', 'docs', 'roadMap', 'publicName', 'checkList'
    ];

    checkboxes.forEach(name => {
        const checkbox = document.querySelector(`[name="${name}"]`);
        if (checkbox) {
            checkbox.checked = app[name] === true;
        }
    });

    // Радиокнопки резолюции
    if (app.resolution === true || app.resolution === 'true') {
        document.getElementById('resolutionOk').checked = true;
    } else {
        document.getElementById('resolutionNok').checked = true;
    }
}

/**
 * Настройка автодополнения для поля "Причина проблем с интернетом"
 */
export function setupAutocomplete() {
    const input = document.getElementById('internetReason');
    const autocompleteContainer = document.getElementById('internetReasonAutocomplete');

    if (!input || !autocompleteContainer) return;

    let usedReasons = new Set();
    const reasonElements = document.querySelectorAll('[name="internetReason"]');
    reasonElements.forEach(el => {
        if (el.value && el.value.trim()) {
            usedReasons.add(el.value.trim());
        }
    });

    const defaultReasons = [
        "Нет на объекте",
        "Слабый сигнал Wi-Fi",
        "Частота передатчика роутера несовместима с частотой приемника КП",
        "Клиент забыл оптатить",
        "Клиент не помнит пароль",
        "Клиент недавно переехал на объект",
        "Проблема с контрольной панелью",
        "Невозможно",
        "Нет питания",
        "Проблемы с модемом",
        "Подключен",
        "Проводной"
    ];

    defaultReasons.forEach(reason => usedReasons.add(reason));

    // Обработчик ввода текста
    input.addEventListener('input', function(e) {
        const value = this.value.toLowerCase();
        closeAllLists();

        if (!value) return;

        autocompleteContainer.innerHTML = '';

        // Фильтруем и сортируем варианты
        const filteredReasons = Array.from(usedReasons)
            .filter(reason => reason.toLowerCase().includes(value))
            .sort((a, b) => {
                // Сначала показываем варианты, которые начинаются с искомого текста
                const aStartsWith = a.toLowerCase().startsWith(value);
                const bStartsWith = b.toLowerCase().startsWith(value);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;
                return a.localeCompare(b);
            });

        // Ограничиваем количество отображаемых вариантов
        const displayLimit = 5;
        const displayReasons = filteredReasons.slice(0, displayLimit);

        if (displayReasons.length === 0) {
            return;
        }

        displayReasons.forEach(reason => {
            const div = document.createElement('div');

            // Подсветка найденного текста
            const regex = new RegExp(`(${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const highlightedText = reason.replace(regex, '<strong>$1</strong>');

            div.innerHTML = highlightedText;
            div.addEventListener('click', function() {
                input.value = reason;
                closeAllLists();
            });
            autocompleteContainer.appendChild(div);
        });

        autocompleteContainer.style.display = 'block';

        // Показываем сообщение если вариантов больше лимита
        if (filteredReasons.length > displayLimit) {
            const moreDiv = document.createElement('div');
            moreDiv.innerHTML = `<em>и еще ${filteredReasons.length - displayLimit} вариантов...</em>`;
            moreDiv.style.fontSize = '0.8em';
            moreDiv.style.color = '#6c757d';
            moreDiv.style.fontStyle = 'italic';
            moreDiv.style.padding = '8px';
            moreDiv.style.cursor = 'default';
            autocompleteContainer.appendChild(moreDiv);
        }
    });

    // Обработчик клавиш для навигации по подсказкам
    input.addEventListener('keydown', function(e) {
        const items = autocompleteContainer.querySelectorAll('div');
        let activeItem = autocompleteContainer.querySelector('.autocomplete-active');

        if (!items.length) return;

        // Клавиша вниз
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!activeItem) {
                items[0].classList.add('autocomplete-active');
            } else {
                activeItem.classList.remove('autocomplete-active');
                if (activeItem.nextElementSibling) {
                    activeItem.nextElementSibling.classList.add('autocomplete-active');
                } else {
                    items[0].classList.add('autocomplete-active');
                }
            }
        }

        // Клавиша вверх
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!activeItem) {
                items[items.length - 1].classList.add('autocomplete-active');
            } else {
                activeItem.classList.remove('autocomplete-active');
                if (activeItem.previousElementSibling) {
                    activeItem.previousElementSibling.classList.add('autocomplete-active');
                } else {
                    items[items.length - 1].classList.add('autocomplete-active');
                }
            }
        }

        // Enter или Tab
        if ((e.key === 'Enter' || e.key === 'Tab') && activeItem) {
            e.preventDefault();
            input.value = activeItem.textContent;
            closeAllLists();
        }

        // Esc
        if (e.key === 'Escape') {
            closeAllLists();
        }
    });

    function closeAllLists() {
        autocompleteContainer.style.display = 'none';
        autocompleteContainer.innerHTML = '';
    }

    // Закрываем подсказки при клике вне поля
    document.addEventListener('click', function(e) {
        if (!autocompleteContainer.contains(e.target) && e.target !== input) {
            closeAllLists();
        }
    });
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Экспорт функций для глобального доступа
export function loadApplication(element) {
    const number = element.getAttribute('data-number');
    if (number && number !== 'null' && number !== '') {
        document.getElementById('searchInput').value = number;
        const form = document.getElementById('searchForm');
        if (form) {
            form.submit();
        }
    }
}

// Добавляем функцию в глобальную область видимости
if (typeof window !== 'undefined') {
    window.loadApplication = loadApplication;
}