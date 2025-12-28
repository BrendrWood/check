// ============================================
// МОДУЛЬ ДЕРЕВА НАРУШЕНИЙ
// ============================================

import { state, SELECTORS, MESSAGES, CSS_CLASSES, ISSUES_TREE_CONFIG } from '../config.js';
import { showMessageInModal, showMessage } from './ui.js';

// ============================================
// КОНСТАНТА ДЕРЕВА НАРУШЕНИЙ
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
        "физ. лицо",
        "юр. лицо",
        "нет информации о наклейке",
        "публичное наименование в заявке не соответствует вывеске",
        "не указана причина, по которой не подключен интернет",
        "доки ок",
        "доки позже"
    ]
};

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Инициализация дерева нарушений
 */
export function initIssuesTree() {
    if (state.issuesTreeInitialized) return;

    const container = document.getElementById('issuesTreeContainer');
    if (!container) return;

    container.innerHTML = '';

    for (const category in issuesTree) {
        // Контейнер категории
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-3';

        // Заголовок категории
        const categoryHeader = document.createElement('div');
        categoryHeader.className = ISSUES_TREE_CONFIG.CATEGORY_HEADER_CLASS;
        categoryHeader.innerHTML = `
            <i class="bi bi-chevron-right ${ISSUES_TREE_CONFIG.COLLAPSE_ICON_CLASS}"></i>
            <span>${category}</span>
        `;

        // Контент категории
        const categoryContent = document.createElement('div');
        categoryContent.className = ISSUES_TREE_CONFIG.CATEGORY_CONTENT_CLASS;
        categoryContent.style.display = 'none';

        // Проверяем тип данных (объект или массив)
        if (typeof issuesTree[category] === 'object' && !Array.isArray(issuesTree[category])) {
            // Есть подкатегории
            for (const subCategory in issuesTree[category]) {
                // Подкатегория
                const subCategoryDiv = document.createElement('div');
                subCategoryDiv.className = 'mb-2';

                const subCategoryHeader = document.createElement('div');
                subCategoryHeader.className = ISSUES_TREE_CONFIG.SUBCATEGORY_HEADER_CLASS;
                subCategoryHeader.innerHTML = `
                    <i class="bi bi-chevron-right ${ISSUES_TREE_CONFIG.COLLAPSE_ICON_CLASS}" style="font-size: 0.8em;"></i>
                    <span>${subCategory}</span>
                `;

                const subCategoryContent = document.createElement('div');
                subCategoryContent.className = ISSUES_TREE_CONFIG.SUBCATEGORY_CONTENT_CLASS;
                subCategoryContent.style.display = 'none';

                // Кнопки для каждого нарушения в подкатегории
                issuesTree[category][subCategory].forEach(issue => {
                    const button = createIssueButton(issue);
                    subCategoryContent.appendChild(button);
                });

                // Обработчик клика на подкатегорию
                subCategoryHeader.addEventListener('click', function(e) {
                    if (e.target.tagName === 'BUTTON') return;
                    toggleCategory(this, subCategoryContent);
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
            toggleCategory(this, categoryContent);
        });

        categoryDiv.appendChild(categoryHeader);
        categoryDiv.appendChild(categoryContent);
        container.appendChild(categoryDiv);
    }

    state.issuesTreeInitialized = true;
    updateSelectedIssuesInfo();
}

/**
 * Создание кнопки нарушения
 */
function createIssueButton(issueText) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = ISSUES_TREE_CONFIG.ISSUE_BUTTON_CLASS;
    button.textContent = issueText;
    button.dataset.issue = issueText;

    // Проверяем, есть ли уже это нарушение в комментариях
    const commentsField = document.getElementById('commentsField');
    if (commentsField && commentsField.value.includes(issueText)) {
        button.classList.add(CSS_CLASSES.ADDED);
        state.selectedIssues.add(issueText);
    }

    button.addEventListener('click', function() {
        toggleIssueSelection(issueText);
    });

    return button;
}

/**
 * Переключение выбора нарушения
 */
function toggleIssueSelection(issueText) {
    const button = document.querySelector(`.${ISSUES_TREE_CONFIG.ISSUE_BUTTON_CLASS}[data-issue="${issueText}"]`);
    if (!button) return;

    if (state.selectedIssues.has(issueText)) {
        // Удаляем из выбранных
        state.selectedIssues.delete(issueText);
        button.classList.remove(CSS_CLASSES.ADDED);
    } else {
        // Добавляем в выбранные
        state.selectedIssues.add(issueText);
        button.classList.add(CSS_CLASSES.ADDED);
    }
    updateSelectedIssuesInfo();
}

/**
 * Обновить информацию о выбранных нарушениях
 */
export function updateSelectedIssuesInfo() {
    const selectedCount = state.selectedIssues.size;
    const infoElement = document.getElementById('selectedIssuesInfo');
    const countElement = document.getElementById('selectedCount');

    if (!infoElement || !countElement) return;

    if (selectedCount > 0) {
        infoElement.style.display = 'block';
        countElement.textContent = selectedCount;
    } else {
        infoElement.style.display = 'none';
    }
}

/**
 * Добавить выбранные нарушения в комментарии
 */
export function addSelectedIssuesToComments() {
    const commentsField = document.getElementById('commentsField');
    if (!commentsField) {
        console.error('Поле комментариев не найдено');
        return;
    }

    if (state.selectedIssues.size === 0) {
        showMessageInModal('Не выбрано ни одного нарушения', 'warning');
        return;
    }

    // Получаем текст выбранных нарушений
    const issuesText = Array.from(state.selectedIssues)
        .map(issueText => issueText.trim())
        .filter(text => text.length > 0)
        .join(', ');

    if (!issuesText) {
        showMessageInModal('Не удалось получить текст нарушений', 'error');
        return;
    }

    // Получаем текущие комментарии
    let currentComments = commentsField.value.trim();

    // Подготавливаем новые комментарии
    let newComments = '';

    if (currentComments) {
        // Если уже есть комментарии, добавляем через запятую
        // Удаляем лишние запятые в конце текущих комментариев
        currentComments = currentComments.replace(/,\s*$/, '');

        // Проверяем последний символ
        const lastChar = currentComments[currentComments.length - 1];
        if (lastChar === '.' || lastChar === ',') {
            newComments = currentComments + ' ' + issuesText;
        } else {
            newComments = currentComments + ', ' + issuesText;
        }
    } else {
        newComments = issuesText;
    }

    // Обновляем поле комментариев
    commentsField.value = newComments;

    // Закрываем модальное окно
    const modalElement = document.getElementById('issuesTreeModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }

    // Показываем сообщение
    showMessage(`Добавлено ${state.selectedIssues.size} нарушений в комментарии`, 'success');

    // Очищаем выбранные нарушения
    clearSelectedIssues();
}

/**
 * Очистить выбранные нарушения
 */
export function clearSelectedIssues() {
    // Убираем выделение со всех кнопок
    const selectedButtons = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.ISSUE_BUTTON_CLASS}.${CSS_CLASSES.ADDED}`);
    selectedButtons.forEach(button => {
        button.classList.remove(CSS_CLASSES.ADDED);
    });

    // Очищаем множество
    state.selectedIssues.clear();

    // Обновляем информацию
    updateSelectedIssuesInfo();

    // Показываем сообщение в модальном окне
    showMessageInModal('Выбор нарушений очищен', 'info');
}

/**
 * Поиск по нарушениям
 */
export function searchIssues() {
    const searchInput = document.getElementById('searchIssuesInput');
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        clearIssuesSearch();
        return;
    }

    const issueButtons = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.ISSUE_BUTTON_CLASS}`);
    const allCategories = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.CATEGORY_CONTENT_CLASS}, .${ISSUES_TREE_CONFIG.SUBCATEGORY_CONTENT_CLASS}`);
    const allHeaders = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.CATEGORY_HEADER_CLASS}, .${ISSUES_TREE_CONFIG.SUBCATEGORY_HEADER_CLASS}`);

    // Сначала скрываем всё
    allCategories.forEach(content => content.style.display = 'none');
    allHeaders.forEach(header => header.style.display = 'none');
    issueButtons.forEach(button => {
        button.style.display = 'none';
        button.classList.remove('highlighted');
    });

    let foundCount = 0;

    // Ищем и показываем совпадения
    issueButtons.forEach(button => {
        const issueText = button.textContent.toLowerCase();

        if (issueText.includes(searchTerm)) {
            button.style.display = 'block';
            button.classList.add('highlighted');
            foundCount++;

            // Показываем родительские элементы
            showParentsOfElement(button);
        }
    });

    // Удаляем предыдущие сообщения о результатах
    const previousResults = document.querySelector('.search-results-info');
    if (previousResults) previousResults.remove();

    // Показываем сообщение с результатами
    if (foundCount > 0) {
        const resultsInfo = document.createElement('div');
        resultsInfo.className = 'search-results-info';
        resultsInfo.innerHTML = `
            <i class="bi bi-search"></i>
            Найдено нарушений: <strong>${foundCount}</strong>
            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="clearIssuesSearch()">
                <i class="bi bi-x-circle"></i> Очистить поиск
            </button>
        `;

        // Вставляем перед деревом
        const treeContainer = document.getElementById('issuesTreeContainer');
        if (treeContainer && treeContainer.parentNode) {
            treeContainer.parentNode.insertBefore(resultsInfo, treeContainer);
        }
    } else {
        // Если ничего не найдено
        showMessageInModal(`По запросу "${searchTerm}" нарушений не найдено`, 'info');
    }
}

/**
 * Показать родителей элемента
 */
function showParentsOfElement(element) {
    let parent = element.parentElement;
    while (parent && !parent.classList.contains('issues-tree')) {
        parent.style.display = 'block';

        // Показываем заголовок если он есть
        const header = parent.previousElementSibling;
        if (header && (header.classList.contains(ISSUES_TREE_CONFIG.CATEGORY_HEADER_CLASS) ||
                       header.classList.contains(ISSUES_TREE_CONFIG.SUBCATEGORY_HEADER_CLASS))) {
            header.style.display = 'flex';

            // Разворачиваем иконку
            const icon = header.querySelector(`.${ISSUES_TREE_CONFIG.COLLAPSE_ICON_CLASS}`);
            if (icon) {
                icon.classList.remove('bi-chevron-right');
                icon.classList.add('bi-chevron-down');
            }
        }

        parent = parent.parentElement;
    }
}

/**
 * Очистить поиск по нарушениям
 */
export function clearIssuesSearch() {
    const searchInput = document.getElementById('searchIssuesInput');
    if (!searchInput) return;

    searchInput.value = '';

    // Восстанавливаем полное дерево
    const allCategories = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.CATEGORY_CONTENT_CLASS}, .${ISSUES_TREE_CONFIG.SUBCATEGORY_CONTENT_CLASS}`);
    const allHeaders = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.CATEGORY_HEADER_CLASS}, .${ISSUES_TREE_CONFIG.SUBCATEGORY_HEADER_CLASS}`);
    const issueButtons = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.ISSUE_BUTTON_CLASS}`);

    allCategories.forEach(content => content.style.display = 'block');
    allHeaders.forEach(header => header.style.display = 'flex');
    issueButtons.forEach(button => button.style.display = 'block');

    // Убираем подсветку
    issueButtons.forEach(button => button.classList.remove('highlighted'));

    // Удаляем сообщение о результатах
    const resultsInfo = document.querySelector('.search-results-info');
    if (resultsInfo) resultsInfo.remove();

    searchInput.focus();
}

/**
 * Развернуть все категории
 */
export function expandAllCategories() {
    const contents = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.CATEGORY_CONTENT_CLASS}, .${ISSUES_TREE_CONFIG.SUBCATEGORY_CONTENT_CLASS}`);
    const icons = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.COLLAPSE_ICON_CLASS}`);

    contents.forEach(content => {
        content.style.display = 'block';
    });

    icons.forEach(icon => {
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-down');
    });

    showMessageInModal('Все категории развернуты', 'info');
}

/**
 * Свернуть все категории
 */
export function collapseAllCategories() {
    const contents = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.CATEGORY_CONTENT_CLASS}, .${ISSUES_TREE_CONFIG.SUBCATEGORY_CONTENT_CLASS}`);
    const icons = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.COLLAPSE_ICON_CLASS}`);

    contents.forEach(content => {
        content.style.display = 'none';
    });

    icons.forEach(icon => {
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-right');
    });

    showMessageInModal('Все категории свернуты', 'info');
}

/**
 * Настройка обработчиков для дерева нарушений
 */
export function setupIssuesTreeHandlers() {
    // Открытие модального окна с деревом нарушений
    const openIssuesTreeBtn = document.getElementById('openIssuesTreeBtn');
    if (openIssuesTreeBtn) {
        openIssuesTreeBtn.addEventListener('click', openIssuesTreeModal);
    }

    // Очистка выбранных нарушений при закрытии модального окна
    const issuesTreeModal = document.getElementById('issuesTreeModal');
    if (issuesTreeModal) {
        issuesTreeModal.addEventListener('hidden.bs.modal', function() {
            clearSelectedIssues();
        });
    }

    // Поиск по нарушениям при нажатии Enter
    const searchIssuesInput = document.getElementById('searchIssuesInput');
    if (searchIssuesInput) {
        searchIssuesInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchIssues();
                e.preventDefault();
            }
        });
    }
}

/**
 * Открытие модального окна дерева нарушений
 */
export function openIssuesTreeModal() {
    // Инициализируем дерево если еще не инициализировано
    initIssuesTree();

    // Проверяем текущие нарушения в комментариях
    const commentsField = document.getElementById('commentsField');
    if (commentsField) {
        const currentComments = commentsField.value;

        // Очищаем текущий выбор
        clearSelectedIssues();

        // Помечаем кнопки нарушений, которые уже есть в комментариях
        const issueButtons = document.querySelectorAll(`.${ISSUES_TREE_CONFIG.ISSUE_BUTTON_CLASS}`);
        issueButtons.forEach(button => {
            const issueText = button.dataset.issue;
            if (currentComments.includes(issueText)) {
                button.classList.add(CSS_CLASSES.ADDED);
                state.selectedIssues.add(issueText);
            }
        });

        updateSelectedIssuesInfo();
    }

    // Показываем модальное окно
    const modalElement = document.getElementById('issuesTreeModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Переключение категории (развернуть/свернуть)
 */
function toggleCategory(headerElement, contentElement) {
    const icon = headerElement.querySelector(`.${ISSUES_TREE_CONFIG.COLLAPSE_ICON_CLASS}`);
    if (contentElement.style.display === 'none') {
        contentElement.style.display = 'block';
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-down');
    } else {
        contentElement.style.display = 'none';
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-right');
    }
}

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ ДЛЯ ОБРАБОТЧИКОВ В HTML
// ============================================

if (typeof window !== 'undefined') {
    window.expandAllCategories = expandAllCategories;
    window.collapseAllCategories = collapseAllCategories;
    window.addSelectedIssuesToComments = addSelectedIssuesToComments;
    window.clearSelectedIssues = clearSelectedIssues;
    window.searchIssues = searchIssues;
    window.clearIssuesSearch = clearIssuesSearch;
    window.openIssuesTree = openIssuesTreeModal;
}