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
    return `${day}-${month}-${year}`;
}

async function loadData() {
    const filterName = document.getElementById('filterName').value.toLowerCase().trim();
    const filterDate = document.getElementById('filterDate').value; // Формат yyyy-mm-dd

    const querySnapshot = await getDocs(collection(db, "exercises"));
    let tableRows = "";

    const data = {};
    querySnapshot.forEach(doc => {
        const { name, squats, pushups, lunges, date } = doc.data();
        const parsedDate = new Date(date.toDate());
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

    // Применение фильтров
    const filteredData = Object.values(data).filter(item => {
        const itemDate = formatDate(item.groupDate);
        return (!filterName || item.name.toLowerCase().includes(filterName)) && // Используем includes вместо startsWith
               (!filterDate || itemDate === filterDate);
    });

    // Сортировка
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
}
