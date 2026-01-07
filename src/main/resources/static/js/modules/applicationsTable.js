// ============================================
// МОДУЛЬ ТАБЛИЦЫ ЗАЯВОК
// Управление отображением и взаимодействием с заявками
// ============================================

import { state, API_ENDPOINTS, MESSAGES, CSS_CLASSES } from '../config.js';
import { showMessage, showTempMessage } from './ui.js';
import { fillFormWithApplication } from './formHandlers.js';
import { formatTime, formatDateForDisplay } from './utils.js';
import { createRadioDateScroll, initRadioDateScroll } from './radioDateScroll.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Загружает последние 20 заявок для отображения в списке
 * Обновляет интерфейс с полученными данными
 */
export async function loadRecentApplications() {
    try {
        const response = await fetch(API_ENDPOINTS.RECENT_APPLICATIONS + '?limit=20');
        if (!response.ok) throw new Error(MESSAGES.LOAD_ERROR);
        const applications = await response.json();
        updateRecentApplicationsList(applications);
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        showMessage('Не удалось загрузить последние заявки', 'error');
    }
}

/**
 * Обновляет список последних заявок в интерфейсе
 * @param {Array} applications - Массив заявок для отображения
 */
function updateRecentApplicationsList(applications) {
    const container = document.getElementById('applicationsList');
    if (!container) return;

    container.innerHTML = '';

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-inbox" style="font-size: 1.5rem;"></i>
                <p class="mt-1">${MESSAGES.NO_APPLICATIONS}</p>
            </div>
        `;
        return;
    }

    applications.forEach(app => {
        const appDiv = createApplicationItem(app);
        container.appendChild(appDiv);
    });

    const countElement = document.getElementById('applicationsCount');
    if (countElement) {
        countElement.textContent = applications.length;
    }
}

/**
 * Создает DOM элемент для одной заявки в списке
 * @param {Object} app - Объект заявки
 * @returns {HTMLElement} DOM элемент заявки
 */
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

/**
 * Загружает все заявки для отображения в таблице
 * Кэширует данные для последующего использования
 */
export async function loadAllApplicationsTable() {
    try {
        const response = await fetch('/api/applications');
        if (!response.ok) throw new Error(MESSAGES.LOAD_ERROR);
        const applications = await response.json();

        state.allApplicationsCache = applications;
        state.lastFetchTime = Date.now();

        renderAllApplicationsTable(applications);

    } catch (error) {
        console.error('Ошибка загрузки всех заявок:', error);
        const container = document.getElementById('allApplicationsTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Не удалось загрузить данные. Ошибка: ${error.message}
                </div>
            `;
        }
    }
}

/**
/**
 * Отображает таблицу всех заявок с группировкой по дням
 * @param {Array} applications - Массив всех заявок
 */
export function renderAllApplicationsTable(applications) {
    const container = document.getElementById('allApplicationsTableContainer');
    if (!container) return;

    const groupedByDate = groupApplicationsByDate(applications);

    let html = '';

    // Добавляем радио-прокрутку дат
    const datesForScroll = Object.keys(groupedByDate).map(date => ({
        date: date,
        count: groupedByDate[date].length
    }));

    html += createRadioDateScroll(datesForScroll);

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

    updateAllTableStats(applications);
    attachTableRowHandlers();

    // Инициализируем радио-прокрутку после рендеринга
    setTimeout(() => {
        if (typeof initRadioDateScroll === 'function') {
            initRadioDateScroll();
        }
    }, 100);
}

/**
 * Группирует заявки по дате последнего обновления
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
 * Обновляет статистику таблицы всех заявок
 * @param {Array} applications - Массив заявок
 */
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

/**
 * Загружает заявку по ID и заполняет форму данными
 * Закрывает модальное окно таблицы после загрузки
 * @param {number} id - ID заявки
 */
export async function loadFromTable(id) {
    try {
        const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`);
        if (!response.ok) throw new Error('Заявка не найдена');
        const application = await response.json();

        fillFormWithApplication(application);

        const modalElement = document.getElementById('allApplicationsModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }

        showTempMessage(`Загружена заявка ${application.applicationNumber}`, 'success');
    } catch (error) {
        showTempMessage(`Ошибка: ${error.message}`, 'error');
    }
}

/**
 * Удаляет заявку по ID после подтверждения
 * Обновляет списки заявок после удаления
 * @param {number} id - ID заявки
 * @param {Event} event - Событие клика
 */
export async function deleteApplication(id, event = null) {
    if (event) event.stopPropagation();

    if (!confirm('Удалить заявку? Это действие нельзя отменить.')) {
        return;
    }

    try {
        const response = await fetch(API_ENDPOINTS.DELETE_APPLICATION(id), {
            method: 'DELETE'
        });

        if (response.ok) {
            showTempMessage(MESSAGES.APPLICATION_DELETED, 'success');

            loadRecentApplications();

            state.allApplicationsCache = null;
            state.lastFetchTime = null;

            state.searchResults = [];
            state.isSearchActive = false;

            state.isDateFilterActive = false;
            state.currentDateFilter = null;
        } else {
            throw new Error(MESSAGES.DELETE_ERROR);
        }
    } catch (error) {
        showTempMessage(`${MESSAGES.DELETE_ERROR}: ${error.message}`, 'error');
    }
}

/**
 * Рендерит массив заявок в виде HTML таблицы
 * @param {Array} applications - Массив заявок
 * @param {boolean} showHeader - Показывать заголовок таблицы
 * @returns {string} HTML код таблицы
 */
export function renderApplicationsAsTable(applications, showHeader = true) {
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

/**
 * Настраивает обработчики событий для таблицы заявок
 * Обрабатывает открытие модального окна, поиск и закрытие
 */
export function setupApplicationsTableHandlers() {
    const openAllAppsBtn = document.getElementById('openAllApplicationsBtn');
    if (openAllAppsBtn) {
        openAllAppsBtn.addEventListener('click', function() {
            const modalElement = document.getElementById('allApplicationsModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                setTimeout(() => loadAllApplicationsTable(), 300);
            }
        });
    }

    const allAppsModal = document.getElementById('allApplicationsModal');
    if (allAppsModal) {
        // Инициализируем радио-прокрутку после показа модального окна
        allAppsModal.addEventListener('shown.bs.modal', function() {
            setTimeout(() => {
                if (typeof window.initRadioDateScroll === 'function') {
                    window.initRadioDateScroll();
                }
            }, 500);
        });

        allAppsModal.addEventListener('hidden.bs.modal', function() {
            if (typeof window.clearSearchResults === 'function') {
                window.clearSearchResults();
            }
            if (typeof window.clearDateFilter === 'function') {
                window.clearDateFilter();
            }
            const searchAllTable = document.getElementById('searchAllTable');
            if (searchAllTable) {
                searchAllTable.value = '';
            }
        });
    }

    const searchAllTableInput = document.getElementById('searchAllTable');
    if (searchAllTableInput) {
        searchAllTableInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (typeof window.searchInAllTable === 'function') {
                    window.searchInAllTable();
                }
                e.preventDefault();
            }
        });
    }
}

/**
 * Прикрепляет обработчики событий к строкам таблицы
 * Обрабатывает двойной клик и выделение строк
 */
export function attachTableRowHandlers() {
    const rows = document.querySelectorAll('.app-row');
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

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ
// ============================================

if (typeof window !== 'undefined') {
    window.renderAllApplicationsTable = renderAllApplicationsTable;
    window.loadFromTable = loadFromTable;
    window.deleteApplication = deleteApplication;
    window.loadAllApplicationsTable = loadAllApplicationsTable;
    window.loadRecentApplications = loadRecentApplications;
    window.renderApplicationsAsTable = renderApplicationsAsTable;
    window.attachTableRowHandlers = attachTableRowHandlers;
    window.toggleDateGroup = function(date, forceExpand = false) {
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
    };
    window.scrollToDate = function(date) {
        // Прокручиваем радио-кнопку к выбранной дате
        const chip = document.querySelector(`.date-radio-chip[data-date="${date}"]`);
        if (chip) {
            // Удаляем активный класс у всех чипов
            document.querySelectorAll('.date-radio-chip').forEach(c => {
                c.classList.remove('active');
            });
            // Добавляем активный класс выбранному
            chip.classList.add('active');

            // Центрируем элемент
            const container = document.getElementById('dateRadioScroll');
            if (container && chip) {
                const containerWidth = container.clientWidth;
                const elementLeft = chip.offsetLeft;
                const elementWidth = chip.clientWidth;
                const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);

                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }

        // Прокручиваем страницу к группе заявок
        const element = document.getElementById(`date-${date}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            window.toggleDateGroup(date, true);
        }
    };
}