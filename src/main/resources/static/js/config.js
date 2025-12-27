// ============================================
// КОНФИГУРАЦИЯ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

// Константы приложения
export const CACHE_DURATION = 5 * 60 * 1000; // 5 минут кэширования

// Глобальные переменные состояния
export const state = {
    selectedIssues: new Set(),
    issuesTreeInitialized: false,
    allApplicationsCache: null,
    lastFetchTime: null,
    autoRefreshInterval: null,
    searchResults: [],
    isSearchActive: false,
    isDateFilterActive: false,
    currentDateFilter: null,
    forceRefreshNeeded: false
};

// Селекторы DOM элементов (для удобства)
export const SELECTORS = {
    // Форма и основные элементы
    APPLICATION_FORM: '#applicationForm',
    SEARCH_FORM: '#searchForm',
    SEARCH_INPUT: '#searchInput',
    APP_NUMBER_FIELD: '#appNumberField',
    APP_ID_FIELD: '#appId',

    // Модальные окна
    ISSUES_TREE_MODAL: '#issuesTreeModal',
    ALL_APPLICATIONS_MODAL: '#allApplicationsModal',

    // Контейнеры
    APPLICATIONS_LIST: '#applicationsList',
    ISSUES_TREE_CONTAINER: '#issuesTreeContainer',
    ALL_APPLICATIONS_TABLE: '#allApplicationsTableContainer',

    // Поиск
    SEARCH_ALL_TABLE: '#searchAllTable',
    SEARCH_LIST_INPUT: '#searchListInput',
    SEARCH_ISSUES_INPUT: '#searchIssuesInput',

    // Фильтры
    DATE_FILTER: '#dateFilter',
    CLEAR_DATE_FILTER_BTN: '#clearDateFilterBtn',

    // Поля формы
    COMMENTS_FIELD: '#commentsField',
    INTERNET_REASON: '#internetReason',
    INTERNET_REASON_AUTOCOMPLETE: '#internetReasonAutocomplete',

    // Кнопки
    COPY_COMMENTS_BTN: '#copyCommentsBtn',
    OPEN_ISSUES_TREE_BTN: '#openIssuesTreeBtn',
    OPEN_ALL_APPLICATIONS_BTN: '#openAllApplicationsBtn',
    AUTO_REFRESH_SWITCH: '#autoRefreshSwitch',

    // Информационные элементы
    APPLICATIONS_COUNT: '#applicationsCount',
    SELECTED_ISSUES_INFO: '#selectedIssuesInfo',
    SELECTED_COUNT: '#selectedCount',
    ALL_TABLE_STATS: '#allTableStats',
    SEARCH_LIST_INFO: '#searchListInfo',

    INSTALLATION_DATE: '[name="installationDate"]',
    DATE_FILTER_STATS: '#dateFilterStats'
};

// API endpoints
export const API_ENDPOINTS = {
    APPLICATIONS: '/api/applications',
    RECENT_APPLICATIONS: '/api/applications/recent',
    EXPORT_ALL: '/api/applications/export',
    EXPORT_TODAY: '/api/applications/export/today',
    EXPORT_DATE: (date) => `/api/applications/export/date/${date}`,
    EXPORT_SEARCH: '/api/applications/export/search',
    DELETE_APPLICATION: (id) => `/api/applications/${id}`,
    ALL_APPLICATIONS: '/api/applications/all'
};

// Сообщения приложения
export const MESSAGES = {
    NO_COMMENTS: 'Нет комментариев для копирования',
    COPIED_SUCCESS: 'Комментарии скопированы в буфер обмена',
    COPY_ERROR: 'Не удалось скопировать комментарии',
    NO_ISSUES_SELECTED: 'Не выбрано ни одного нарушения',
    ISSUES_ADDED: (count) => `Добавлено ${count} нарушений в комментарии`,
    APPLICATION_DELETED: 'Заявка удалена',
    DELETE_ERROR: 'Ошибка удаления',
    LOAD_ERROR: 'Не удалось загрузить данные',
    NO_APPLICATIONS: 'Нет заявок',
    NO_SEARCH_RESULTS: 'Нарушения не найдены',
    EXPAND_ALL: 'Все категории развернуты',
    COLLAPSE_ALL: 'Все категории свернуты',
    DATE_REQUIRED: 'Выберите дату для фильтрации',
    NO_APPLICATIONS_DATE: (date) => `Нет заявок, отредактированных ${date}`,
    NO_EXPORT_DATA: 'Нет результатов для экспорта'
};

// Классы CSS (для динамического добавления/удаления)
export const CSS_CLASSES = {
    ADDED: 'added',
    HIDDEN: 'hidden',
    HIGHLIGHTED: 'highlighted',
    EXPANDED: 'expanded',
    ACTIVE: 'autocomplete-active',
    INVALID: 'is-invalid'
};

// Конфигурация дерева нарушений (можно вынести из issuesTree.js если нужно)
export const ISSUES_TREE_CONFIG = {
    CATEGORY_HEADER_CLASS: 'category-header',
    SUBCATEGORY_HEADER_CLASS: 'subcategory-header',
    CATEGORY_CONTENT_CLASS: 'category-content',
    SUBCATEGORY_CONTENT_CLASS: 'subcategory-content',
    ISSUE_BUTTON_CLASS: 'issue-button-tree',
    COLLAPSE_ICON_CLASS: 'collapse-icon'
};