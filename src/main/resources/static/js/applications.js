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
    setupSearchHandlers,
    applyCombinedFilter,
    clearAllFilters,
    exportCombinedResults,
    smartFilter
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

// НОВЫЕ ФУНКЦИИ ДЛЯ КОМБИНИРОВАННОЙ ФИЛЬТРАЦИИ
window.applyCombinedFilter = applyCombinedFilter;
window.clearAllFilters = clearAllFilters;
window.exportCombinedResults = exportCombinedResults;
window.smartFilter = smartFilter;

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
    clearAllFilters();

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
// ДОПОЛНИТЕЛЬНЫЕ ОБРАБОТЧИКИ ДЛЯ КНОПОК
// ============================================

/**
 * Универсальный обработчик для кнопок фильтрации
 */
function setupUniversalButtonHandlers() {
    // Обработчик для кнопки "Применить фильтры"
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;

        // Проверяем текст кнопки или иконку
        const buttonText = button.textContent || '';
        const buttonIcon = button.querySelector('i');
        const iconClass = buttonIcon ? buttonIcon.className : '';

        // Кнопка "Применить" или "Применить фильтры"
        if (buttonText.includes('Применить') ||
            (buttonIcon && iconClass.includes('bi-funnel'))) {
            e.preventDefault();
            console.log('Кнопка "Применить" нажата через универсальный обработчик');

            // Используем умную фильтрацию
            if (typeof window.smartFilter === 'function') {
                console.log('Вызываем window.smartFilter');
                window.smartFilter();
            } else if (typeof smartFilter === 'function') {
                console.log('Вызываем smartFilter');
                smartFilter();
            } else {
                console.error('Функция smartFilter не найдена');
                alert('Функция фильтрации не загружена. Пожалуйста, обновите страницу.');
            }
        }

        // Кнопка "Сбросить все"
        if (buttonText.includes('Сбросить все') ||
            (buttonIcon && iconClass.includes('bi-x-circle') && !buttonText.includes('Очистить поиск'))) {
            e.preventDefault();
            console.log('Кнопка "Сбросить все" нажата');

            if (typeof window.clearAllFilters === 'function') {
                window.clearAllFilters();
            } else if (typeof clearAllFilters === 'function') {
                clearAllFilters();
            }
        }
    });
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация приложения...');
    console.log('smartFilter доступна?', typeof smartFilter);
    console.log('smartFilter в window?', typeof window.smartFilter);

    // 1. Инициализация основных обработчиков
    setupFormHandlers();
    setupSearchHandlers();
    setupDateFilter();
    setupIssuesTreeHandlers();
    setupApplicationsTableHandlers();

    // 2. НОВЫЕ ОБРАБОТЧИКИ ДЛЯ КОМБИНИРОВАННОЙ ФИЛЬТРАЦИИ
    setupUniversalButtonHandlers();

    // 3. Загрузка начальных данных
    loadRecentApplications();

    // 4. Установка текущей даты по умолчанию
    const installationDateInput = document.querySelector('[name="installationDate"]');
    if (installationDateInput && !installationDateInput.value) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('ru-RU');
        installationDateInput.value = formattedDate;
    }

    // 5. Настройка автообновления
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

    // 6. Инициализация автодополнения
    setupAutocomplete();

    // 7. Закрытие уведомлений через 5 секунд
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // 8. ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Обновляем onclick атрибуты кнопок
    setTimeout(() => {
        const applyButtons = document.querySelectorAll('button');
        applyButtons.forEach(button => {
            if (button.textContent.includes('Применить') ||
                (button.querySelector('i') && button.querySelector('i').classList.contains('bi-funnel'))) {
                button.setAttribute('onclick', 'if (window.smartFilter) window.smartFilter(); else console.error("smartFilter не найдена")');
                console.log('Кнопка "Применить" обновлена на smartFilter');
            }
            if (button.textContent.includes('Сбросить все')) {
                button.setAttribute('onclick', 'if (window.clearAllFilters) window.clearAllFilters();');
            }
        });
    }, 1000);

    console.log('Приложение инициализировано');
});