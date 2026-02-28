// ============================================
// МОДУЛЬ УПРАВЛЕНИЯ ТЕМОЙ
// Переключение между светлой и темной темой
// ============================================

const THEME_STORAGE_KEY = 'onlinecheck_theme';

/**
 * Инициализирует тему при загрузке страницы
 * Загружает сохраненную тему из localStorage или определяет системные настройки
 */
export function initTheme() {
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    if (savedTheme) {
        // Применяем сохраненную тему
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeSwitch(savedTheme === 'dark');
    } else {
        // Если нет сохраненной темы, проверяем системные настройки
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateThemeSwitch(true);
        }
    }
}

/**
 * Переключает между светлой и темной темой
 * @param {boolean} isDark - true для темной темы, false для светлой
 */
export function toggleTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    
    // Применяем тему
    document.documentElement.setAttribute('data-theme', theme);
    
    // Сохраняем в localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    
    // Обновляем иконку на переключателе
    updateThemeIcon(isDark);
}

/**
 * Обновляет состояние переключателя темы
 * @param {boolean} isDark - true если темная тема активна
 */
function updateThemeSwitch(isDark) {
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.checked = isDark;
        updateThemeIcon(isDark);
    }
}

/**
 * Обновляет иконку на переключателе темы
 * @param {boolean} isDark - true если темная тема активна
 */
function updateThemeIcon(isDark) {
    const themeLabel = document.querySelector('label[for="themeSwitch"]');
    if (themeLabel) {
        if (isDark) {
            themeLabel.innerHTML = '<i class="bi bi-sun"></i> Светлая тема';
        } else {
            themeLabel.innerHTML = '<i class="bi bi-moon-stars"></i> Темная тема';
        }
    }
}

/**
 * Настраивает обработчики для переключателя темы
 */
export function setupThemeHandlers() {
    const themeSwitch = document.getElementById('themeSwitch');
    
    if (themeSwitch) {
        themeSwitch.addEventListener('change', function(e) {
            toggleTheme(e.target.checked);
        });
    }
    
    // Следим за изменением системной темы
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Меняем тему только если пользователь не сохранял свою
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            toggleTheme(e.matches);
        }
    });
}

// Глобальный экспорт для обратной совместимости
if (typeof window !== 'undefined') {
    window.toggleTheme = toggleTheme;
    window.initTheme = initTheme;
}
