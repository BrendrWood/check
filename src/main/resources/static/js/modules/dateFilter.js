// ============================================
// МОДУЛЬ ФИЛЬТРАЦИИ ПО ДАТЕ
// ============================================

import { state, MESSAGES } from '../config.js';
import { showMessageInModal, showTempMessage } from './ui.js';
import { renderApplicationsAsTable, attachTableRowHandlers, loadAllApplicationsTable, renderAllApplicationsTable } from './applicationsTable.js';
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

        // 4. Показываем результаты
        displayDateFilterResults(filteredApplications, selectedDate);

        // 5. Сохраняем как активный фильтр
        state.isDateFilterActive = true;
        state.currentDateFilter = selectedDate;

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
                                onclick="exportDateFilterResults('${selectedDate}')">
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

    statsElement.innerHTML = `
        <i class="bi bi-calendar-check"></i>
        Активный фильтр: <strong>${formattedDate}</strong> |
        Найдено: <strong>${count}</strong> заявок
        <button class="btn btn-sm btn-outline-success ms-2"
                onclick="exportDateFilterResults('${selectedDate}')">
            <i class="bi bi-file-earmark-excel"></i> Экспорт
        </button>
        <button class="btn btn-sm btn-outline-danger ms-2" onclick="showAllApplications()">
            <i class="bi bi-x-circle"></i> Показать все
        </button>
    `;
}

/**
 * Экспорт результатов фильтра по дате
 */
export function exportDateFilterResults(date) {
    const exportDate = date.replace(/-/g, '');
    const fileName = `applications_${exportDate}.xlsx`;
    const url = `/api/applications/export/date/${date}`;

    // Создаем скрытую ссылку для скачивания
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        // Сбрасываем кэш и загружаем заново
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
                filterByDate();
                e.preventDefault();
            }
        });

        // Автоматический фильтр при выборе даты из календаря
        dateInput.addEventListener('change', function() {
            if (this.value) {
                filterByDate();
            }
        });
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