document.addEventListener('DOMContentLoaded', function () {
    loadData();
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
            squats: parseInt(squats),
            pushups: parseInt(pushups),
            lunges: parseInt(lunges),
            date: new Date() // Записываем текущую дату и время
        });
        console.log("Data added successfully.");
        // Очистка формы или другие действия после отправки
    } catch (error) {
        console.error("Error adding document: ", error);
    }

    nameInput.value = '';
    squatsInput.value = '';
    pushupsInput.value = '';
    lungesInput.value = '';
    await loadData()
});

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`; // Изменение порядка для соответствия формату HTML input[type="date"]
}


async function loadData() {
    const filterName = document.getElementById('filterName').value.toLowerCase().trim();
    const filterDate = document.getElementById('filterDate').value; // Формат yyyy-mm-dd

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
            data[key].totalExercises += (squats + pushups + lunges);
        }
    });

    // Фильтрация и сортировка данных
    const filteredData = Object.values(data).filter(item => {
        const itemDate = formatDate(item.groupDate);
        return (!filterName || item.name.toLowerCase().includes(filterName)) &&
               (!filterDate || itemDate === filterDate);
    });

    // Сортировка и отображение данных
    filteredData.sort((a, b) => b.groupDate - a.groupDate || b.totalExercises - a.totalExercises).forEach(item => {
        tableRows += `<tr>
                        <td>${item.name}</td>
                        <td>${item.squats}</td>
                        <td>${item.pushups}</td>
                        <td>${item.lunges}</td>
                        <td>${formatDate(item.groupDate)}</td>
                      </tr>`;
    });

    const table = document.getElementById('dailyStats').getElementsByTagName('tbody')[0];
    table.innerHTML = tableRows;
    await drawChart();
}
async function drawChart() {
    const ctx = document.getElementById('leaderChart').getContext('2d');
    if (!ctx) {
        console.error('Canvas element not found!');
        return;
    }

    const querySnapshot = await getDocs(collection(db, "exercises"));
    let dataByDate = {};

    querySnapshot.forEach(doc => {
        const { name, squats, pushups, lunges, date } = doc.data();
        const parsedDate = new Date(date.toDate());
        const formattedDate = formatDate(parsedDate);

        if (!dataByDate[formattedDate]) {
            dataByDate[formattedDate] = {};
        }
        dataByDate[formattedDate][name] = (dataByDate[formattedDate][name] || 0) + squats + pushups + lunges;
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
    const chart = new Chart(ctx, {
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
                    // Эта опция гарантирует, что столбцы будут группироваться, а не наслаиваться
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
