// ============================================
// МОДУЛЬ КОМБИНИРОВАННОЙ ФИЛЬТРАЦИИ
// ============================================

import { state, MESSAGES } from '../config.js';
import { showMessageInModal, showTempMessage } from './ui.js';
import { renderApplicationsAsTable, attachTableRowHandlers } from './applicationsTable.js';

/**
 * Применение комбинированного фильтра
 */
export async function applyCombinedFilter() {
    const searchTerm = document.getElementById('searchAllTable').value.trim().toLowerCase();
    const dateInput = document.getElementById('dateFilter').value;

    if (!searchTerm && !dateInput) {
        showMessageInModal('Введите поисковый запрос или выберите дату', 'warning');
        return;
    }

    try {
        // Показать индикатор загрузки
        showCombinedFilterLoading();

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

        // Применяем фильтры последовательно
        let filteredApplications = [...applications];

        // Фильтр по текстовому поиску
        if (searchTerm) {
            filteredApplications = filteredApplications.filter(app =>
                matchesSearch(app, searchTerm)
            );
            state.currentSearchTerm = searchTerm;
        }

        // Фильтр по дате
        if (dateInput) {
            filteredApplications = filteredApplications.filter(app => {
                if (!app.lastUpdated) return false;
                const appDate = new Date(app.lastUpdated);
                const selectedDate = new Date(dateInput);

                return appDate.getFullYear() === selectedDate.getFullYear() &&
                       appDate.getMonth() === selectedDate.getMonth() &&
                       appDate.getDate() === selectedDate.getDate();
            });
            state.currentFilterDate = dateInput;
        }

        // Сохраняем состояние
        state.combinedFilterActive = true;
        state.searchResults = filteredApplications;

        // Отображаем результаты
        displayCombinedResults(filteredApplications, searchTerm, dateInput);

        // Обновляем статистику
        updateCombinedStats(filteredApplications.length, searchTerm, dateInput);

    } catch (error) {
        console.error('Ошибка комбинированной фильтрации:', error);
        showMessageInModal(`Ошибка: ${error.message}`, 'error');
    }
}

/**
 * Отображение результатов комбинированного фильтра
 */
function displayCombinedResults(applications, searchTerm, dateInput) {
    const container = document.getElementById('allApplicationsTableContainer');

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-search"></i>
                ${getNoResultsMessage(searchTerm, dateInput)}
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="clearAllFilters()">
                        <i class="bi bi-list-ul"></i> Показать все заявки
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const dateStr = dateInput ? formatDateDisplay(dateInput) : '';

    let html = `
        <div class="combined-results-header mb-4">
            <div class="alert alert-success">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-filter-circle"></i>
                        ${getFilterDescription(searchTerm, dateStr)}
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
 * Форматирование описания фильтра
 */
function getFilterDescription(searchTerm, dateStr) {
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
 * Сообщение при отсутствии результатов
 */
function getNoResultsMessage(searchTerm, dateInput) {
    const parts = [];

    if (searchTerm) {
        parts.push(`по запросу "<strong>${searchTerm}</strong>"`);
    }

    if (dateInput) {
        const dateStr = formatDateDisplay(dateInput);
        parts.push(`за <strong>${dateStr}</strong>`);
    }

    return `Нет заявок ${parts.join(' ')}`;
}

/**
 * Обновление статистики
 */
function updateCombinedStats(count, searchTerm, dateInput) {
    const statsElement = document.getElementById('allTableStats');
    if (!statsElement) return;

    let html = `<i class="bi bi-filter-circle"></i>`;

    if (searchTerm) {
        html += ` Поиск: <strong>${searchTerm}</strong> |`;
    }

    if (dateInput) {
        const dateStr = formatDateDisplay(dateInput);
        html += ` Дата: <strong>${dateStr}</strong> |`;
    }

    html += ` Найдено: <strong>${count}</strong> заявок`;

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
 * Форматирование даты для отображения
 */
function formatDateDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    });
}

/**
 * Проверка соответствия заявки поисковому запросу
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
 * Экспорт результатов комбинированного фильтра
 */
export function exportCombinedResults() {
    if (!state.searchResults || state.searchResults.length === 0) {
        showTempMessage('Нет результатов для экспорта', 'warning');
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

    // Генерируем имя файла на основе фильтров
    let fileName = 'filtered_applications';
    if (state.currentSearchTerm) {
        fileName += `_${state.currentSearchTerm}`;
    }
    if (state.currentFilterDate) {
        const dateStr = state.currentFilterDate.replace(/-/g, '');
        fileName += `_${dateStr}`;
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
 * Сброс всех фильтров
 */
export function clearAllFilters() {
    const searchInput = document.getElementById('searchAllTable');
    const dateInput = document.getElementById('dateFilter');

    if (searchInput) searchInput.value = '';
    if (dateInput) dateInput.value = '';

    // Сброс состояния
    state.currentSearchTerm = '';
    state.currentFilterDate = null;
    state.combinedFilterActive = false;
    state.searchResults = [];
    state.isSearchActive = false;
    state.isDateFilterActive = false;

    // Возврат к отображению всех заявок
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

    // Перезагрузка таблицы
    setTimeout(() => {
        state.allApplicationsCache = null;
        state.lastFetchTime = null;
        if (typeof window.loadAllApplicationsTable === 'function') {
            window.loadAllApplicationsTable();
        }
    }, 100);
}

// Глобальный экспорт
if (typeof window !== 'undefined') {
    window.applyCombinedFilter = applyCombinedFilter;
    window.clearAllFilters = clearAllFilters;
    window.exportCombinedResults = exportCombinedResults;
}