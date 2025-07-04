// Исправления для PWA
document.addEventListener('DOMContentLoaded', function() {
    // Исправляем z-index для сегодняшнего дня
    const today = document.querySelector('.calendar-day.today');
    if (today) {
        today.style.position = 'relative';
        today.style.zIndex = '100';
        today.style.boxShadow = 'inset 0 0 0 3px #007aff';
    }
    
    // Исправляем отображение отпусков
    fixVacationDisplay();
    
    // Добавляем кнопку отчетов
    addReportsButton();
});

function fixVacationDisplay() {
    // Перерендериваем календарь с правильным отображением отпусков
    setTimeout(() => {
        const vacationEvents = document.querySelectorAll('.event.vacation');
        vacationEvents.forEach(event => {
            // Проверяем, что отпуск отображается только в нужные дни
            const eventText = event.textContent;
            if (eventText.includes('Кузнецов') && !shouldShowVacationOnDay(event)) {
                event.style.display = 'none';
            }
        });
    }, 1000);
}

function shouldShowVacationOnDay(eventElement) {
    // Логика проверки должен ли отпуск показываться в этот день
    const parentDay = eventElement.closest('.calendar-day');
    if (!parentDay) return false;
    
    // Получаем номер дня
    const dayNumber = parentDay.querySelector('.day-number');
    if (!dayNumber) return false;
    
    const day = parseInt(dayNumber.textContent);
    
    // Показываем отпуск только в нужные дни (например, 6-13 июля)
    return day >= 6 && day <= 13;
}

function addReportsButton() {
    // Добавляем кнопку быстрых отчетов
    const header = document.querySelector('.upcoming-events');
    if (header && currentUser && currentUser.role === 'manager') {
        const reportsBtn = document.createElement('button');
        reportsBtn.textContent = '📊 Отчет';
        reportsBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 60px;
            background: #17a2b8;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 1000;
        `;
        reportsBtn.onclick = generateQuickReport;
        header.style.position = 'relative';
        header.appendChild(reportsBtn);
    }
}

function generateQuickReport() {
    try {
        // Собираем данные за последнюю неделю
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const reportData = {
            period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
            events: events.filter(e => {
                const eventDate = new Date(e.date || e.startDate);
                return eventDate >= startDate && eventDate <= endDate;
            }),
            teams: teams.length,
            employees: employees.length
        };
        
        // Создаем CSV контент
        let csvContent = 'Отчет за период,' + reportData.period + '\n\n';
        csvContent += 'Дата,Тип,Бригада/Сотрудник,Адрес\n';
        
        reportData.events.forEach(event => {
            const date = event.date || event.startDate;
            const type = getEventTypeName(event.type);
            const team = event.teamId ? getTeamName(event.teamId) : getEmployeeName(event.employeeId);
            const address = event.address || 'Отпуск';
            
            csvContent += `${date},${type},${team},"${address}"\n`;
        });
        
        csvContent += '\n\nСтатистика:\n';
        csvContent += `Всего событий,${reportData.events.length}\n`;
        csvContent += `Бригад,${reportData.teams}\n`;
        csvContent += `Сотрудников,${reportData.employees}\n`;
        
        // Скачиваем файл
        downloadCSV(csvContent, `Отчет_${formatDate(new Date())}.csv`);
        
        showNotification('Отчет создан и скачан!');
        
    } catch (error) {
        console.error('Ошибка создания отчета:', error);
        showNotification('Ошибка создания отчета', 'error');
    }
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function getEventTypeName(type) {
    const types = {
        'drilling': 'Бурение',
        'installation': 'Монтаж', 
        'trip': 'Поездка',
        'vacation': 'Отпуск'
    };
    return types[type] || type;
}

// Добавляем автоматические уведомления
function setupNotifications() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        // Проверяем события на завтра
        checkTomorrowEvents();
        
        // Повторяем проверку каждый час
        setInterval(checkTomorrowEvents, 60 * 60 * 1000);
    }
}

function checkTomorrowEvents() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);
    
    const tomorrowEvents = events.filter(e => e.date === tomorrowStr);
    
    if (tomorrowEvents.length > 0 && Notification.permission === 'granted') {
        const message = `Завтра запланировано ${tomorrowEvents.length} событий`;
        new Notification('Напоминание', {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-192.png'
        });
    }
}

// Запускаем дополнительную инициализацию
setupNotifications();
