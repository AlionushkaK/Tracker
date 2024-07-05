function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Месяцы начинаются с 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

document.getElementById('exerciseForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nameInput = document.getElementById('name');
    const squatsInput = document.getElementById('squats');
    const pushupsInput = document.getElementById('pushups');
    const lungesInput = document.getElementById('lunges');
    
    const name = nameInput.value.trim();
    if (name === '') {
        alert('Пожалуйста, введите имя.');
        return;
    }

    const squats = parseInt(squatsInput.value, 10) || 0;
    const pushups = parseInt(pushupsInput.value, 10) || 0;
    const lunges = parseInt(lungesInput.value, 10) || 0;
    const today = formatDate(new Date());

    let stats = JSON.parse(localStorage.getItem('stats')) || {};

    if (!stats[today]) stats[today] = {};
    if (!stats[today][name]) stats[today][name] = { squats: 0, pushups: 0, lunges: 0 };

    stats[today][name].squats += squats;
    stats[today][name].pushups += pushups;
    stats[today][name].lunges += lunges;

    localStorage.setItem('stats', JSON.stringify(stats));

    updateDailyStats(today);

    nameInput.value = '';
    squatsInput.value = '';
    pushupsInput.value = '';
    lungesInput.value = '';
});

function updateDailyStats(todayFormatted) {
    const stats = JSON.parse(localStorage.getItem('stats')) || {};
    const todayStats = stats[todayFormatted] || {};
    const tbody = document.getElementById('dailyStats').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    // Создаем массив и сортируем его по сумме упражнений
    const sortedEntries = Object.entries(todayStats).sort((a, b) => {
        const totalA = a[1].squats + a[1].pushups + a[1].lunges;
        const totalB = b[1].squats + b[1].pushups + b[1].lunges;
        return totalB - totalA; // Сортировка по убыванию
    });

    // Определение лидеров по каждому упражнению
    const leaders = {
        squats: Object.entries(todayStats).reduce((a, b) => a[1].squats > b[1].squats ? a : b)[0],
        pushups: Object.entries(todayStats).reduce((a, b) => a[1].pushups > b[1].pushups ? a : b)[0],
        lunges: Object.entries(todayStats).reduce((a, b) => a[1].lunges > b[1].lunges ? a : b)[0]
    };

    // Формируем строки таблицы
    sortedEntries.forEach(([name, exercises]) => {
        const row = tbody.insertRow();
        row.insertCell(0).innerHTML = name +
            ((leaders.squats === name ? ' <span class="leader-icon">&#9733;</span>' : '') +
             (leaders.pushups === name ? ' <span class="leader-icon">&#9733;</span>' : '') +
             (leaders.lunges === name ? ' <span class="leader-icon">&#9733;</span>' : ''));
        row.insertCell(1).textContent = exercises.squats;
        row.insertCell(2).textContent = exercises.pushups;
        row.insertCell(3).textContent = exercises.lunges;
        row.insertCell(4).textContent = todayFormatted;
    });
}