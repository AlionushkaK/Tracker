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

    const querySnapshot = await getDocs(collection(db, "exercises"));
    const tableRows = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return `<tr>
                    <td>${data.name}</td>
                    <td>${data.squats}</td>
                    <td>${data.pushups}</td>
                    <td>${data.lunges}</td>
                    <td>${formatDate(new Date(data.date.toDate()))}</td>
                </tr>`;
    }).join('');
    document.getElementById('dailyStats').getElementsByTagName('tbody')[0].innerHTML = tableRows;
}



