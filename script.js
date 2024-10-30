document.addEventListener('DOMContentLoaded', function() {
    const deviceForm = document.getElementById('deviceForm');
    const searchForm = document.getElementById('searchForm');
    const deviceTableBody = document.getElementById('deviceTableBody');
    const searchResults = document.getElementById('searchResults');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const uploadExcelBtn = document.getElementById('uploadExcelBtn');
    const saveExcelDataBtn = document.getElementById('saveExcelDataBtn');
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

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        row.appendChild(nameCell);
        row.appendChild(codeCell);
        row.appendChild(revisionCell);
        row.appendChild(actionsCell);
        deviceTableBody.appendChild(row);
    }

    // Guardar dispositivo con validación para duplicados
    function saveDevice(name, code, revision) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];

        // Evitar duplicados de código de dispositivo
        if (editingDevice === null && devices.some(device => device.code === code)) {
            alert("El código del dispositivo ya existe. Por favor, ingresa un código único.");
            return;
        }

        if (editingDevice !== null) {
            devices[editingDevice] = { name, code, revision };
            editingDevice = null;
        } else {
            devices.push({ name, code, revision });
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
        document.getElementById('deviceRevision').value = device.revision || '';
        editingDevice = index;
    }

    deviceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('deviceName').value;
        const code = document.getElementById('deviceCode').value;
        const revision = document.getElementById('deviceRevision').value;
        saveDevice(name, code, revision);
        deviceForm.reset();
    });

    // Funcionalidad de carga de datos desde Excel
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
    downloadExcelBtn.addEventListener('click', function() {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const worksheetData = [['Nombre del Dispositivo', 'Código', 'Revisión']]; // Encabezados para el Excel
    
        // Añadir cada dispositivo a worksheetData, incluyendo la columna de "Revisión"
        devices.forEach(device => {
            worksheetData.push([device.name, device.code, device.revision || 'No especificado']);
        });
    
        // Crear la hoja de cálculo y el libro de trabajo
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispositivos');
    
        // Descargar el archivo como "dispositivos.xlsx"
        XLSX.writeFile(workbook, 'dispositivos.xlsx');
    });
    
    // Función para extraer dispositivos de Excel, incluyendo "Revisión"
    function extractDevicesFromExcel(data) {
        const devices = [];
        data.forEach((row, index) => {
            if (index !== 0 && row[0] && row[1]) { // Ignorar el encabezado y filas vacías
                const name = row[0].trim();
                const code = row[1].trim();
                const revision = row[2] ? row[2].trim() : 'No especificado';
                if (devices.every(device => device.code !== code)) {
                    devices.push({ name, code, revision });
                }
            }
        });
        return devices;
    }

    loadDevices();
});
