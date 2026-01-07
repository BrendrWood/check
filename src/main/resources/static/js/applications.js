// ============================================
// ОСНОВНОЙ ФАЙЛ ПРИЛОЖЕНИЯ
// Инициализация и координация всех модулей приложения
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
import { initRadioDateScroll, updateChipOpacity } from './modules/radioDateScroll.js';

// ============================================
// ГЛОБАЛЬНЫЙ ЭКСПОРТ ФУНКЦИЙ
// Функции, доступные для вызова из HTML атрибутов
// ============================================

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
window.initRadioDateScroll = initRadioDateScroll;
window.updateChipOpacity = updateChipOpacity;

// Новая функция для переключения дат по клику на чип
window.toggleDateByChip = toggleDateByChip;

// Функции комбинированной фильтрации
window.applyCombinedFilter = applyCombinedFilter;
window.clearAllFilters = clearAllFilters;
window.exportCombinedResults = exportCombinedResults;
window.smartFilter = smartFilter;

// ============================================
// ФУНКЦИИ ПРИЛОЖЕНИЯ
// ============================================

/**
 * Переключает отображение группы заявок по дате по клику на чип
 * @param {string} date - Дата в формате YYYY-MM-DD
 */
function toggleDateByChip(date) {
    const chip = document.querySelector(`.date-radio-chip[data-date="${date}"]`);
    if (chip) {
        const content = document.getElementById(`content-${date}`);
        const header = document.getElementById(`date-${date}`);

        if (!content || !header) return;

        // Проверяем, открыта ли уже эта группа
        const isCurrentlyExpanded = content.style.display !== 'none';

        // Если группа уже открыта - сворачиваем ее
        if (isCurrentlyExpanded) {
            content.style.display = 'none';
            header.classList.remove('expanded');
            const icon = header.querySelector('.collapse-icon');
            if (icon) {
                icon.classList.remove('bi-chevron-down');
                icon.classList.add('bi-chevron-right');
            }
        } else {
            // Если группа закрыта - открываем и центрируем
            // Убираем активный класс у всех чипов
            document.querySelectorAll('.date-radio-chip').forEach(c => {
                c.classList.remove('active');
            });
            // Добавляем активный класс выбранному
            chip.classList.add('active');

            // Центрируем чип
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

            // Прокручиваем к группе заявок и открываем её
            setTimeout(() => {
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
                content.style.display = 'block';
                header.classList.add('expanded');
                const icon = header.querySelector('.collapse-icon');
                if (icon) {
                    icon.classList.remove('bi-chevron-right');
                    icon.classList.add('bi-chevron-down');
                }

                // Обновляем прозрачность после скролла
                if (typeof window.updateChipOpacity === 'function') {
                    setTimeout(() => window.updateChipOpacity(), 300);
                }
            }, 100);
        }
    }
}

/**
 * Загружает заявку в форму по клику на элемент списка
 * @param {HTMLElement} element - DOM элемент заявки
 */
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

/**
 * Очищает результаты поиска в списке заявок
 * Восстанавливает отображение всех заявок
 */
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

/**
 * Переключает отображение группы заявок по дате
 * Теперь работает как toggle: если открыто - закрывает, если закрыто - открывает
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {boolean} forceExpand - Принудительное разворачивание
 */
function toggleDateGroup(date, forceExpand = false) {
    const content = document.getElementById(`content-${date}`);
    const header = document.getElementById(`date-${date}`);
    const icon = header.querySelector('.collapse-icon');

    // Если forceExpand не задан, используем toggle логику
    if (forceExpand) {
        content.style.display = 'block';
        header.classList.add('expanded');
        icon.classList.remove('bi-chevron-right');
        icon.classList.add('bi-chevron-down');
    } else {
        // Toggle логика
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
}

/**
 * Переключает отображение группы заявок в результатах поиска
 * @param {string} date - Дата в форматре YYYY-MM-DD
 */
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

/**
 * Прокручивает страницу к группе заявок по указанной дате и открывает её
 * @param {string} date - Дата в формате YYYY-MM-DD
 */
function scrollToDate(date) {
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

            // Обновляем прозрачность после скролла
            setTimeout(() => {
                if (typeof window.updateChipOpacity === 'function') {
                    window.updateChipOpacity();
                }
            }, 300);
        }
    }

    // Прокручиваем страницу к группе заявок и открываем её
    const element = document.getElementById(`date-${date}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.toggleDateGroup(date, true);  // Всегда открываем при скролле
    }
}

/**
 * Сбрасывает все фильтры и показывает полный список заявок
 * Очищает состояние поиска и загружает все заявки заново
 */
function showAllApplications() {
    clearAllFilters();

    const dateInput = document.getElementById('dateFilter');
    if (dateInput) {
        dateInput.value = '';
    }

    state.isSearchActive = false;
    state.isDateFilterActive = false;
    state.currentDateFilter = null;
    state.searchResults = [];

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

    setTimeout(() => {
        loadAllApplicationsTable();
    }, 100);
}

// ============================================
// ОБРАБОТЧИКИ КНОПОК ФИЛЬТРАЦИИ
// ============================================

/**
 * Настраивает универсальные обработчики для кнопок фильтрации
 * Обрабатывает кнопки "Применить" и "Сбросить все" по всему приложению
 */
function setupUniversalButtonHandlers() {
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;

        const buttonText = button.textContent || '';
        const buttonIcon = button.querySelector('i');
        const iconClass = buttonIcon ? buttonIcon.className : '';

        if (buttonText.includes('Применить') ||
            (buttonIcon && iconClass.includes('bi-funnel'))) {
            e.preventDefault();
            console.log('Кнопка "Применить" нажата через универсальный обработчик');

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

/**
 * Основная функция инициализации приложения
 * Выполняется после полной загрузки DOM дерева
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация приложения...');
    console.log('smartFilter доступна?', typeof smartFilter);
    console.log('smartFilter в window?', typeof window.smartFilter);

    // Инициализация основных обработчиков
    setupFormHandlers();
    setupSearchHandlers();
    setupDateFilter();
    setupIssuesTreeHandlers();
    setupApplicationsTableHandlers();

    // Настройка обработчиков для комбинированной фильтрации
    setupUniversalButtonHandlers();

    // Загрузка начальных данных
    loadRecentApplications();

    // Установка текущей даты по умолчанию в поле даты монтажа
    const installationDateInput = document.querySelector('[name="installationDate"]');
    if (installationDateInput && !installationDateInput.value) {
        const today = new Date();
        const formattedDate = today.toLocaleDateString('ru-RU');
        installationDateInput.value = formattedDate;
    }

    // Настройка автоматического обновления списка заявок
    const switchElement = document.getElementById('autoRefreshSwitch');
    if (switchElement) {
        switchElement.addEventListener('change', function() {
            if (this.checked) {
                state.autoRefreshInterval = setInterval(() => {
                    loadRecentApplications();
                    showMessage('Список обновлен', 'info');
                }, 30000);
            } else {
                if (state.autoRefreshInterval) {
                    clearInterval(state.autoRefreshInterval);
                    state.autoRefreshInterval = null;
                }
            }
        });
    }

    // Инициализация автодополнения для поля причины проблем с интернетом
    setupAutocomplete();

    // Автоматическое закрытие уведомлений через 5 секунд
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Обновление onclick атрибутов кнопок для совместимости
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