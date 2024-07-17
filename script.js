let currentPage = 1;
let rowsPerPage = 15;
let totalRows = 0;

document.addEventListener('DOMContentLoaded', function () {
    loadData();
    populateNameList();
});

document.getElementById('exerciseForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nameInput = document.getElementById('name');
    const squatsInput = document.getElementById('squats');
    const pushupsInput = document.getElementById('pushups');
    const lungesInput = document.getElementById('lunges');

    const name = nameInput.value.trim();
    if (name === '') {
        alert('Please enter a name.');
        return;
    }

    const squats = parseInt(squatsInput.value, 10) || 0;
    const pushups = parseInt(pushupsInput.value, 10) || 0;
    const lunges = parseInt(lungesInput.value, 10) || 0;

    try {
        await addDoc(collection(window.db, "exercises"), {
            name: name,
            squats: squats,
            pushups: pushups,
            lunges: lunges,
            date: new Date()
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
    await populateNameList();
});

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

async function loadData() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
    const filterName = document.getElementById('filterName').value.toLowerCase().trim();
    const filterDate = document.getElementById('filterDate').value;

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

    const filteredData = Object.values(data).filter(item => {
        const itemDate = formatDate(item.groupDate);
        return (!filterName || item.name.toLowerCase().includes(filterName)) &&
               (!filterDate || itemDate === filterDate);
    });

    totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    currentPage = Math.min(currentPage, totalPages);

    const startRow = (currentPage - 1) * rowsPerPage;
    const endRow = startRow + rowsPerPage;

    const pageData = filteredData.slice(startRow, endRow);

    pageData.sort((a, b) => b.groupDate - a.groupDate || b.totalExercises - a.totalExercises).forEach(item => {
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

    document.getElementById('pageNumber').textContent = currentPage;
    updatePaginationButtons();
    await drawChart();
}

function updatePaginationButtons() {
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage * rowsPerPage >= totalRows;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadData();
    }
}

function nextPage() {
    if (currentPage * rowsPerPage < totalRows) {
        currentPage++;
        loadData();
    }
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

async function populateNameList() {
    const nameList = document.getElementById('nameList');
    nameList.innerHTML = ''; // Clear existing options

    const querySnapshot = await getDocs(collection(db, "exercises"));
    const names = new Set();

    querySnapshot.forEach(doc => {
        const { name } = doc.data();
        names.add(name);
    });

    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        nameList.appendChild(option);
    });
}
