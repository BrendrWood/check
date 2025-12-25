// applications.js - JavaScript логика для страницы заявок

// ============================================
// ДЕРЕВО НАРУШЕНИЙ (константа)
// ============================================

const issuesTree = {
    "документация": {
        "АВР": [
            "нет акта выполненных работ",
            "в акте выполненных работ нет подписи клиента"
        ],
        "фото объекта": [
            "нет фото объекта",
            "нет фото окон объекта",
            "окна объекта на фото не выделены рамками",
            "нет фото кпп",
            "нет фото шлагбаума",
            "нет фото входа в подъезд"
        ],
        "фото оборудования": [
            "нет фото установленного оборудования",
            "нет фото контрольной панели",
            "нет фото контрольной панели открытой",
            "нет фото клавиатуры",
            "нет фото сим",
            "нет фото датчиков",
            "приложены фото _ датчиков из _ установленных"
        ],
        "поэтажный план": [
            "нет поэтажного плана",
            "нет нумерации зон на поэтажном плане",
            "на поэтажном плане отражены не все датчики",
            "нет клавиатуры на поэтажном плане",
            "нет контрольной панели на поэтажном плане",
            "не отражена клавиатура и контрольная панель на поэтажном плане"
        ],
        "форма 002": [
            "нет формы 002",
            "нет ориентиров в форме 002",
            "не полностью заполнен адрес в форме 002",
            "отражены не все датчики в форме 002",
            "нет датчиков в форме 002",
            "нарушен порядок датчиков в форме 002",
            "неверные координаты в форме 002",
            "не открывается файл формы 002 (некорректный формат документв"
        ],
        "пуд и договор охраны": [
            "нет пуд",
            "нет договора охраны",
            "пуд на другого человека",
            "нет правообладателя в пуд",
            "нет подписи клиента в договоре охраны",
            "нет подписи клиента в заявлении на оказании услуг",
            "договор охраны на другого человека",
            "нет подписи сторон в договоре аренды",
            "нет документа о смене фамилии клиента"
        ],
        "подъездные пути": [
            "нет фото объекта на карте со схемой подъездных путей",
            "нет схемы подъездных путей на фото объекта на карте",
            "нет фото объекта на карте (отдаленного)",
            "нет фото объекта на карте (приближенного)",
            "фото объекта на карте не соответствует координатам из формы 002",
            "неверные координаты в форме 002"
        ]
    },
    "монтаж": {
        "датчики движения": [
            "датчик движения направлен на лестницу (на объекте питомец)",
            "необходимо вынести датчик движения из-за шторы",
            "датчик движения установлен над дверным проемом",
            "датчик движения установлен под прямыми солнечными лучами",
            "датчик движения установлен низко",
            "датчик движения установлен высоко"
        ],
        "датчики дыма": [
            "датчик дыма установлен в парилке",
            "датчик дыма установлен в положении между этажами",
            "датчик дыма установлен вплотную в углу стены и потолка"
        ],
        "уровень связи": [
            "нет фото уровня связи (GSM)",
            "нет фото уровня связи датчиков с КП",
            "просадки GSM ниже -90",
            "низкий уровень WI-FI",
            "низкий уровень GSM",
            "поступил сигнал NSR",
            "ошибки связи в истории панели"
        ],
        "тестирование": [
            "нет сработок датчиков дыма",
            "нет сработки датчика зоны 0"
        ],
        "контрольная панель": [
            "контрольная панель установлена во входной задержке",
            "контрольная панель не закреплена"
        ]
    },
    "другое": [
        "нет информации о наклейке",
        "публичное наименование в заявке не соответствует вывеске",
        "доки ок",
        "доки позже"
    ]
};

// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

let selectedIssues = new Set(); // Множество выбранных нарушений
let issuesTreeInitialized = false; // Флаг инициализации дерева

// ============================================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ДЕРЕВОМ НАРУШЕНИЙ
// ============================================

// Инициализация дерева нарушений
function initIssuesTree() {
    if (issuesTreeInitialized) return;

    const container = document.getElementById('issuesTreeContainer');
    container.innerHTML = '';

    for (const category in issuesTree) {
        // Контейнер категории
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-3';

        // Заголовок категории
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <i class="bi bi-chevron-right collapse-icon"></i>
            <span>${category}</span>
        `;

        // Контент категории
        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        categoryContent.style.display = 'none';

        // Проверяем тип данных (объект или массив)
        if (typeof issuesTree[category] === 'object' && !Array.isArray(issuesTree[category])) {
            // Есть подкатегории
            for (const subCategory in issuesTree[category]) {
                // Подкатегория
                const subCategoryDiv = document.createElement('div');
                subCategoryDiv.className = 'mb-2';

                const subCategoryHeader = document.createElement('div');
                subCategoryHeader.className = 'subcategory-header';
                subCategoryHeader.innerHTML = `
                    <i class="bi bi-chevron-right collapse-icon" style="font-size: 0.8em;"></i>
                    <span>${subCategory}</span>
                `;

                const subCategoryContent = document.createElement('div');
                subCategoryContent.className = 'subcategory-content';
                subCategoryContent.style.display = 'none';

                // Кнопки для каждого нарушения в подкатегории
                issuesTree[category][subCategory].forEach(issue => {
                    const button = createIssueButton(issue);
                    subCategoryContent.appendChild(button);
                });

                // Обработчик клика на подкатегорию
                subCategoryHeader.addEventListener('click', function(e) {
                    if (e.target.tagName === 'BUTTON') return;

                    const icon = this.querySelector('.collapse-icon');
                    const content = this.nextElementSibling;
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        icon.classList.remove('bi-chevron-right');
                        icon.classList.add('bi-chevron-down');
                    } else {
                        content.style.display = 'none';
                        icon.classList.remove('bi-chevron-down');
                        icon.classList.add('bi-chevron-right');
                    }
                });

                subCategoryDiv.appendChild(subCategoryHeader);
                subCategoryDiv.appendChild(subCategoryContent);
                categoryContent.appendChild(subCategoryDiv);
            }
        } else {
            // Нет подкатегорий - просто кнопки
            issuesTree[category].forEach(issue => {
                const button = createIssueButton(issue);
                categoryContent.appendChild(button);
            });
        }

        // Обработчик клика на категорию
        categoryHeader.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') return;

            const icon = this.querySelector('.collapse-icon');
            const content = this.nextElementSibling;
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.classList.remove('bi-chevron-right');
                icon.classList.add('bi-chevron-down');
            } else {
                content.style.display = 'none';
                icon.classList.remove('bi-chevron-down');
                icon.classList.add('bi-chevron-right');
            }
        });

        categoryDiv.appendChild(categoryHeader);
        categoryDiv.appendChild(categoryContent);
        container.appendChild(categoryDiv);
    }

    issuesTreeInitialized = true;
    updateSelectedIssuesInfo();
}

// Создание кнопки нарушения
function createIssueButton(issueText) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'issue-button-tree';
    button.textContent = issueText;
    button.dataset.issue = issueText;

    // Проверяем, есть ли уже это нарушение в комментариях
    const commentsField = document.getElementById('commentsField');
    if (commentsField && commentsField.value.includes(issueText)) {
        button.classList.add('added');
        selectedIssues.add(issueText);
    }

    button.addEventListener('click', function() {
        toggleIssueSelection(issueText);
        updateSelectedIssuesInfo();
    });

    return button;
}

// Переключение выбора нарушений
function toggleIssueSelection(issueText) {
    const button = document.querySelector(`.issue-button-tree[data-issue="${issueText}"]`);

    if (selectedIssues.has(issueText)) {
        // Удаляем из выбранных
        selectedIssues.delete(issueText);
        button.classList.remove('added');
    } else {
        // Добавляем в выбранные
        selectedIssues.add(issueText);
        button.classList.add('added');
    }
}

// Обновить информацию о выбранных нарушениях
function updateSelectedIssuesInfo() {
    const selectedCount = selectedIssues.size;
    const infoElement = document.getElementById('selectedIssuesInfo');
    const countElement = document.getElementById('selectedCount');

    if (selectedCount > 0) {
        infoElement.style.display = 'block';
        countElement.textContent = selectedCount;
    } else {
        infoElement.style.display = 'none';
    }
}

// Добавить выбранные нарушения в комментарии
function addSelectedIssuesToComments() {
    if (selectedIssues.size === 0) {
        showMessage('Не выбрано ни одного нарушения', 'warning');
        return;
    }

    const commentsField = document.getElementById('commentsField');
    let currentComments = commentsField.value.trim();

    // Добавляем каждое выбранное нарушение
    selectedIssues.forEach(issue => {
        if (!currentComments.includes(issue)) {
            if (currentComments === '') {
                currentComments = issue;
            } else {
                currentComments += ', ' + issue;
            }
        }
    });

    commentsField.value = currentComments;

    // Закрываем модальное окно
    const modal = bootstrap.Modal.getInstance(document.getElementById('issuesTreeModal'));
    modal.hide();

    // Показываем сообщение об успехе
    showMessage(`Добавлено ${selectedIssues.size} нарушений в комментарии`, 'success');

    // Очищаем выбор
    clearSelectedIssues();
}

// Очистить выбранные нарушения
function clearSelectedIssues() {
    // Убираем выделение со всех кнопок
    const selectedButtons = document.querySelectorAll('.issue-button-tree.added');
    selectedButtons.forEach(button => {
        button.classList.remove('added');
    });

    // Очищаем множество
    selectedIssues.clear();

    // Обновляем информацию
    updateSelectedIssuesInfo();
}

// Поиск по нарушениям
function searchIssues() {
    const searchInput = document.getElementById('searchIssuesInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const issueButtons = document.querySelectorAll('.issue-button-tree');

    if (!searchTerm) {
        // Показываем все
        issueButtons.forEach(button => {
            button.style.display = 'block';
            // Показываем родителей
            showParents(button);
        });
        return;
    }

    let foundAny = false;
    issueButtons.forEach(button => {
        const issueText = button.textContent.toLowerCase();

        if (issueText.includes(searchTerm)) {
            button.style.display = 'block';
            foundAny = true;
            // Показываем всех родителей
            showParents(button);
        } else {
            button.style.display = 'none';
        }
    });

    if (!foundAny) {
        showMessageInModal('Нарушения не найдены', 'info');
    }
}

// Показать родителей элемента
function showParents(element) {
    let parent = element.parentElement;
    while (parent && parent !== document) {
        if (parent.classList.contains('issues-tree')) break;
        parent.style.display = 'block';
        if (parent.previousElementSibling &&
            (parent.previousElementSibling.classList.contains('category-header') ||
             parent.previousElementSibling.classList.contains('subcategory-header'))) {
            parent.previousElementSibling.style.display = 'flex';
            const icon = parent.previousElementSibling.querySelector('.collapse-icon');
            if (icon) {
                icon.classList.remove('bi-chevron-right');
                icon.classList.add('bi-chevron-down');
            }
        }
        parent = parent.parentElement;
    }
}

// Очистить поиск по нарушениям
function clearIssuesSearch() {
    const searchInput = document.getElementById('searchIssuesInput');
    searchInput.value = '';
    searchIssues();
    searchInput.focus();
}

// Развернуть все категории
function expandAllCategories() {
    const headers = document.querySelectorAll('.category-header, .subcategory-header');
    const contents = document.querySelectorAll('.category-content, .subcategory-content');

    headers.forEach(header => {
        const icon = header.querySelector('.collapse-icon');
        if (icon) {
            icon.classList.remove('bi-chevron-right');
            icon.classList.add('bi-chevron-down');
        }
    });

    contents.forEach(content => {
        content.style.display = 'block';
    });

    showMessageInModal('Все категории развернуты', 'info');
}

// Свернуть все категории
function collapseAllCategories() {
    const headers = document.querySelectorAll('.category-header, .subcategory-header');
    const contents = document.querySelectorAll('.category-content, .subcategory-content');

    headers.forEach(header => {
        const icon = header.querySelector('.collapse-icon');
        if (icon) {
            icon.classList.remove('bi-chevron-down');
            icon.classList.add('bi-chevron-right');
        }
    });

    contents.forEach(content => {
        content.style.display = 'none';
    });

    showMessageInModal('Все категории свернуты', 'info');
}

// Показать сообщение в модальном окне
function showMessageInModal(text, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    // Удаляем предыдущие сообщения
    const existingAlerts = document.querySelectorAll('#issuesTreeModal .alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show py-2 mt-2`;
    alertDiv.innerHTML = `
        <i class="bi bi-${icon}"></i> ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Добавляем в начало тела модального окна
    const modalBody = document.querySelector('#issuesTreeModal .modal-body');
    modalBody.insertBefore(alertDiv, modalBody.firstChild);

    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 3000);
}

// ============================================
// ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ
// ============================================

// Показать сообщение на основной странице
function showMessage(text, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show py-2 mt-2`;
    alertDiv.innerHTML = `
        <i class="bi bi-${icon}"></i> ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Добавляем перед формой
    const form = document.getElementById('applicationForm');
    const existingAlerts = form.parentNode.querySelectorAll('.alert:not(.alert-dismissible)');
    const firstExistingAlert = existingAlerts.length > 0 ? existingAlerts[existingAlerts.length - 1] : null;

    if (firstExistingAlert && firstExistingAlert.nextSibling) {
        form.parentNode.insertBefore(alertDiv, firstExistingAlert.nextSibling);
    } else {
        form.parentNode.insertBefore(alertDiv, form);
    }

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}

// Функция экспорта одной заявки
function exportSingle() {
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

// Функция для показа временных сообщений
function showTempMessage(text, type) {
    // Создаем контейнер для сообщений, если его нет
    let messageContainer = document.getElementById('tempMessageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'tempMessageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(messageContainer);
    }

    // Создаем сообщение
    const message = document.createElement('div');
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info';
    message.className = `alert alert-${alertClass} alert-dismissible fade show`;
    message.innerHTML = `
        <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${text}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    // Добавляем в контейнер
    messageContainer.appendChild(message);

    // Удаляем через 5 секунд
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

// Загрузка заявки по клику
function loadApplication(element) {
    const number = element.getAttribute('data-number');
    if (number && number !== 'null' && number !== '') {
        // Сохраняем номер заявки для поиска
        document.getElementById('searchInput').value = number;
        const form = document.getElementById('searchForm');
        if (form) {
            form.submit();
        }
    }
}

// Автодополнение для поля "Причина проблем с интернетом"
function setupAutocomplete() {
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
        "Подключен"
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

// ПОИСК В СПИСКЕ ЗАЯВОК
function searchInList() {
    const searchInput = document.getElementById('searchListInput');
    const searchTerm = searchInput.value.trim();
    const appItems = document.querySelectorAll('.application-item');
    const searchInfo = document.getElementById('searchListInfo');
    const applicationsCount = document.getElementById('applicationsCount');

    if (!searchTerm) {
        clearListSearch();
        return;
    }

    let foundCount = 0;
    let foundItem = null;

    // Ищем заявку по точному номеру
    appItems.forEach(item => {
        const number = item.getAttribute('data-number');

        if (number === searchTerm) {
            item.classList.remove('hidden');
            item.classList.add('highlighted');
            foundCount++;
            foundItem = item;
        } else {
            item.classList.add('hidden');
            item.classList.remove('highlighted');
        }
    });

    if (foundCount > 0) {
        // Показываем информацию о найденной заявке
        searchInfo.style.display = 'block';
        searchInfo.innerHTML = `Найдена 1 заявка. <a href="#" onclick="clearListSearch()" class="text-primary">Показать все</a>`;

        // Обновляем счетчик
        applicationsCount.textContent = '1';

        // Прокручиваем к найденной заявке
        if (foundItem) {
            foundItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        // Если не найдено
        searchInfo.style.display = 'block';
        searchInfo.innerHTML = `Заявка с номером "${searchTerm}" не найдена. <a href="#" onclick="clearListSearch()" class="text-primary">Показать все</a>`;

        // Обновляем счетчик
        applicationsCount.textContent = '0';
    }
}

function clearListSearch() {
    const searchInput = document.getElementById('searchListInput');
    const appItems = document.querySelectorAll('.application-item');
    const searchInfo = document.getElementById('searchListInfo');
    const applicationsCount = document.getElementById('applicationsCount');
    const totalCount = appItems.length;

    // Очищаем поле поиска
    searchInput.value = '';

    // Показываем все заявки
    appItems.forEach(item => {
        item.classList.remove('hidden');
        item.classList.remove('highlighted');
    });

    // Скрываем информацию о поиске
    searchInfo.style.display = 'none';

    // Восстанавливаем счетчик
    applicationsCount.textContent = totalCount;

    // Фокусируемся на поле поиска
    searchInput.focus();
}

// Вспомогательная функция для экранирования спецсимволов в регулярках
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Открытие модального окна с деревом нарушений
    document.getElementById('openIssuesTreeBtn').addEventListener('click', function() {
        // Инициализируем дерево если еще не инициализировано
        initIssuesTree();

        // Проверяем текущие нарушения в комментариях
        const commentsField = document.getElementById('commentsField');
        if (commentsField) {
            const currentComments = commentsField.value;

            // Очищаем текущий выбор
            clearSelectedIssues();

            // Помечаем кнопки нарушений, которые уже есть в комментариях
            const issueButtons = document.querySelectorAll('.issue-button-tree');
            issueButtons.forEach(button => {
                const issueText = button.dataset.issue;
                if (currentComments.includes(issueText)) {
                    button.classList.add('added');
                    selectedIssues.add(issueText);
                }
            });

            updateSelectedIssuesInfo();
        }

        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('issuesTreeModal'));
        modal.show();
    });

    // Очистка выбранных нарушений при закрытии модального окна
    document.getElementById('issuesTreeModal').addEventListener('hidden.bs.modal', function() {
        clearSelectedIssues();
    });

    // Поиск по нарушениям при нажатии Enter
    document.getElementById('searchIssuesInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchIssues();
            e.preventDefault();
        }
    });

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

    // Автоматически закрываем уведомления через 5 секунд
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

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

    // Инициализация автодополнения
    setupAutocomplete();

    // Поиск при нажатии Enter в поле поиска списка
    document.getElementById('searchListInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchInList();
            e.preventDefault();
        }
    });
});