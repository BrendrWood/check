// ============================================
// ОСНОВНОЙ ФАЙЛ ПРИЛОЖЕНИЯ
// Инициализация и координация модулей
// ============================================

// Импорт модулей
import { state, SELECTORS, API_ENDPOINTS, MESSAGES } from './config.js';
import {
    initIssuesTree,
    openIssuesTreeModal,
    setupIssuesTreeHandlers,
    expandAllCategories,
    collapseAllCategories,
    addSelectedIssuesToComments,
    clearSelectedIssues,
    searchIssues,
    clearIssuesSearch
} from './modules/issuesTree.js';
import {
    loadRecentApplications,
    loadAllApplicationsTable,
    setupApplicationsTableHandlers,
    loadFromTable,
    deleteApplication,
    renderAllApplicationsTable
} from './modules/applicationsTable.js';
import {
    filterByDate,
    clearDateFilter,
    setupDateFilter
} from './modules/dateFilter.js';
import {
    searchInAllTable,
    searchInList,
    clearSearchResults,
    setupSearchHandlers
} from './modules/search.js';
import {
    setupFormHandlers,
    fillFormWithApplication,
    setupAutocomplete,
    copyCommentsToClipboard
} from './modules/formHandlers.js';
import {
    exportSingle,
    exportAllToExcel,
    exportDateFilterResults,
    exportSearchResults
} from './modules/export.js';
import {
    showMessage,
    showMessageInModal,
    showCopyNotification,
    showTempMessage
} from './modules/ui.js';
import {
    formatTime,
    formatDateForDisplay,
    escapeRegExp
} from './modules/utils.js';

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ ФУНКЦИЙ (для вызова из HTML)
// ============================================

// Экспортируем функции, которые вызываются из onclick атрибутов
window.copyCommentsToClipboard = copyCommentsToClipboard;
window.exportSingle = exportSingle;
window.exportAllToExcel = exportAllToExcel;
window.searchInList = searchInList;
window.clearListSearch = clearListSearch;
window.openIssuesTree = openIssuesTreeModal;
window.loadFromTable = loadFromTable;
window.deleteApplication = deleteApplication;
window.searchInAllTable = searchInAllTable;
window.clearSearchResults = clearSearchResults;
window.filterByDate = filterByDate;
window.clearDateFilter = clearDateFilter;
window.showAllApplications = showAllApplications;
window.exportDateFilterResults = exportDateFilterResults;
window.exportSearchResults = exportSearchResults;
window.toggleDateGroup = toggleDateGroup;
window.toggleSearchDateGroup = toggleSearchDateGroup;
window.scrollToDate = scrollToDate;
window.expandAllCategories = expandAllCategories;
window.collapseAllCategories = collapseAllCategories;
window.addSelectedIssuesToComments = addSelectedIssuesToComments;
window.clearSelectedIssues = clearSelectedIssues;
window.searchIssues = searchIssues;
window.clearIssuesSearch = clearIssuesSearch;
window.loadApplication = loadApplication;
window.renderAllApplicationsTable = renderAllApplicationsTable;

// ============================================
// ФУНКЦИИ, КОТОРЫЕ НУЖНО ОСТАВИТЬ ЗДЕСЬ
// ============================================

function loadApplication(element) {
    const number = element.getAttribute('data-number');
    if (number && number !== 'null' && number !== '') {
        document.getElementById('searchInput').value = number;
        const form = document.getElementById('searchForm');
        if (form) {
            form.submit();
        }
    }
}

function clearListSearch() {
    const searchInput = document.getElementById('searchListInput');
    const appItems = document.querySelectorAll('.application-item');
    const searchInfo = document.getElementById('searchListInfo');
    const applicationsCount = document.getElementById('applicationsCount');
    const totalCount = appItems.length;

    searchInput.value = '';
    appItems.forEach(item => {
        item.classList.remove('hidden');
        item.classList.remove('highlighted');
    });
    searchInfo.style.display = 'none';
    applicationsCount.textContent = totalCount;
    searchInput.focus();
}

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

function scrollToDate(date) {
    const element = document.getElementById(`date-${date}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.toggleDateGroup(date, true);
    }
}

function showAllApplications() {
    // Очищаем поиск
    clearSearchResults();

    // Очищаем фильтр даты
    const dateInput = document.getElementById('dateFilter');
    if (dateInput) {
        dateInput.value = '';
    }

    // Сбрасываем состояние
    state.isSearchActive = false;
    state.isDateFilterActive = false;
    state.currentDateFilter = null;
    state.searchResults = [];

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

    // Загружаем все заявки
    setTimeout(() => {
        loadAllApplicationsTable();
    }, 100);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация приложения...');

    // 1. Инициализация основных обработчиков
    setupFormHandlers();
    setupSearchHandlers();
    setupDateFilter();
    setupIssuesTreeHandlers();
    setupApplicationsTableHandlers();

    // 2. Загрузка начальных данных
    loadRecentApplications();

    // 3. Установка текущей даты по умолчанию
    const installationDateInput = document.querySelector('[name="installationDate"]');
    if (installationDateInput && !installationDateInput.value) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('ru-RU');
        installationDateInput.value = formattedDate;
    }

    // 4. Настройка автообновления
    const switchElement = document.getElementById('autoRefreshSwitch');
    if (switchElement) {
        switchElement.addEventListener('change', function() {
            if (this.checked) {
                state.autoRefreshInterval = setInterval(() => {
                    loadRecentApplications();
                    showMessage('Список обновлен', 'info');
                }, 30000); // 30 секунд
            } else {
                if (state.autoRefreshInterval) {
                    clearInterval(state.autoRefreshInterval);
                    state.autoRefreshInterval = null;
                }
            }
        });
    }

    // 5. Инициализация автодополнения
    setupAutocomplete();

    // 6. Закрытие уведомлений через 5 секунд
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // 7. Оптимизация отображения дат после загрузки таблицы
    // Добавляем обработчик для событий загрузки таблицы
    const allAppsModal = document.getElementById('allApplicationsModal');
    if (allAppsModal) {
        allAppsModal.addEventListener('shown.bs.modal', function() {
            // Ждем завершения анимации и загрузки данных
            setTimeout(() => {
                // 8. Инициализация радио-прокрутки дат (если много дней)
                if (state.datesArray && state.datesArray.length > 10) {
                    // Динамически импортируем модуль
                    import('./modules/radioDateScroll.js').then(module => {
                        const container = document.getElementById('dateRadioScrollContainer');
                        if (container) {
                            container.innerHTML = module.createRadioDateScroll(state.datesArray);
                            module.initRadioDateScroll();
                        }
                    }).catch(error => {
                        console.warn('Модуль radioDateScroll не загружен:', error);
                        // Если модуль не загрузился, показываем стандартную навигацию
                        const oldNav = document.getElementById('dateNavigation');
                        if (oldNav) {
                            oldNav.style.display = 'block';
                        }
                    });
                }
            }, 500);
        });
    }

    console.log('Приложение инициализировано');
});