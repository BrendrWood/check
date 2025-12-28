// ============================================
// МОДУЛЬ ПОИСКА И ФИЛЬТРАЦИИ
// ============================================

import { state, SELECTORS, MESSAGES, CSS_CLASSES } from '../config.js';
import { showMessageInModal } from './ui.js';
import { renderApplicationsAsTable, attachTableRowHandlers, loadAllApplicationsTable } from './applicationsTable.js';
import { formatDateForDisplay } from './utils.js';

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Проверка соответствия заявки поисковому запросу
 */
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

/**
 * Показать индикатор загрузки поиска
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
 * Прикрепить обработчики для строк результатов поиска
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
 * Группировка заявок по дате (для поиска)
 */
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

/**
 * Форматирование даты для комбинированного фильтра
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
 * Описание активных фильтров
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
 * Сообщение об отсутствии результатов
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
 * Сообщение при отсутствии результатов комбинированного поиска
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
 * Отображение результатов комбинированного поиска
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

    // Показываем таблицу
    html += renderApplicationsAsTable(applications, true);
    container.innerHTML = html;

    // Добавить обработчики для строк
    attachTableRowHandlers();
}

/**
 * Обновление статистики для комбинированного фильтра
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
 * Обновить статистику поиска
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
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * УМНАЯ ФИЛЬТРАЦИЯ - определяет тип фильтра автоматически
 */
export async function smartFilter() {
    console.log('Умная фильтрация запущена');

    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();
    const dateInput = document.getElementById('dateFilter').value;

    console.log('Параметры:', { searchTerm, dateInput });

    // Если оба поля пустые
    if (!searchTerm && !dateInput) {
        showMessageInModal('Введите поисковый запрос или выберите дату', 'warning');
        return;
    }

    // Определяем тип фильтрации
    if (searchTerm && dateInput) {
        console.log('Комбинированная фильтрация (текст + дата)');
        return await applyCombinedFilter();
    } else if (searchTerm) {
        console.log('Только текстовый поиск');
        return await searchInAllTable();
    } else {
        console.log('Только фильтр по дате');
        return await filterByDate();
    }
}

/**
 * КОМБИНИРОВАННЫЙ ПОИСК И ФИЛЬТРАЦИЯ
 */
export async function applyCombinedFilter() {
    console.log('Функция applyCombinedFilter вызвана');

    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();
    const dateInput = document.getElementById('dateFilter').value;

    console.log('Параметры поиска:', { searchTerm, dateInput });

    // Если оба поля пустые
    if (!searchTerm && !dateInput) {
        showMessageInModal('Введите поисковый запрос или выберите дату', 'warning');
        return;
    }

    try {
        // Показать индикатор загрузки
        showSearchLoading();

        // Загружаем все заявки
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

        // Начинаем с полного списка
        let filteredApplications = [...applications];

        // Применяем текстовый поиск
        if (searchTerm) {
            filteredApplications = filteredApplications.filter(app =>
                matchesSearch(app, searchTerm)
            );
        }

        // Применяем фильтр по дате
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

        console.log('Результатов найдено:', filteredApplications.length);

        // Сохраняем результаты
        state.searchResults = filteredApplications;
        state.isSearchActive = true;
        state.isDateFilterActive = !!dateInput;
        state.currentDateFilter = dateInput || null;

        // Показываем результаты
        if (filteredApplications.length === 0) {
            showNoCombinedResults(searchTerm, dateInput);
        } else {
            displayCombinedResults(filteredApplications, searchTerm, dateInput);
        }

        // Обновляем статистику
        updateCombinedStats(filteredApplications.length, searchTerm, dateInput);

    } catch (error) {
        console.error('Ошибка комбинированной фильтрации:', error);
        showMessageInModal(`Ошибка: ${error.message}`, 'error');
    }
}

/**
 * СБРОС ВСЕХ ФИЛЬТРОВ
 */
export function clearAllFilters() {
    console.log('Функция clearAllFilters вызвана');

    const searchInput = document.getElementById('searchAllTable');
    const dateInput = document.getElementById('dateFilter');

    if (searchInput) {
        searchInput.value = '';
    }

    if (dateInput) {
        dateInput.value = '';
    }

    // Сбрасываем все состояния
    state.searchResults = [];
    state.isSearchActive = false;
    state.isDateFilterActive = false;
    state.currentDateFilter = null;
    state.currentSearchTerm = '';

    // Показываем индикатор загрузки
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

    // Обновляем статистику
    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Загрузка всех заявок...
        `;
    }

    // Загружаем все заявки заново
    setTimeout(() => {
        state.allApplicationsCache = null;
        state.lastFetchTime = null;

        if (typeof loadAllApplicationsTable === 'function') {
            loadAllApplicationsTable();
        }
    }, 100);
}

/**
 * Поиск в таблице всех заявок (СТАРАЯ ВЕРСИЯ - для совместимости)
 */
export async function searchInAllTable() {
    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();

    if (!searchTerm) {
        // Если поиск пустой - показываем все заявки как обычно
        clearSearchResults();
        return;
    }

    // Если есть активный фильтр даты - предупредить
    if (state.isDateFilterActive) {
        if (!confirm('Активен фильтр по дате. Очистить его для поиска?')) {
            return;
        }
        // Очищаем фильтр даты
        if (typeof window.clearDateFilter === 'function') {
            window.clearDateFilter();
        }
    }

    try {
        // Показать индикатор поиска
        showSearchLoading();

        // Загружаем все заявки (или используем кэш)
        let applications;
        if (state.allApplicationsCache) {
            applications = state.allApplicationsCache;
        } else {
            const response = await fetch('/api/applications');
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            applications = await response.json();
            // Сохраняем в кэш
            state.allApplicationsCache = applications;
            state.lastFetchTime = Date.now();
        }

        // Фильтруем результаты
        state.searchResults = applications.filter(app => {
            return matchesSearch(app, searchTerm);
        });

        // Показываем результаты поиска В ТАБЛИЦЕ
        displaySearchResults(state.searchResults, searchTerm);

        // Обновляем статистику
        updateSearchStats(state.searchResults.length);

        state.isSearchActive = true;

    } catch (error) {
        console.error('Ошибка поиска:', error);
        showMessageInModal(`Ошибка поиска: ${error.message}`, 'error');
    }
}

/**
 * Отобразить результаты поиска
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
        html += renderApplicationsAsTable(results, true);
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
                    ${renderApplicationsAsTable(dayApplications, true)}
                </div>
            `;
        });
    }

    container.innerHTML = html;

    // Добавить обработчики для строк
    attachSearchResultHandlers();
}

/**
 * Очистить результаты поиска (СТАРАЯ ВЕРСИЯ)
 */
export function clearSearchResults() {
    const searchInput = document.getElementById('searchAllTable');
    if (searchInput) {
        searchInput.value = '';
    }

    state.searchResults = [];
    state.isSearchActive = false;

    // Полностью очищаем контейнер и показываем индикатор загрузки
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

    // Обновляем статистику
    const statsElement = document.getElementById('allTableStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <i class="bi bi-info-circle"></i>
            Загрузка всех заявок...
        `;
    }

    // Загружаем все заявки заново
    setTimeout(() => {
        // Сбрасываем кэш для гарантии свежих данных
        state.allApplicationsCache = null;
        state.lastFetchTime = null;

        // Вызываем функцию загрузки всех заявок
        if (typeof loadAllApplicationsTable === 'function') {
            loadAllApplicationsTable();
        }
    }, 100);
}

/**
 * Поиск в списке заявок (по номеру)
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

    // Ищем заявку по точному номеру
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
        // Показываем информацию о найденной заявке
        if (searchInfo) {
            searchInfo.style.display = 'block';
            searchInfo.innerHTML = `Найдена 1 заявка. <a href="#" onclick="clearListSearch()" class="text-primary">Показать все</a>`;
        }

        // Обновляем счетчик
        if (applicationsCount) {
            applicationsCount.textContent = '1';
        }

        // Прокручиваем к найденной заявке
        if (foundItem) {
            foundItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        // Если не найдено
        if (searchInfo) {
            searchInfo.style.display = 'block';
            searchInfo.innerHTML = `Заявка с номером "${searchTerm}" не найдена. <a href="#" onclick="clearListSearch()" class="text-primary">Показать все</a>`;
        }

        // Обновляем счетчик
        if (applicationsCount) {
            applicationsCount.textContent = '0';
        }
    }
}

/**
 * Очистка поиска в списке
 */
export function clearListSearch() {
    const searchInput = document.getElementById('searchListInput');
    const appItems = document.querySelectorAll('.application-item');
    const searchInfo = document.getElementById('searchListInfo');
    const applicationsCount = document.getElementById('applicationsCount');
    const totalCount = appItems.length;

    // Очищаем поле поиска
    if (searchInput) {
        searchInput.value = '';
    }

    // Показываем все заявки
    appItems.forEach(item => {
        item.classList.remove(CSS_CLASSES.HIDDEN);
        item.classList.remove(CSS_CLASSES.HIGHLIGHTED);
    });

    // Скрываем информацию о поиске
    if (searchInfo) {
        searchInfo.style.display = 'none';
    }

    // Восстанавливаем счетчик
    if (applicationsCount) {
        applicationsCount.textContent = totalCount;
    }

    // Фокусируемся на поле поиска
    if (searchInput) {
        searchInput.focus();
    }
}

/**
 * Экспорт результатов поиска (СТАРАЯ ВЕРСИЯ)
 */
export function exportSearchResults() {
    if (state.searchResults.length === 0) {
        showMessageInModal(MESSAGES.NO_EXPORT_DATA, 'warning');
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

/**
 * Экспорт результатов комбинированного фильтра
 */
export function exportCombinedResults() {
    if (state.searchResults.length === 0) {
        showMessageInModal(MESSAGES.NO_EXPORT_DATA, 'warning');
        return;
    }

    // Создаем форму для экспорта
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/search';
    form.style.display = 'none';
    form.target = '_blank';

    // ID заявок
    const ids = state.searchResults.map(app => app.id);
    const searchResultsInput = document.createElement('input');
    searchResultsInput.type = 'hidden';
    searchResultsInput.name = 'searchResults';
    searchResultsInput.value = JSON.stringify(ids);
    form.appendChild(searchResultsInput);

    // Название файла
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

    // Добавляем форму на страницу
    document.body.appendChild(form);
    form.submit();

    // Удаляем форму
    setTimeout(() => {
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    }, 1000);
}

/**
 * Настройка обработчиков для поиска
 */
export function setupSearchHandlers() {
    // Обработка нажатия Enter в поле поиска списка
    const searchListInput = document.getElementById('searchListInput');
    if (searchListInput) {
        searchListInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchInList();
                e.preventDefault();
            }
        });
    }

    // Обработчики Enter для поиска и даты
    const searchAllInput = document.getElementById('searchAllTable');
    const dateInput = document.getElementById('dateFilter');

    [searchAllInput, dateInput].forEach(input => {
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Вызываем умную фильтрацию
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
// ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

if (typeof window !== 'undefined') {
    console.log('Экспорт функций search.js в window');

    // СТАРЫЕ ФУНКЦИИ (для совместимости)
    window.searchInAllTable = searchInAllTable;
    window.clearSearchResults = clearSearchResults;
    window.searchInList = searchInList;
    window.clearListSearch = clearListSearch;
    window.exportSearchResults = exportSearchResults;

    // НОВЫЕ ФУНКЦИИ КОМБИНИРОВАННОЙ ФИЛЬТРАЦИИ
    window.applyCombinedFilter = applyCombinedFilter;
    window.clearAllFilters = clearAllFilters;
    window.exportCombinedResults = exportCombinedResults;

    // УМНАЯ ФУНКЦИЯ (ОСНОВНАЯ)
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

    console.log('smartFilter в window?', typeof window.smartFilter);
    console.log('applyCombinedFilter в window?', typeof window.applyCombinedFilter);
}