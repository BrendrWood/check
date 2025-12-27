// ============================================
// МОДУЛЬ ПОЛЬЗОВАТЕЛЬСКОГО ИНТЕРФЕЙСА
// ============================================

// ============================================
// ЭКСПОРТИРУЕМЫЕ ФУНКЦИИ
// ============================================

/**
 * Показать сообщение на основной странице
 */
export function showMessage(text, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show py-2 mt-2`;
    alertDiv.innerHTML = `
        <i class="bi bi-${icon}"></i> ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Добавляем перед формой
    const form = document.getElementById('applicationForm');
    if (!form) return;

    const existingAlerts = form.parentNode.querySelectorAll('.alert:not(.alert-dismissible)');
    const firstExistingAlert = existingAlerts.length > 0 ? existingAlerts[existingAlerts.length - 1] : null;

    if (firstExistingAlert && firstExistingAlert.nextSibling) {
        form.parentNode.insertBefore(alertDiv, firstExistingAlert.nextSibling);
    } else {
        form.parentNode.insertBefore(alertDiv, form);
    }

    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * Показать сообщение в модальном окне
 */
export function showMessageInModal(text, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    // Удаляем предыдущие сообщения
    const existingAlerts = document.querySelectorAll('#issuesTreeModal .alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show py-2 mt-2`;
    alertDiv.innerHTML = `
        <i class="bi bi-${icon}"></i> ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Добавляем в начало тела модального окна
    const modalBody = document.querySelector('#issuesTreeModal .modal-body');
    if (!modalBody) return;

    modalBody.insertBefore(alertDiv, modalBody.firstChild);

    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 3000);
}

/**
 * Функция для показа уведомления о копировании
 */
export function showCopyNotification(message, type = 'success') {
    // Удаляем предыдущее уведомление, если есть
    const existingNotification = document.getElementById('copyNotification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.id = 'copyNotification';
    notification.className = `copy-notification ${type === 'error' ? 'error' : ''}`;
    notification.innerHTML = `
        <i class="bi ${type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i>
        <span>${message}</span>
    `;

    // Добавляем на страницу
    document.body.appendChild(notification);

    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Функция для показа временных сообщений
 */
export function showTempMessage(text, type) {
    // Создаем контейнер для сообщений, если его нет
    let messageContainer = document.getElementById('tempMessageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'tempMessageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(messageContainer);
    }

    // Создаем сообщение
    const message = document.createElement('div');
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info';
    message.className = `alert alert-${alertClass} alert-dismissible fade show`;
    message.innerHTML = `
        <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${text}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    // Добавляем в контейнер
    messageContainer.appendChild(message);

    // Удаляем через 5 секунд
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}