document.addEventListener('DOMContentLoaded', function() {
    const deviceForm = document.getElementById('deviceForm');
    const searchForm = document.getElementById('searchForm');
    const deviceTableBody = document.getElementById('deviceTableBody');
    const searchResultsTable = document.getElementById('searchResultsTable');
    const searchResultsBody = document.getElementById('searchResultsBody');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const uploadExcelBtn = document.getElementById('uploadExcelBtn');
    const saveExcelDataBtn = document.getElementById('saveExcelDataBtn');
    const noRevisionCheckbox = document.getElementById('noRevision');
    const deviceRevisionInput = document.getElementById('deviceRevision');
    let extractedDevices = [];
    let editingDevice = null;

    // Cargar y mostrar dispositivos desde localStorage
    function loadDevices() {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        deviceTableBody.innerHTML = '';
        devices.forEach((device, index) => createDeviceRow(device, index));
    }

    // Crear una fila de dispositivo en la tabla
    function createDeviceRow(device, index) {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        const codeCell = document.createElement('td');
        const revisionCell = document.createElement('td');
        const actionsCell = document.createElement('td');

        nameCell.textContent = device.name;
        codeCell.textContent = device.code;
        revisionCell.textContent = device.revision || 'No especificado';

        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.classList.add('edit-button');
        editButton.addEventListener('click', () => editDevice(index));

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Eliminar';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', () => deleteDevice(index));

        const strikeButton = document.createElement('button');
        strikeButton.textContent = 'Tachar';
        strikeButton.classList.add('strike-button');
        strikeButton.addEventListener('click', () => toggleStrikeRow(row));

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(strikeButton);
        actionsCell.appendChild(deleteButton);

        row.appendChild(nameCell);
        row.appendChild(codeCell);
        row.appendChild(revisionCell);
        row.appendChild(actionsCell);
        deviceTableBody.appendChild(row);

        if (device.revision !== 'No Necesario') {
            checkIfExpired(device.revision, row);
        }
    }

    // Función para tachar o destachar una fila
    function toggleStrikeRow(row) {
        row.classList.toggle('striked');
    }

    // Función para verificar si la revisión está vencida y aplicar color rojo si es el caso
    function checkIfExpired(revisionDate, row) {
        if (revisionDate) {
            const today = new Date();
            const [year, month] = revisionDate.split('-').map(Number);
            const revision = new Date(year, month - 1);

            if (revision <= today) {
                row.classList.add('expired');
            }
        }
    }

    // Función para descargar datos como Excel
    downloadExcelBtn.addEventListener('click', function() {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const worksheetData = [['Nombre del Dispositivo', 'Código', 'Revisión']];

        devices.forEach(device => {
            worksheetData.push([device.name, device.code, device.revision || 'No especificado']);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispositivos');
        XLSX.writeFile(workbook, 'dispositivos.xlsx');
    });

    // Procesar archivo Excel al cargarlo
    uploadExcelBtn.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                extractedDevices = extractDevicesFromExcel(jsonData);
                if (extractedDevices.length > 0) {
                    saveExcelDataBtn.disabled = false;
                }
            };
            reader.readAsArrayBuffer(file);
        }
    });

    function extractDevicesFromExcel(data) {
        const devices = [];
        data.forEach((row, index) => {
            if (index !== 0 && row[0] && row[1]) {
                const name = row[0].trim();
                const code = row[1].trim();
                const revision = row[2] ? row[2].trim() : 'No especificado';
                devices.push({ name, code, revision });
            }
        });
        return devices;
    }

    // Guardar los datos extraídos de Excel en el Local Storage
    saveExcelDataBtn.addEventListener('click', function() {
        if (extractedDevices.length > 0) {
            const existingDevices = JSON.parse(localStorage.getItem('devices')) || [];
            const mergedDevices = [...existingDevices, ...extractedDevices];
            localStorage.setItem('devices', JSON.stringify(mergedDevices));
            loadDevices();
            alert('Datos del Excel guardados en el Local Storage');
            extractedDevices = [];
            saveExcelDataBtn.disabled = true;
        }
    });

    function saveDevice(name, code, revision) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const revisionValue = noRevisionCheckbox.checked ? 'No Necesario' : revision;

        if (editingDevice === null && devices.some(device => device.code === code)) {
            alert("El código del dispositivo ya existe. Por favor, ingresa un código único.");
            return;
        }

        if (editingDevice !== null) {
            devices[editingDevice] = { name, code, revision: revisionValue };
            editingDevice = null;
        } else {
            devices.push({ name, code, revision: revisionValue });
        }
        localStorage.setItem('devices', JSON.stringify(devices));
        loadDevices();
    }

    function deleteDevice(index) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        devices.splice(index, 1);
        localStorage.setItem('devices', JSON.stringify(devices));
        loadDevices();
    }

    function editDevice(index) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const device = devices[index];
        document.getElementById('deviceName').value = device.name;
        document.getElementById('deviceCode').value = device.code;
        document.getElementById('deviceRevision').value = device.revision !== 'No Necesario' ? device.revision : '';
        noRevisionCheckbox.checked = device.revision === 'No Necesario';
        editingDevice = index;
    }

    deviceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('deviceName').value;
        const code = document.getElementById('deviceCode').value;
        const revision = deviceRevisionInput.value;
        saveDevice(name, code, revision);
        deviceForm.reset();
        noRevisionCheckbox.checked = false;
    });

    // Función de búsqueda para buscar por nombre o código
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const searchQuery = document.getElementById('searchName').value.toLowerCase();
        const devices = JSON.parse(localStorage.getItem('devices')) || [];

        const matchingDevices = devices.filter(device =>
            device.name.toLowerCase().includes(searchQuery) ||
            device.code.toLowerCase().includes(searchQuery)
        );

        searchResultsBody.innerHTML = '';
        if (matchingDevices.length > 0) {
            matchingDevices.forEach(device => {
                const row = document.createElement('tr');
                
                const nameCell = document.createElement('td');
                nameCell.textContent = device.name;
                row.appendChild(nameCell);
                
                const codeCell = document.createElement('td');
                codeCell.textContent = device.code;
                row.appendChild(codeCell);
                
                const revisionCell = document.createElement('td');
                revisionCell.textContent = device.revision || 'No especificado';
                row.appendChild(revisionCell);

                searchResultsBody.appendChild(row);
            });
            searchResultsTable.style.display = 'table';
        } else {
            searchResultsTable.style.display = 'none';
            alert('No se encontraron dispositivos');
        }

        searchForm.reset();
    });

    deviceRevisionInput.addEventListener('input', function() {
        if (deviceRevisionInput.value) {
            noRevisionCheckbox.checked = false;
        }
    });

    noRevisionCheckbox.addEventListener('change', function() {
        if (noRevisionCheckbox.checked) {
            deviceRevisionInput.value = '';
            deviceRevisionInput.disabled = true;
        } else {
            deviceRevisionInput.disabled = false;
        }
    });

    loadDevices();
});
