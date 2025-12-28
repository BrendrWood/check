// ============================================
// МОДУЛЬ ФИЛЬТРАЦИИ ПО ДАТЕ
// ============================================

import { state, MESSAGES } from '../config.js';
import { showMessageInModal, showTempMessage } from './ui.js';
import { renderApplicationsAsTable, attachTableRowHandlers, loadAllApplicationsTable } from './applicationsTable.js';
import { formatDateForDisplay } from './utils.js';

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Фильтрация заявок по дате редактирования/создания
 */
export async function filterByDate() {
    const dateInput = document.getElementById('dateFilter');
    const selectedDate = dateInput.value;
    const searchTerm = document.getElementById('searchAllTable').value.trim();

    // Если есть поисковый запрос - используем умную фильтрацию
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
        // Показать индикатор загрузки
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

        // 1. Получаем все заявки (обязательно свежие)
        let applications;

        // Сбрасываем кэш для гарантии свежих данных
        state.allApplicationsCache = null;
        state.lastFetchTime = null;

        const response = await fetch('/api/applications');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        applications = await response.json();

        // Сохраняем в кэш
        state.allApplicationsCache = applications;
        state.lastFetchTime = Date.now();

        // 2. Фильтруем заявки по дате lastUpdated
        const filteredApplications = applications.filter(app => {
            if (!app.lastUpdated) return false;

            // Преобразуем дату из формата БД
            const appDate = new Date(app.lastUpdated);
            const selected = new Date(selectedDate);

            // Сравниваем только год, месяц, день (игнорируем время)
            return appDate.getFullYear() === selected.getFullYear() &&
                   appDate.getMonth() === selected.getMonth() &&
                   appDate.getDate() === selected.getDate();
        });

        // 3. Если нет результатов
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

        // 4. Сохраняем отфильтрованные заявки для экспорта
        state.dateFilteredApplications = filteredApplications;
        state.currentDateFilter = selectedDate;
        state.currentSearchTerm = ''; // Очищаем поисковый запрос
        state.isDateFilterActive = true;
        state.isSearchActive = false;
        state.searchResults = filteredApplications;

        // 5. Показываем результаты
        displayDateFilterResults(filteredApplications, selectedDate);

        // 6. Показываем кнопку очистки
        const clearBtn = document.getElementById('clearDateFilterBtn');
        if (clearBtn) {
            clearBtn.style.display = 'inline-block';
        }

        // 7. Обновляем статистику
        updateDateFilterStats(filteredApplications.length, selectedDate);

    } catch (error) {
        console.error('Ошибка фильтрации по дате:', error);
        showMessageInModal(`Ошибка: ${error.message}`, 'error');

        // Показываем кнопку для возврата
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
 * Отображение результатов фильтрации по дате
 */
function displayDateFilterResults(applications, selectedDate) {
    const container = document.getElementById('allApplicationsTableContainer');
    const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
    });

    // Используем dataset для хранения даты вместо передачи в onclick
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

    // Показываем таблицу
    html += renderApplicationsAsTable(applications, true);

    container.innerHTML = html;

    // Добавить обработчик для кнопки экспорта
    const exportButton = document.getElementById(exportButtonId);
    if (exportButton) {
        exportButton.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            exportDateFilterResults(date);
        });
    }

    // Добавить обработчики для строк
    attachTableRowHandlers();
}

/**
 * Обновление статистики фильтра даты
 */
function updateDateFilterStats(count, selectedDate) {
    const statsElement = document.getElementById('allTableStats');

    if (!statsElement) return;

    const formattedDate = new Date(selectedDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Используем dataset для хранения даты вместо передачи в onclick
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

    // Добавить обработчик для кнопки экспорта в статистике
    const exportStatsButton = document.getElementById(exportButtonId);
    if (exportStatsButton) {
        exportStatsButton.addEventListener('click', function() {
            const date = this.getAttribute('data-date');
            exportDateFilterResults(date);
        });
    }
}

/**
 * Экспорт результатов фильтра по дате - РАБОЧАЯ ВЕРСИЯ
 */
export function exportDateFilterResults(date) {
    // Получаем дату из параметра или из state
    let exportDate = date;

    if (!exportDate || exportDate === 'undefined' || exportDate === 'null') {
        // Пытаемся получить дату из state
        exportDate = state.currentDateFilter;

        if (!exportDate) {
            console.error('Некорректная дата для экспорта');
            showTempMessage('Ошибка: дата не определена. Выберите дату фильтра.', 'error');
            return;
        }
    }

    console.log('Exporting for date:', exportDate);

    // Проверяем, есть ли заявки для этой даты
    if (!state.dateFilteredApplications || state.dateFilteredApplications.length === 0) {
        showTempMessage('Нет данных для экспорта', 'warning');
        return;
    }

    // Создаем форму для экспорта как в exportSearchResults
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/applications/export/search';
    form.style.display = 'none';
    form.target = '_blank';

    // Подготавливаем ID заявок
    const ids = state.dateFilteredApplications.map(app => app.id);

    // Добавляем результаты поиска
    const searchResultsInput = document.createElement('input');
    searchResultsInput.type = 'hidden';
    searchResultsInput.name = 'searchResults';
    searchResultsInput.value = JSON.stringify(ids);
    form.appendChild(searchResultsInput);

    // Добавляем название поиска
    const searchNameInput = document.createElement('input');
    searchNameInput.type = 'hidden';
    searchNameInput.name = 'searchName';
    searchNameInput.value = `applications_${exportDate.replace(/-/g, '')}`;
    form.appendChild(searchNameInput);

    // Добавляем форму на страницу
    document.body.appendChild(form);

    // Показываем сообщение
    showTempMessage('Начинается экспорт файла...', 'info');

    // Отправляем форму
    form.submit();

    // Удаляем форму
    setTimeout(() => {
        if (form.parentNode) {
            form.parentNode.removeChild(form);
        }
    }, 1000);
}

/**
 * Показать все заявки (заменяет clearDateFilter)
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

    // Очищаем состояние фильтра
    state.isDateFilterActive = false;
    state.currentDateFilter = null;
    state.dateFilteredApplications = null; // Очищаем кэш отфильтрованных заявок
    state.currentSearchTerm = '';

    // Очищаем поиск
    state.searchResults = [];
    state.isSearchActive = false;

    // Очищаем поле поиска
    const searchInput = document.getElementById('searchAllTable');
    if (searchInput) {
        searchInput.value = '';
    }

    // Полностью очищаем контейнер
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

    // Загружаем все заявки
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
 * Старая функция clearDateFilter - теперь просто вызывает showAllApplications
 */
export function clearDateFilter() {
    showAllApplications();
}

/**
 * Настройка обработчиков для фильтра по дате
 */
export function setupDateFilter() {
    const dateInput = document.getElementById('dateFilter');
    if (dateInput) {
        // Обработка нажатия Enter в поле даты
        dateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                // При нажатии Enter вызываем умную фильтрацию
                if (typeof window.smartFilter === 'function') {
                    window.smartFilter();
                }
                e.preventDefault();
            }
        });

        // УБИРАЕМ автоматический фильтр при выборе даты!
        // Теперь дата выбирается, но фильтрация не применяется автоматически
        // Пользователь должен нажать кнопку "Применить"
    }
}

// ============================================
// ДОБАВЛЯЕМ ФУНКЦИИ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// ============================================

if (typeof window !== 'undefined') {
    window.showAllApplications = showAllApplications;
    window.filterByDate = filterByDate;
    window.clearDateFilter = clearDateFilter;
    window.exportDateFilterResults = exportDateFilterResults;
}