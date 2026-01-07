// ============================================
// МОДУЛЬ ПОЛЬЗОВАТЕЛЬСКОГО ИНТЕРФЕЙСА
// Функции для отображения сообщений и уведомлений
// ============================================

/**
 * Показывает сообщение на основной странице
 * @param {string} text - Текст сообщения
 * @param {string} type - Тип сообщения: 'info', 'success', 'warning', 'error'
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

    const form = document.getElementById('applicationForm');
    if (!form) return;

    const existingAlerts = form.parentNode.querySelectorAll('.alert:not(.alert-dismissible)');
    const firstExistingAlert = existingAlerts.length > 0 ? existingAlerts[existingAlerts.length - 1] : null;

    if (firstExistingAlert && firstExistingAlert.nextSibling) {
        form.parentNode.insertBefore(alertDiv, firstExistingAlert.nextSibling);
    } else {
        form.parentNode.insertBefore(alertDiv, form);
    }

    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}

/**
 * Показывает сообщение внутри модального окна
 * @param {string} text - Текст сообщения
 * @param {string} type - Тип сообщения: 'info', 'success', 'warning', 'error'
 */
export function showMessageInModal(text, type = 'info') {
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info';
    const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    const existingAlerts = document.querySelectorAll('#issuesTreeModal .alert');
    existingAlerts.forEach(alert => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${alertClass} alert-dismissible fade show py-2 mt-2`;
    alertDiv.innerHTML = `
        <i class="bi bi-${icon}"></i> ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const modalBody = document.querySelector('#issuesTreeModal .modal-body');
    if (!modalBody) return;

    modalBody.insertBefore(alertDiv, modalBody.firstChild);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 3000);
}

/**
 * Показывает уведомление о копировании в буфер обмена
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип уведомления: 'success' или 'error'
 */
export function showCopyNotification(message, type = 'success') {
    const existingNotification = document.getElementById('copyNotification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'copyNotification';
    notification.className = `copy-notification ${type === 'error' ? 'error' : ''}`;
    notification.innerHTML = `
        <i class="bi ${type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Показывает временное сообщение в правом верхнем углу экрана
 * @param {string} text - Текст сообщения
 * @param {string} type - Тип сообщения: 'info', 'success', 'error'
 */
export function showTempMessage(text, type) {
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

    const message = document.createElement('div');
    const alertClass = type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info';
    message.className = `alert alert-${alertClass} alert-dismissible fade show`;
    message.innerHTML = `
        <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        ${text}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    messageContainer.appendChild(message);

    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}