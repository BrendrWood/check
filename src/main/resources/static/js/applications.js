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
let allApplicationsCache = null; // Кэш всех заявок
let lastFetchTime = null; // Время последней загрузки
let autoRefreshInterval = null; // Интервал автообновления
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут кэширования

// Переменные для поиска
let searchResults = []; // Результаты поиска
let isSearchActive = false; // Флаг активного поиска

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
// ФУНКЦИИ ДЛЯ РАБОТЫ СО ВСЕМИ ЗАЯВКАМИ
// ============================================

// Загрузить последние заявки
async function loadRecentApplications() {
    try {
        const response = await fetch('/api/applications/recent?limit=20');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const applications = await response.json();
        updateRecentApplicationsList(applications);
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showMessage('Не удалось загрузить последние заявки', 'error');
    }
}

// Обновить список последних заявок
function updateRecentApplicationsList(applications) {
    const container = document.getElementById('applicationsList');
    if (!container) return;

    container.innerHTML = '';

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-inbox" style="font-size: 1.5rem;"></i>
                <p class="mt-1">Нет заявок</p>
            </div>
        `;
        return;
    }

    applications.forEach(app => {
        const appDiv = createApplicationItem(app);
        container.appendChild(appDiv);
    });

    // Обновить счетчик
    const countElement = document.getElementById('applicationsCount');
    if (countElement) {
        countElement.textContent = applications.length;
    }
}

// Создать элемент заявки для списка
function createApplicationItem(app) {
    const div = document.createElement('div');
    const isOk = app.resolution === true || app.resolution === 'true';

    div.innerHTML = `
        <div class="application-item clickable ${isOk ? 'application-ok' : 'application-nok'}"
             data-number="${app.applicationNumber || ''}"
             onclick="loadApplication(this)">
            <div class="d-flex justify-content-between align-items-center">
                <div style="line-height: 1.2;">
                    <div>
                        <strong class="app-number">${app.applicationNumber || 'Без номера'}</strong>
                        <span class="text-muted ms-2" style="font-size: 0.85em;">${app.engineer || ''}</span>
                    </div>
                    <div class="small text-muted">
                        ${app.installationDate || ''}
                        <span class="ms-2">${formatTime(app.lastUpdated)}</span>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1">
                    <span class="badge ${isOk ? 'bg-success' : 'bg-danger'}">
                        ${isOk ? 'OK' : 'NOK'}
                    </span>
                    <button type="button" class="btn btn-sm btn-outline-danger ms-1"
                            onclick="deleteApplication(${app.id}, event)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    return div;
}

// Загрузить все заявки для таблицы
async function loadAllApplicationsTable() {
    try {
        // Проверка кэша
        const now = Date.now();
        if (allApplicationsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
            renderAllApplicationsTable(allApplicationsCache);
            return;
        }

        // Показать индикатор загрузки
        const container = document.getElementById('allApplicationsTable');
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2">Загрузка данных...</p>
            </div>
        `;

        // Загрузить данные
        const response = await fetch('/api/applications');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const applications = await response.json();

        // Сохранить в кэш
        allApplicationsCache = applications;
        lastFetchTime = Date.now();

        // Отобразить таблицу
        renderAllApplicationsTable(applications);

    } catch (error) {
        console.error('Ошибка загрузки всех заявок:', error);
        const container = document.getElementById('allApplicationsTable');
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Не удалось загрузить данные. Ошибка: ${error.message}
            </div>
        `;
    }
}

// Отобразить таблицу всех заявок с группировкой по дням
function renderAllApplicationsTable(applications) {
    const container = document.getElementById('allApplicationsTableContainer');
    if (!container) return;

    // Группировка по датам
    const groupedByDate = groupApplicationsByDate(applications);

    let html = '';

    // Навигация по датам
    html += `<div class="date-navigation" id="dateNavigation">`;
    Object.keys(groupedByDate).forEach(date => {
        const count = groupedByDate[date].length;
        html += `
            <span class="date-chip" onclick="scrollToDate('${date}')">
                ${formatDateForDisplay(date)} <span class="badge bg-secondary">${count}</span>
            </span>
        `;
    });
    html += `</div>`;

    // Таблица по дням
    Object.keys(groupedByDate).forEach(date => {
        const dayApplications = groupedByDate[date];

        html += `
            <div class="date-group" id="date-${date}" onclick="toggleDateGroup('${date}')">
                <i class="bi bi-chevron-right collapse-icon"></i>
                ${formatDateForDisplay(date)}
                <span class="badge">${dayApplications.length} заявок</span>
            </div>
            <div class="date-content" id="content-${date}" style="display: none;">
                <table class="table table-sm table-hover all-applications-table mb-4">
                    <thead>
                        <tr>
                            <th class="compact-cell">Номер</th>
                            <th class="compact-cell">Инженер</th>
                            <th class="compact-cell">GSM</th>
                            <th class="compact-cell">Интернет</th>
                            <th class="compact-cell">Монтаж</th>
                            <th class="compact-cell">Проверяющий</th>
                            <th class="comments-cell">Комментарии</th>
                            <th class="compact-cell">Резолюция</th>
                            <th class="compact-cell">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        dayApplications.forEach(app => {
            const isOk = app.resolution === true || app.resolution === 'true';
            const comments = app.comments || '';

            html += `
                <tr class="app-row ${isOk ? 'ok' : 'nok'}" data-id="${app.id}" data-number="${app.applicationNumber}">
                    <td class="compact-cell">
                        <strong>${app.applicationNumber || ''}</strong>
                    </td>
                    <td class="compact-cell">${app.engineer || ''}</td>
                    <td class="compact-cell">${app.gsmLevel || ''}</td>
                    <td class="compact-cell">${app.internetLevel || ''}</td>
                    <td class="compact-cell">${app.installationDate || ''}</td>
                    <td class="compact-cell">${app.inspector || ''}</td>
                    <td class="comments-cell" title="${comments}">${comments}</td>
                    <td class="compact-cell">
                        <span class="badge ${isOk ? 'bg-success' : 'bg-danger'}">
                            ${isOk ? 'OK' : 'NOK'}
                        </span>
                    </td>
                    <td class="compact-cell">
                        <button class="btn btn-sm btn-outline-primary" onclick="loadFromTable(${app.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteApplication(${app.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    container.innerHTML = html;

    // Обновить статистику
    updateAllTableStats(applications);

    // Добавить обработчики для строк
    attachTableRowHandlers();
}

// Группировка заявок по дате
function groupApplicationsByDate(applications) {
    const grouped = {};

    applications.forEach(app => {
        let dateStr;
        if (app.lastUpdated) {
            const date = new Date(app.lastUpdated);
            dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        } else {
            dateStr = 'Без даты';
        }

        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        grouped[dateStr].push(app);
    });

    // Сортировка дат по убыванию
    const sortedGrouped = {};
    Object.keys(grouped)
        .sort((a, b) => b.localeCompare(a))
        .forEach(key => {
            sortedGrouped[key] = grouped[key];
        });

    return sortedGrouped;
}

// Обновить статистику таблицы
function updateAllTableStats(applications) {
    const totalCount = applications.length;
    const okCount = applications.filter(app => app.resolution === true || app.resolution === 'true').length;
    const nokCount = totalCount - okCount;

    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Всего: <strong>${totalCount}</strong> заявок |
            OK: <span class="text-success">${okCount}</span> |
            NOK: <span class="text-danger">${nokCount}</span>
        `;
    }
}

// Прокрутить к определенной дате
function scrollToDate(date) {
    const element = document.getElementById(`date-${date}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Развернуть группу
        toggleDateGroup(date, true);
    }
}

// Развернуть/свернуть группу по дате
function toggleDateGroup(date, forceExpand = false) {
    const content = document.getElementById(`content-${date}`);
    const header = document.getElementById(`date-${date}`);
    const icon = header.querySelector('.collapse-icon');

    if (content.style.display === 'none' || forceExpand) {
        content.style.display = 'block';
        header.classList.add('expanded');
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-down');
    } else {
        content.style.display = 'none';
        header.classList.remove('expanded');
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-right');
    }
}

// Загрузить заявку из таблицы
function loadFromTable(id) {
    fetch(`/api/applications/${id}`)
        .then(response => {
            if (!response.ok) throw new Error('Заявка не найдена');
            return response.json();
        })
        .then(application => {
            // Заполнить форму данными
            fillFormWithApplication(application);

            // Закрыть модальное окно
            const modal = bootstrap.Modal.getInstance(document.getElementById('allApplicationsModal'));
            modal.hide();

            // Показать сообщение
            showMessage(`Загружена заявка ${application.applicationNumber}`, 'success');
        })
        .catch(error => {
            showMessage(`Ошибка: ${error.message}`, 'error');
        });
}

// Заполнить форму данными заявки
function fillFormWithApplication(app) {
    // Основные поля
    document.getElementById('appId').value = app.id || '';
    document.getElementById('appNumberField').value = app.applicationNumber || '';
    document.querySelector('[name="engineer"]').value = app.engineer || '';
    document.querySelector('[name="gsmLevel"]').value = app.gsmLevel || '';
    document.querySelector('[name="internetLevel"]').value = app.internetLevel || '';
    document.getElementById('internetReason').value = app.internetReason || '';
    document.querySelector('[name="installationDate"]').value = app.installationDate || '';
    document.querySelector('[name="inspector"]').value = app.inspector || '';
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

// Удалить заявку
async function deleteApplication(id, event = null) {
    if (event) event.stopPropagation();

    if (!confirm('Удалить заявку? Это действие нельзя отменить.')) {
        return;
    }

    try {
        const response = await fetch(`/api/applications/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Заявка удалена', 'success');
            // Обновить списки
            loadRecentApplications();
            // Очистить кэш
            allApplicationsCache = null;
            lastFetchTime = null;
            // Очистить результаты поиска
            searchResults = [];
            isSearchActive = false;
        } else {
            throw new Error('Ошибка удаления');
        }
    } catch (error) {
        showMessage(`Ошибка удаления: ${error.message}`, 'error');
    }
}

// Фильтр по дате
function filterByDate() {
    if (isSearchActive) {
        showMessageInModal('Сначала очистите поиск для фильтрации по дате', 'warning');
        return;
    }

    const dateInput = document.getElementById('dateFilter');
    const date = dateInput.value;

    if (!date) return;

    const rows = document.querySelectorAll('.app-row');
    rows.forEach(row => {
        const rowDate = row.closest('.date-content')?.id.replace('content-', '');
        if (rowDate === date) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    updateFilterStats();
}

// Очистить фильтр даты
function clearDateFilter() {
    document.getElementById('dateFilter').value = '';
    const rows = document.querySelectorAll('.app-row');
    rows.forEach(row => row.style.display = '');
    updateFilterStats();
}

// Обновить статистику фильтрации
function updateFilterStats() {
    const visibleRows = document.querySelectorAll('.app-row:not([style*="display: none"])');
    const filteredCountElement = document.getElementById('filteredCount');

    // Проверяем, существует ли элемент перед изменением
    if (filteredCountElement) {
        filteredCountElement.textContent = visibleRows.length;
    }
    // Если элемента нет - ничего не делаем
}

// ============================================
// УЛУЧШЕННЫЙ ПОИСК В ТАБЛИЦЕ ВСЕХ ЗАЯВОК
// ============================================

// Обновленная функция поиска
async function searchInAllTable() {
    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();

    if (!searchTerm) {
        // Если поиск пустой - показываем все заявки как обычно
        clearSearchResults();
        return;
    }

    try {
        // Показать индикатор поиска
        showSearchLoading();

        // Загружаем все заявки (или используем кэш)
        let applications;
        if (allApplicationsCache) {
            applications = allApplicationsCache;
        } else {
            const response = await fetch('/api/applications');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            applications = await response.json();
        }

        // Фильтруем результаты
        searchResults = applications.filter(app => {
            return matchesSearch(app, searchTerm);
        });

        // Показываем результаты поиска В ТАБЛИЦЕ
        displaySearchResults(searchResults, searchTerm);

        // Обновляем статистику
        updateSearchStats(searchResults.length);

        isSearchActive = true;

    } catch (error) {
        console.error('Ошибка поиска:', error);
        showMessageInModal(`Ошибка поиска: ${error.message}`, 'error');
    }
}

// Проверка соответствия заявки поисковому запросу
function matchesSearch(application, searchTerm) {
    // Ищем по всем полям
    const fields = [
        application.applicationNumber || '',
        application.engineer || '',
        application.gsmLevel || '',
        application.internetLevel || '',
        application.internetReason || '',
        application.installationDate || '',
        application.inspector || '',
        application.comments || ''
    ];

    return fields.some(field =>
        field.toLowerCase().includes(searchTerm)
    );
}

// Показать индикатор загрузки поиска
function showSearchLoading() {
    const tableContainer = document.getElementById('allApplicationsTableContainer');
    tableContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Поиск...</span>
            </div>
            <p class="mt-2">Идет поиск...</p>
        </div>
    `;
}

// Отобразить результаты поиска
function displaySearchResults(results, searchTerm) {
    const container = document.getElementById('allApplicationsTableContainer');

    if (results.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-search"></i>
                По запросу "<strong>${searchTerm}</strong>" ничего не найдено
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="clearSearchResults()">
                    Показать все
                </button>
            </div>
        `;
        return;
    }

    // Группируем результаты поиска по датам для удобства
    const groupedByDate = groupApplicationsByDate(results);

    let html = `
        <div class="search-results-header mb-4">
            <div class="alert alert-success">
                <i class="bi bi-search"></i>
                Найдено <strong>${results.length}</strong> заявок по запросу: "<strong>${searchTerm}</strong>"
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="exportSearchResults()">
                        <i class="bi bi-file-earmark-excel"></i> Экспорт результатов
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="clearSearchResults()">
                        <i class="bi bi-x-circle"></i> Очистить поиск
                    </button>
                </div>
            </div>
        </div>
    `;

    // Если результатов меньше 10, показываем без группировки
    if (results.length <= 10) {
        html += renderApplicationsAsTable(results, true); // ОБНОВЛЕНО: добавлен true для заголовка
    } else {
        // Показываем с группировкой по датам
        Object.keys(groupedByDate).forEach(date => {
            const dayApplications = groupedByDate[date];

            html += `
                <div class="date-group" id="search-date-${date}" onclick="toggleSearchDateGroup('${date}')">
                    <i class="bi bi-chevron-right collapse-icon"></i>
                    ${formatDateForDisplay(date)}
                    <span class="badge">${dayApplications.length} заявок</span>
                </div>
                <div class="date-content" id="search-content-${date}" style="display: block;">
                    ${renderApplicationsAsTable(dayApplications, true)} <!-- ОБНОВЛЕНО: добавлен true -->
                </div>
            `;
        });
    }

    container.innerHTML = html;

    // Добавить обработчики для строк
    attachSearchResultHandlers();
}

// Рендер заявок в виде таблицы
function renderApplicationsAsTable(applications, showHeader = true) {
    let html = '';

    if (showHeader) {
        html = `
            <table class="table table-sm table-hover all-applications-table mb-4">
                <thead>
                    <tr>
                        <th class="compact-cell">Номер</th>
                        <th class="compact-cell">Инженер</th>
                        <th class="compact-cell">GSM</th>
                        <th class="compact-cell">Интернет</th>
                        <th class="compact-cell">Монтаж</th>
                        <th class="compact-cell">Проверяющий</th>
                        <th class="comments-cell">Комментарии</th>
                        <th class="compact-cell">Резолюция</th>
                        <th class="compact-cell">Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;
    }

    applications.forEach(app => {
        const isOk = app.resolution === true || app.resolution === 'true';
        const comments = app.comments || '';

        html += `
            <tr class="app-row search-result ${isOk ? 'ok' : 'nok'}" data-id="${app.id}" data-number="${app.applicationNumber}">
                <td class="compact-cell">
                    <strong>${app.applicationNumber || ''}</strong>
                </td>
                <td class="compact-cell">${app.engineer || ''}</td>
                <td class="compact-cell">${app.gsmLevel || ''}</td>
                <td class="compact-cell">${app.internetLevel || ''}</td>
                <td class="compact-cell">${app.installationDate || ''}</td>
                <td class="compact-cell">${app.inspector || ''}</td>
                <td class="comments-cell" title="${comments}">${comments}</td>
                <td class="compact-cell">
                    <span class="badge ${isOk ? 'bg-success' : 'bg-danger'}">
                        ${isOk ? 'OK' : 'NOK'}
                    </span>
                </td>
                <td class="compact-cell">
                    <button class="btn btn-sm btn-outline-primary" onclick="loadFromTable(${app.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteApplication(${app.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    if (showHeader) {
        html += `
                </tbody>
            </table>
        `;
    }

    return html;
}

// Очистить результаты поиска
function clearSearchResults() {
    const searchInput = document.getElementById('searchAllTable');
    searchInput.value = '';
    searchResults = [];
    isSearchActive = false;

    // Перезагружаем обычную таблицу
    if (allApplicationsCache) {
        renderAllApplicationsTable(allApplicationsCache);
    } else {
        loadAllApplicationsTable();
    }
}

// Переключить группу дат в результатах поиска
function toggleSearchDateGroup(date) {
    const content = document.getElementById(`search-content-${date}`);
    const header = document.getElementById(`search-date-${date}`);
    const icon = header.querySelector('.collapse-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        header.classList.add('expanded');
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-down');
    } else {
        content.style.display = 'none';
        header.classList.remove('expanded');
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-right');
    }
}

// Обновить статистику поиска
function updateSearchStats(count) {
    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Найдено: <strong>${count}</strong> заявок
            <button class="btn btn-sm btn-outline-success ms-2" onclick="exportSearchResults()">
                <i class="bi bi-file-earmark-excel"></i> Экспорт
            </button>
        `;
    }
}

// Экспорт результатов поиска
function exportSearchResults() {
    if (searchResults.length === 0) {
        showMessageInModal('Нет результатов для экспорта', 'warning');
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
    input.value = JSON.stringify(searchResults.map(app => app.id));
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

// Прикрепить обработчики для строк результатов поиска
function attachSearchResultHandlers() {
    const rows = document.querySelectorAll('.search-result');
    rows.forEach(row => {
        row.addEventListener('dblclick', () => {
            const id = row.getAttribute('data-id');
            loadFromTable(id);
        });

        row.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            rows.forEach(r => r.classList.remove('highlighted'));
            row.classList.add('highlighted');
        });
    });
}

// Прикрепить обработчики для строк таблицы
function attachTableRowHandlers() {
    const rows = document.querySelectorAll('.app-row');
    rows.forEach(row => {
        row.addEventListener('dblclick', () => {
            const id = row.getAttribute('data-id');
            loadFromTable(id);
        });

        row.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            rows.forEach(r => r.classList.remove('highlighted'));
            row.classList.add('highlighted');
        });
    });
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ФОРМАТИРОВАНИЯ
// ============================================

function formatTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateForDisplay(dateString) {
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

// Автообновление
function setupAutoRefresh() {
    const switchElement = document.getElementById('autoRefreshSwitch');
    if (!switchElement) return;

    switchElement.addEventListener('change', function() {
        if (this.checked) {
            autoRefreshInterval = setInterval(() => {
                loadRecentApplications();
                showMessage('Список обновлен', 'info');
            }, 30000); // 30 секунд
        } else {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }
    });
}

// ============================================
// ФУНКЦИЯ КОПИРОВАНИЯ КОММЕНТАРИЕВ В БУФЕР ОБМЕНА
// ============================================

function copyCommentsToClipboard() {
    const commentsField = document.getElementById('commentsField');
    const comments = commentsField.value.trim();

    if (!comments) {
        // Если комментарии пустые, показываем уведомление
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
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<i class="bi bi-check-circle"></i> Скопировано!';
            copyButton.disabled = true;

            // Восстанавливаем кнопку через 2 секунды
            setTimeout(() => {
                copyButton.innerHTML = originalText;
                copyButton.disabled = false;
            }, 2000);
        })
        .catch(err => {
            // Fallback для старых браузеров или если Clipboard API не поддерживается
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

// Функция для показа уведомления о копировании
function showCopyNotification(message, type = 'success') {
    // Удаляем предыдущее уведомление, если есть
    const existingNotification = document.getElementById('copyNotification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.id = 'copyNotification';
    notification.className = `copy-notification ${type === 'error' ? 'error' : ''}`;
    notification.innerHTML = `
        <i class="bi ${type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i>
        <span>${message}</span>
    `;

    // Добавляем на страницу
    document.body.appendChild(notification);

    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
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

// Экспорт всех заявок
function exportAllToExcel() {
    // Используем существующий endpoint
    window.open('/api/applications/export', '_blank');
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

    // Инициализация автодополнения
    setupAutocomplete();

    // Поиск при нажатии Enter в поле поиска списка
    document.getElementById('searchListInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchInList();
            e.preventDefault();
        }
    });

    // Загрузить последние заявки при загрузке страницы
    loadRecentApplications();

    // Настроить автообновление
    setupAutoRefresh();

    // Кнопка открытия таблицы всех заявок
    const openAllAppsBtn = document.getElementById('openAllApplicationsBtn');
    if (openAllAppsBtn) {
        openAllAppsBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('allApplicationsModal'));
            modal.show();
            // Загрузить данные при открытии
            setTimeout(() => loadAllApplicationsTable(), 300);
        });
    }

    // Очистка кэша при закрытии модального окна
    const allAppsModal = document.getElementById('allApplicationsModal');
    if (allAppsModal) {
        allAppsModal.addEventListener('hidden.bs.modal', function() {
            // Очищаем поиск
            clearSearchResults();
            clearDateFilter();
            const searchAllTable = document.getElementById('searchAllTable');
            if (searchAllTable) {
                searchAllTable.value = '';
            }
        });
    }

    // Обработка нажатия Enter в поиске таблицы
    const searchAllTableInput = document.getElementById('searchAllTable');
    if (searchAllTableInput) {
        searchAllTableInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchInAllTable();
                e.preventDefault();
            }
        });
    }

    // Инициализация формы с текущей датой по умолчанию
    const installationDateInput = document.querySelector('[name="installationDate"]');
    if (installationDateInput && !installationDateInput.value) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('ru-RU');
        installationDateInput.value = formattedDate;
    }
});