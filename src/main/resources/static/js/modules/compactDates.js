// compactDates.js - Только компактизация дат, без изменения логики

/**
 * Добавить компактные классы при большом количестве дней
 */
export function optimizeDateDisplay() {
    const dateNavigation = document.getElementById('dateNavigation');
    if (!dateNavigation) return;

    const dateChips = dateNavigation.querySelectorAll('.date-chip');
    const dateCount = dateChips.length;

    // Автоматически добавляем компактные классы
    if (dateCount > 20) {
        dateNavigation.classList.add('many-days');
    }

    if (dateCount > 50) {
        dateNavigation.classList.add('very-many-days');
    }

    // Добавляем title для компактных дат
    dateChips.forEach(chip => {
        if (!chip.getAttribute('title')) {
            const text = chip.textContent.replace(/\s+/g, ' ').trim();
            chip.setAttribute('title', text);
        }
    });
}

/**
 * Автоматически развернуть сегодняшний день
 */
export function autoExpandToday() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Сначала пытаемся развернуть сегодня
    const todayElement = document.getElementById(`date-${todayStr}`);
    if (todayElement) {
        setTimeout(() => {
            window.toggleDateGroup(todayStr, true);
            todayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
        return;
    }

    // Если сегодня нет, разворачиваем вчера
    const yesterdayElement = document.getElementById(`date-${yesterdayStr}`);
    if (yesterdayElement) {
        setTimeout(() => {
            window.toggleDateGroup(yesterdayStr, true);
        }, 300);
        return;
    }

    // Иначе разворачиваем первую дату
    const firstDateGroup = document.querySelector('.date-group');
    if (firstDateGroup) {
        const firstDate = firstDateGroup.id.replace('date-', '');
        setTimeout(() => {
            window.toggleDateGroup(firstDate, true);
        }, 300);
    }
}

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
    window.optimizeDateDisplay = optimizeDateDisplay;
    window.autoExpandToday = autoExpandToday;
}