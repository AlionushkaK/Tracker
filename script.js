document.addEventListener('DOMContentLoaded', function () {
    loadData();
    populateNameDropdown(); // Заполняем выпадающий список имен
});

document.getElementById('exerciseForm').addEventListener('submit', async function (event) {
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

    try {
        // Добавляем данные в коллекцию Firestore
        await addDoc(collection(window.db, "exercises"), {
            name: name,
            squats: squats,
            pushups: pushups,
            lunges: lunges,
            date: new Date() // Записываем текущую дату и время
        });
        console.log("Data added successfully.");
    } catch (error) {
        console.error("Error adding document: ", error);
    }

    nameInput.value = '';
    squatsInput.value = '';
    pushupsInput.value = '';
    lungesInput.value = '';
    await loadData();
});

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

async function loadData() {
    const querySnapshot = await getDocs(collection(db, "exercises"));
    let tableRows = "";

    const data = {};
    querySnapshot.forEach(doc => {
        const { name, squats, pushups, lunges, date } = doc.data();
        const parsedDate = new Date(date.toDate()); // Преобразование Firestore Timestamp в Date
        const groupDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

        const key = `${groupDate.toISOString()}-${name}`;
        if (!data[key]) {
            data[key] = { name, squats, pushups, lunges, groupDate, totalExercises: squats + pushups + lunges };
        } else {
            data[key].squats += squats;
            data[key].pushups += pushups;
            data[key].lunges += lunges;
            data[key].totalExercises += squats + pushups + lunges;
        }
    });

    // Сортировка данных: сначала по дате (самые новые), затем по общему количеству упражнений
    const sortedData = Object.values(data).sort((a, b) => b.groupDate - a.groupDate || b.totalExercises - a.totalExercises);

    // Ограничиваем результат до 30 строк для таблицы
    const limitedData = sortedData.slice(0, 30);

    // Генерация строк таблицы
    limitedData.forEach(item => {
        tableRows += `<tr>
                        <td>${item.name}</td>
                        <td>${item.squats}</td>
                        <td>${item.pushups}</td>
                        <td>${item.lunges}</td>
                        <td>${formatDate(item.groupDate)}</td>
                      </tr>`;
    });

    // Обновление содержимого таблицы
    const table = document.getElementById('dailyStats').getElementsByTagName('tbody')[0];
    table.innerHTML = tableRows;

    // Передача ограниченных данных для построения графика
    await drawChart(limitedData);
}

async function populateNameDropdown() {
    const querySnapshot = await getDocs(collection(db, "exercises"));
    const names = new Set(); // Используем Set, чтобы избежать повторений

    querySnapshot.forEach(doc => {
        const { name } = doc.data();
        if (name) {
            names.add(name);
        }
    });

    const nameInput = document.getElementById('name');
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        nameInput.appendChild(option);
    });
}

async function drawChart(data) {
    const ctx = document.getElementById('leaderChart').getContext('2d');
    if (!ctx) {
        console.error('Canvas element not found!');
        return;
    }

    // Группировка данных для графика
    const dataByDate = {};

    data.forEach(item => {
        const formattedDate = formatDate(item.groupDate);

        if (!dataByDate[formattedDate]) {
            dataByDate[formattedDate] = {};
        }
        dataByDate[formattedDate][item.name] = (dataByDate[formattedDate][item.name] || 0) + item.totalExercises;
    });

    const dates = Object.keys(dataByDate).sort();
    const participants = new Set();

    dates.forEach(date => {
        Object.keys(dataByDate[date]).forEach(name => participants.add(name));
    });

    const datasets = Array.from(participants).map(participant => ({
        label: participant,
        data: dates.map(date => dataByDate[date][participant] || 0),
        backgroundColor: getRandomColor(),
        borderWidth: 1
    }));

    // Создание столбчатого графика
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    stacked: false
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

async function populateNameDropdown() {
    const querySnapshot = await getDocs(collection(db, "exercises"));
    const names = new Set(); // Используем Set, чтобы избежать повторений /

    querySnapshot.forEach(doc => {
        const { name } = doc.data();
        if (name) {
            names.add(name.trim()); // Добавляем уникальные имена
        }
    });

    const nameList = document.getElementById('nameList'); // Используем <datalist>
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        nameList.appendChild(option);
    });
}

