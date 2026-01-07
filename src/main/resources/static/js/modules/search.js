// ============================================
// МОДУЛЬ ПОИСКА И ФИЛЬТРАЦИИ
// Управление поиском заявок и фильтрацией данных
// ============================================

import { state, SELECTORS, MESSAGES, CSS_CLASSES } from '../config.js';
import { showMessageInModal } from './ui.js';
import { renderApplicationsAsTable, attachTableRowHandlers, loadAllApplicationsTable } from './applicationsTable.js';
import { formatDateForDisplay } from './utils.js';

/**
 * Применяет умную фильтрацию в зависимости от заполненных полей
 * Автоматически определяет тип фильтра (текст, дата или комбинированный)
 */
export async function smartFilter() {
    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();
    const dateInput = document.getElementById('dateFilter').value;

    if (!searchTerm && !dateInput) {
        showMessageInModal('Введите поисковый запрос или выберите дату', 'warning');
        return;
    }

    if (searchTerm && dateInput) {
        return await applyCombinedFilter();
    } else if (searchTerm) {
        return await searchInAllTable();
    } else {
        return await filterByDate();
    }
}

/**
 * Применяет комбинированный фильтр по тексту и дате
 * Загружает данные, фильтрует и отображает результаты
 */
export async function applyCombinedFilter() {
    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();
    const dateInput = document.getElementById('dateFilter').value;

    if (!searchTerm && !dateInput) {
        showMessageInModal('Введите поисковый запрос или выберите дату', 'warning');
        return;
    }

    try {
        showSearchLoading();

        let applications;
        if (state.allApplicationsCache) {
            applications = state.allApplicationsCache;
        } else {
            const response = await fetch('/api/applications');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            applications = await response.json();
            state.allApplicationsCache = applications;
            state.lastFetchTime = Date.now();
        }

        let filteredApplications = [...applications];

        if (searchTerm) {
            filteredApplications = filteredApplications.filter(app =>
                matchesSearch(app, searchTerm)
            );
        }

        if (dateInput) {
            filteredApplications = filteredApplications.filter(app => {
                if (!app.lastUpdated) return false;
                const appDate = new Date(app.lastUpdated);
                const selectedDate = new Date(dateInput);

                return appDate.getFullYear() === selectedDate.getFullYear() &&
                       appDate.getMonth() === selectedDate.getMonth() &&
                       appDate.getDate() === selectedDate.getDate();
            });
        }

        state.searchResults = filteredApplications;
        state.isSearchActive = true;
        state.isDateFilterActive = !!dateInput;
        state.currentDateFilter = dateInput || null;

        if (filteredApplications.length === 0) {
            showNoCombinedResults(searchTerm, dateInput);
        } else {
            displayCombinedResults(filteredApplications, searchTerm, dateInput);
        }

        updateCombinedStats(filteredApplications.length, searchTerm, dateInput);

    } catch (error) {
        console.error('Ошибка комбинированной фильтрации:', error);
        showMessageInModal(`Ошибка: ${error.message}`, 'error');
    }
}

/**
 * Сбрасывает все активные фильтры и показывает полный список заявок
 */
export function clearAllFilters() {
    const searchInput = document.getElementById('searchAllTable');
    const dateInput = document.getElementById('dateFilter');

    if (searchInput) {
        searchInput.value = '';
    }

    if (dateInput) {
        dateInput.value = '';
    }

    state.searchResults = [];
    state.isSearchActive = false;
    state.isDateFilterActive = false;
    state.currentDateFilter = null;
    state.currentSearchTerm = '';

    const container = document.getElementById('allApplicationsTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2">Загрузка всех заявок...</p>
            </div>
        `;
    }

    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Загрузка всех заявок...
        `;
    }

    setTimeout(() => {
        state.allApplicationsCache = null;
        state.lastFetchTime = null;

        if (typeof loadAllApplicationsTable === 'function') {
            loadAllApplicationsTable();
        }
    }, 100);
}

/**
 * Выполняет поиск заявок по текстовому запросу
 * Фильтрует заявки по всем текстовым полям
 */
export async function searchInAllTable() {
    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();

    if (!searchTerm) {
        clearSearchResults();
        return;
    }

    if (state.isDateFilterActive) {
        if (!confirm('Активен фильтр по дате. Очистить его для поиска?')) {
            return;
        }
        if (typeof window.clearDateFilter === 'function') {
            window.clearDateFilter();
        }
    }

    try {
        showSearchLoading();

        let applications;
        if (state.allApplicationsCache) {
            applications = state.allApplicationsCache;
        } else {
            const response = await fetch('/api/applications');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            applications = await response.json();
            state.allApplicationsCache = applications;
            state.lastFetchTime = Date.now();
        }

        state.searchResults = applications.filter(app => {
            return matchesSearch(app, searchTerm);
        });

        displaySearchResults(state.searchResults, searchTerm);
        updateSearchStats(state.searchResults.length);

        state.isSearchActive = true;

    } catch (error) {
        console.error('Ошибка поиска:', error);
        showMessageInModal(`Ошибка поиска: ${error.message}`, 'error');
    }
}

/**
 * Отображает результаты поиска в виде таблицы
 * @param {Array} results - Найденные заявки
 * @param {string} searchTerm - Поисковый запрос
 */
export function displaySearchResults(results, searchTerm) {
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

    if (results.length <= 10) {
        html += renderApplicationsAsTable(results, true);
    } else {
        Object.keys(groupedByDate).forEach(date => {
            const dayApplications = groupedByDate[date];

            html += `
                <div class="date-group" id="search-date-${date}" onclick="toggleSearchDateGroup('${date}')">
                    <i class="bi bi-chevron-right collapse-icon"></i>
                    ${formatDateForDisplay(date)}
                    <span class="badge">${dayApplications.length} заявок</span>
                </div>
                <div class="date-content" id="search-content-${date}" style="display: block;">
                    ${renderApplicationsAsTable(dayApplications, true)}
                </div>
            `;
        });
    }

    container.innerHTML = html;
    attachSearchResultHandlers();
}

/**
 * Очищает результаты поиска и показывает полный список заявок
 */
export function clearSearchResults() {
    const searchInput = document.getElementById('searchAllTable');
    if (searchInput) {
        searchInput.value = '';
    }

    state.searchResults = [];
    state.isSearchActive = false;

    const container = document.getElementById('allApplicationsTableContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2">Загрузка всех заявок...</p>
            </div>
        `;
    }

    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Загрузка всех заявок...
        `;
    }

    setTimeout(() => {
        state.allApplicationsCache = null;
        state.lastFetchTime = null;

        if (typeof loadAllApplicationsTable === 'function') {
            loadAllApplicationsTable();
        }
    }, 100);
}

/**
 * Выполняет поиск заявки по номеру в списке последних заявок
 * Подсвечивает найденную заявку и скрывает остальные
 */
export function searchInList() {
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

    appItems.forEach(item => {
        const number = item.getAttribute('data-number');

        if (number === searchTerm) {
            item.classList.remove(CSS_CLASSES.HIDDEN);
            item.classList.add(CSS_CLASSES.HIGHLIGHTED);
            foundCount++;
            foundItem = item;
        } else {
            item.classList.add(CSS_CLASSES.HIDDEN);
            item.classList.remove(CSS_CLASSES.HIGHLIGHTED);
        }
    });

    if (foundCount > 0) {
        if (searchInfo) {
            searchInfo.style.display = 'block';
            searchInfo.innerHTML = `Найдена 1 заявка. <a href="#" onclick="clearListSearch()" class="text-primary">Показать все</a>`;
        }

        if (applicationsCount) {
            applicationsCount.textContent = '1';
        }

        if (foundItem) {
            foundItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        if (searchInfo) {
            searchInfo.style.display = 'block';
            searchInfo.innerHTML = `Заявка с номером "${searchTerm}" не найдена. <a href="#" onclick="clearListSearch()" class="text-primary">Показать все</a>`;
        }

        if (applicationsCount) {
            applicationsCount.textContent = '0';
        }
    }
}

/**
 * Очищает результаты поиска в списке заявок
 * Восстанавливает отображение всех заявок
 */
export function clearListSearch() {
    const searchInput = document.getElementById('searchListInput');
    const appItems = document.querySelectorAll('.application-item');
    const searchInfo = document.getElementById('searchListInfo');
    const applicationsCount = document.getElementById('applicationsCount');
    const totalCount = appItems.length;

    if (searchInput) {
        searchInput.value = '';
    }

    appItems.forEach(item => {
        item.classList.remove(CSS_CLASSES.HIDDEN);
        item.classList.remove(CSS_CLASSES.HIGHLIGHTED);
    });

    if (searchInfo) {
        searchInfo.style.display = 'none';
    }

    if (applicationsCount) {
        applicationsCount.textContent = totalCount;
    }

    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Экспортирует результаты поиска в Excel файл
 * Создает временную форму для отправки данных на сервер
 */
export function exportSearchResults() {
    if (state.searchResults.length === 0) {
        showMessageInModal(MESSAGES.NO_EXPORT_DATA, 'warning');
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

/**
 * Экспортирует результаты комбинированного фильтра в Excel файл
 * Формирует имя файла на основе поискового запроса и даты
 */
export function exportCombinedResults() {
    if (state.searchResults.length === 0) {
        showMessageInModal(MESSAGES.NO_EXPORT_DATA, 'warning');
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/search';
    form.style.display = 'none';
    form.target = '_blank';

    const ids = state.searchResults.map(app => app.id);
    const searchResultsInput = document.createElement('input');
    searchResultsInput.type = 'hidden';
    searchResultsInput.name = 'searchResults';
    searchResultsInput.value = JSON.stringify(ids);
    form.appendChild(searchResultsInput);

    const searchTerm = document.getElementById('searchAllTable').value.trim();
    const dateInput = document.getElementById('dateFilter').value;
    let fileName = 'applications';

    if (searchTerm) {
        fileName += `_${searchTerm.replace(/\s+/g, '_')}`;
    }
    if (dateInput) {
        fileName += `_${dateInput.replace(/-/g, '')}`;
    }

    const searchNameInput = document.createElement('input');
    searchNameInput.type = 'hidden';
    searchNameInput.name = 'searchName';
    searchNameInput.value = fileName;
    form.appendChild(searchNameInput);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    }, 1000);
}

/**
 * Настраивает обработчики для полей поиска
 * Обрабатывает нажатие Enter в полях ввода
 */
export function setupSearchHandlers() {
    const searchListInput = document.getElementById('searchListInput');
    if (searchListInput) {
        searchListInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchInList();
                e.preventDefault();
            }
        });
    }

    const searchAllInput = document.getElementById('searchAllTable');
    const dateInput = document.getElementById('dateFilter');

    [searchAllInput, dateInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (typeof window.smartFilter === 'function') {
                        window.smartFilter();
                    } else if (typeof smartFilter === 'function') {
                        smartFilter();
                    }
                }
            });
        }
    });
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверяет соответствие заявки поисковому запросу
 * @param {Object} application - Объект заявки
 * @param {string} searchTerm - Поисковый запрос
 * @returns {boolean} true если найдено совпадение
 */
function matchesSearch(application, searchTerm) {
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

    return fields.some(field => field.toLowerCase().includes(searchTerm));
}

/**
 * Показывает индикатор загрузки для поиска
 */
function showSearchLoading() {
    const tableContainer = document.getElementById('allApplicationsTableContainer');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Поиск...</span>
                </div>
                <p class="mt-2">Идет поиск...</p>
            </div>
        `;
    }
}

/**
 * Прикрепляет обработчики к строкам результатов поиска
 */
function attachSearchResultHandlers() {
    const rows = document.querySelectorAll('.search-result');
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

/**
 * Группирует заявки по дате для отображения результатов поиска
 * @param {Array} applications - Массив заявок
 * @returns {Object} Объект с заявками, сгруппированными по дате
 */
function groupApplicationsByDate(applications) {
    const grouped = {};

    applications.forEach(app => {
        let dateStr;
        if (app.lastUpdated) {
            const date = new Date(app.lastUpdated);
            dateStr = date.toISOString().split('T')[0];
        } else {
            dateStr = 'Без даты';
        }

        if (!grouped[dateStr]) {
            grouped[dateStr] = [];
        }
        grouped[dateStr].push(app);
    });

    const sortedGrouped = {};
    Object.keys(grouped)
        .sort((a, b) => b.localeCompare(a))
        .forEach(key => {
            sortedGrouped[key] = grouped[key];
        });

    return sortedGrouped;
}

/**
 * Форматирует дату для отображения в комбинированном фильтре
 * @param {string} dateString - Дата в формате YYYY-MM-DD
 * @returns {string} Отформатированная дата
 */
function formatCombinedDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Формирует описание активных фильтров
 * @param {string} searchTerm - Поисковый запрос
 * @param {string} dateStr - Отформатированная дата
 * @returns {string} Текст описания фильтров
 */
function getCombinedFilterDescription(searchTerm, dateStr) {
    const parts = [];

    if (searchTerm) {
        parts.push(`Поиск: "<strong>${searchTerm}</strong>"`);
    }

    if (dateStr) {
        parts.push(`Дата: <strong>${dateStr}</strong>`);
    }

    return parts.join(' | ');
}

/**
 * Формирует сообщение об отсутствии результатов комбинированного поиска
 * @param {string} searchTerm - Поисковый запрос
 * @param {string} dateStr - Отформатированная дата
 * @returns {string} Текст сообщения
 */
function getNoCombinedResultsMessage(searchTerm, dateStr) {
    const parts = [];

    if (searchTerm) {
        parts.push(`по запросу "<strong>${searchTerm}</strong>"`);
    }

    if (dateStr) {
        parts.push(`за <strong>${dateStr}</strong>`);
    }

    return `Нет заявок ${parts.join(' ')}`;
}

/**
 * Показывает сообщение об отсутствии результатов комбинированного поиска
 * @param {string} searchTerm - Поисковый запрос
 * @param {string} dateInput - Выбранная дата
 */
function showNoCombinedResults(searchTerm, dateInput) {
    const container = document.getElementById('allApplicationsTableContainer');

    const dateStr = dateInput ? formatCombinedDate(dateInput) : '';
    const message = getNoCombinedResultsMessage(searchTerm, dateStr);

    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="bi bi-search"></i>
            ${message}
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary" onclick="clearAllFilters()">
                    <i class="bi bi-list-ul"></i> Показать все заявки
                </button>
            </div>
        </div>
    `;
}

/**
 * Отображает результаты комбинированной фильтрации
 * @param {Array} applications - Отфильтрованные заявки
 * @param {string} searchTerm - Поисковый запрос
 * @param {string} dateInput - Выбранная дата
 */
function displayCombinedResults(applications, searchTerm, dateInput) {
    const container = document.getElementById('allApplicationsTableContainer');

    const dateStr = dateInput ? formatCombinedDate(dateInput) : '';

    let html = `
        <div class="combined-results-header mb-4">
            <div class="alert alert-success">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-filter-circle"></i>
                        ${getCombinedFilterDescription(searchTerm, dateStr)}
                        <span class="ms-2">(${applications.length} заявок)</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2"
                                onclick="exportCombinedResults()">
                            <i class="bi bi-file-earmark-excel"></i> Экспорт
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="clearAllFilters()">
                            <i class="bi bi-x-circle"></i> Сбросить все
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    html += renderApplicationsAsTable(applications, true);
    container.innerHTML = html;

    attachTableRowHandlers();
}

/**
 * Обновляет статистику для комбинированного фильтра
 * @param {number} count - Количество найденных заявок
 * @param {string} searchTerm - Поисковый запрос
 * @param {string} dateInput - Выбранная дата
 */
function updateCombinedStats(count, searchTerm, dateInput) {
    const statsElement = document.getElementById('allTableStats');
    if (!statsElement) return;

    const dateStr = dateInput ? formatCombinedDate(dateInput) : '';

    let html = `<i class="bi bi-filter-circle"></i>`;

    if (searchTerm) {
        html += ` Поиск: "<strong>${searchTerm}</strong>"`;
    }

    if (dateStr) {
        html += ` ${searchTerm ? '|' : ''} Дата: <strong>${dateStr}</strong>`;
    }

    html += ` | Найдено: <strong>${count}</strong> заявок`;

    html += `
        <button class="btn btn-sm btn-outline-success ms-2" onclick="exportCombinedResults()">
            <i class="bi bi-file-earmark-excel"></i> Экспорт
        </button>
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="clearAllFilters()">
            <i class="bi bi-x-circle"></i> Сбросить все
        </button>
    `;

    statsElement.innerHTML = html;
}

/**
 * Обновляет статистику поиска
 * @param {number} count - Количество найденных заявок
 */
function updateSearchStats(count) {
    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Найдено: <strong>${count}</strong> заявок
            <button class="btn btn-sm btn-outline-success ms-2" onclick="exportSearchResults()">
                <i class="bi bi-file-earmark-excel"></i> Экспорт
            </button>
            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="clearSearchResults()">
                <i class="bi bi-x-circle"></i> Очистить поиск
            </button>
        `;
    }
}

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

if (typeof window !== 'undefined') {
    window.searchInAllTable = searchInAllTable;
    window.clearSearchResults = clearSearchResults;
    window.searchInList = searchInList;
    window.clearListSearch = clearListSearch;
    window.exportSearchResults = exportSearchResults;
    window.applyCombinedFilter = applyCombinedFilter;
    window.clearAllFilters = clearAllFilters;
    window.exportCombinedResults = exportCombinedResults;
    window.smartFilter = smartFilter;

    window.toggleSearchDateGroup = function(date) {
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
    };
}