// ============================================
// МОДУЛЬ ФИЛЬТРАЦИИ ПО ДАТЕ
// Фильтрация заявок по дате редактирования/создания
// ============================================

import { state, MESSAGES } from '../config.js';
import { showMessageInModal, showTempMessage } from './ui.js';
import { renderApplicationsAsTable, attachTableRowHandlers, loadAllApplicationsTable } from './applicationsTable.js';
import { formatDateForDisplay } from './utils.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Фильтрует заявки по выбранной дате редактирования
 * Загружает свежие данные и отображает результаты
 */
export async function filterByDate() {
    const dateInput = document.getElementById('dateFilter');
    const selectedDate = dateInput.value;
    const searchTerm = document.getElementById('searchAllTable').value.trim();

    if (searchTerm) {
        if (typeof window.smartFilter === 'function') {
            window.smartFilter();
            return;
        }
    }

    if (!selectedDate) {
        showMessageInModal(MESSAGES.DATE_REQUIRED, 'warning');
        return;
    }

    try {
        const container = document.getElementById('allApplicationsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2">Поиск заявок за ${selectedDate}...</p>
                </div>
            `;
        }

        let applications;
        state.allApplicationsCache = null;
        state.lastFetchTime = null;

        const response = await fetch('/api/applications');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        applications = await response.json();

        state.allApplicationsCache = applications;
        state.lastFetchTime = Date.now();

        const filteredApplications = applications.filter(app => {
            if (!app.lastUpdated) return false;

            const appDate = new Date(app.lastUpdated);
            const selected = new Date(selectedDate);

            return appDate.getFullYear() === selected.getFullYear() &&
                   appDate.getMonth() === selected.getMonth() &&
                   appDate.getDate() === selected.getDate();
        });

        if (filteredApplications.length === 0) {
            const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-calendar-x"></i>
                    ${MESSAGES.NO_APPLICATIONS_DATE(formattedDate)}
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="showAllApplications()">
                            <i class="bi bi-list-ul"></i> Показать все заявки
                        </button>
                    </div>
                </div>
            `;

            return;
        }

        state.dateFilteredApplications = filteredApplications;
        state.currentDateFilter = selectedDate;
        state.currentSearchTerm = '';
        state.isDateFilterActive = true;
        state.isSearchActive = false;
        state.searchResults = filteredApplications;

        displayDateFilterResults(filteredApplications, selectedDate);

        const clearBtn = document.getElementById('clearDateFilterBtn');
        if (clearBtn) {
            clearBtn.style.display = 'inline-block';
        }

        updateDateFilterStats(filteredApplications.length, selectedDate);

    } catch (error) {
        console.error('Ошибка фильтрации по дате:', error);
        showMessageInModal(`Ошибка: ${error.message}`, 'error');

        const container = document.getElementById('allApplicationsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Ошибка фильтрации: ${error.message}
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="showAllApplications()">
                            <i class="bi bi-list-ul"></i> Показать все заявки
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

/**
 * Отображает результаты фильтрации по дате
 * @param {Array} applications - Отфильтрованные заявки
 * @param {string} selectedDate - Выбранная дата
 */
function displayDateFilterResults(applications, selectedDate) {
    const container = document.getElementById('allApplicationsTableContainer');
    const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    });

    const exportButtonId = 'exportDateButton_' + Date.now();

    let html = `
        <div class="search-results-header mb-4">
            <div class="alert alert-success">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-calendar-check"></i>
                        <strong>${formattedDate}</strong>
                        <span class="ms-2">(${applications.length} заявок)</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2"
                                id="${exportButtonId}"
                                data-date="${selectedDate}">
                            <i class="bi bi-file-earmark-excel"></i> Экспорт
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="showAllApplications()">
                            <i class="bi bi-x-circle"></i> Показать все
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    html += renderApplicationsAsTable(applications, true);

    container.innerHTML = html;

    const exportButton = document.getElementById(exportButtonId);
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            exportDateFilterResults(date);
        });
    }

    attachTableRowHandlers();
}

/**
 * Обновляет статистику фильтра по дате
 * @param {number} count - Количество найденных заявок
 * @param {string} selectedDate - Выбранная дата
 */
function updateDateFilterStats(count, selectedDate) {
    const statsElement = document.getElementById('allTableStats');

    if (!statsElement) return;

    const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const exportButtonId = 'exportDateStatsButton_' + Date.now();

    statsElement.innerHTML = `
        <i class="bi bi-calendar-check"></i>
        Активный фильтр: <strong>${formattedDate}</strong> |
        Найдено: <strong>${count}</strong> заявок
        <button class="btn btn-sm btn-outline-success ms-2"
                id="${exportButtonId}"
                data-date="${selectedDate}">
            <i class="bi bi-file-earmark-excel"></i> Экспорт
        </button>
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="showAllApplications()">
            <i class="bi bi-x-circle"></i> Показать все
        </button>
    `;

    const exportStatsButton = document.getElementById(exportButtonId);
    if (exportStatsButton) {
        exportStatsButton.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            exportDateFilterResults(date);
        });
    }
}

/**
 * Экспортирует результаты фильтра по дате в Excel файл
 * Создает временную форму для отправки данных на сервер
 * @param {string} date - Дата для экспорта
 */
export function exportDateFilterResults(date) {
    let exportDate = date;

    if (!exportDate || exportDate === 'undefined' || exportDate === 'null') {
        exportDate = state.currentDateFilter;

        if (!exportDate) {
            console.error('Некорректная дата для экспорта');
            showTempMessage('Ошибка: дата не определена. Выберите дату фильтра.', 'error');
            return;
        }
    }

    console.log('Exporting for date:', exportDate);

    if (!state.dateFilteredApplications || state.dateFilteredApplications.length === 0) {
        showTempMessage('Нет данных для экспорта', 'warning');
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/search';
    form.style.display = 'none';
    form.target = '_blank';

    const ids = state.dateFilteredApplications.map(app => app.id);

    const searchResultsInput = document.createElement('input');
    searchResultsInput.type = 'hidden';
    searchResultsInput.name = 'searchResults';
    searchResultsInput.value = JSON.stringify(ids);
    form.appendChild(searchResultsInput);

    const searchNameInput = document.createElement('input');
    searchNameInput.type = 'hidden';
    searchNameInput.name = 'searchName';
    searchNameInput.value = `applications_${exportDate.replace(/-/g, '')}`;
    form.appendChild(searchNameInput);

    document.body.appendChild(form);

    showTempMessage('Начинается экспорт файла...', 'info');

    form.submit();

    setTimeout(() => {
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    }, 1000);
}

/**
 * Показывает все заявки без фильтров
 * Сбрасывает состояние фильтров и загружает полный список
 */
export function showAllApplications() {
    const dateInput = document.getElementById('dateFilter');
    const clearBtn = document.getElementById('clearDateFilterBtn');

    if (dateInput) {
        dateInput.value = '';
    }

    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    state.isDateFilterActive = false;
    state.currentDateFilter = null;
    state.dateFilteredApplications = null;
    state.currentSearchTerm = '';

    state.searchResults = [];
    state.isSearchActive = false;

    const searchInput = document.getElementById('searchAllTable');
    if (searchInput) {
        searchInput.value = '';
    }

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
 * Псевдоним функции для обратной совместимости
 * Вызывает showAllApplications()
 */
export function clearDateFilter() {
    showAllApplications();
}

/**
 * Настраивает обработчики для фильтра по дате
 * Обрабатывает нажатие Enter в поле даты
 */
export function setupDateFilter() {
    const dateInput = document.getElementById('dateFilter');
    if (dateInput) {
        dateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (typeof window.smartFilter === 'function') {
                    window.smartFilter();
                }
                e.preventDefault();
            }
        });
    }
}

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

if (typeof window !== 'undefined') {
    window.showAllApplications = showAllApplications;
    window.filterByDate = filterByDate;
    window.clearDateFilter = clearDateFilter;
    window.exportDateFilterResults = exportDateFilterResults;
}