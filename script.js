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

    function loadDevices() {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        deviceTableBody.innerHTML = '';
        devices.forEach((device, index) => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const codeCell = document.createElement('td');
            const actionsCell = document.createElement('td');
            
            nameCell.textContent = device.name;
            codeCell.textContent = device.code;
            
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.addEventListener('click', () => editDevice(index));

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', () => deleteDevice(index));

            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);
            
            row.appendChild(nameCell);
            row.appendChild(codeCell);
            row.appendChild(actionsCell);
            deviceTableBody.appendChild(row);
        });
    }

    function saveDevice(name, code) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        if (editingDevice !== null) {
            devices[editingDevice] = { name, code };
            editingDevice = null;
        } else {
            devices.push({ name, code });
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
        editingDevice = index;
    }

    deviceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('deviceName').value;
        const code = document.getElementById('deviceCode').value;
        saveDevice(name, code);
        deviceForm.reset();
    });

    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const searchName = document.getElementById('searchName').value.toLowerCase();
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const matchingDevices = devices.filter(device => 
            device.name.toLowerCase().includes(searchName)
        );
        
        searchResults.innerHTML = '';

        if (matchingDevices.length > 0) {
            matchingDevices.forEach(device => {
                const listItem = document.createElement('li');
                listItem.textContent = `Nombre: ${device.name}, Código: ${device.code}`;
                searchResults.appendChild(listItem);
            });
        } else {
            const noResultItem = document.createElement('li');
            noResultItem.textContent = 'No se encontraron dispositivos';
            searchResults.appendChild(noResultItem);
        }

        searchForm.reset();
    });

    downloadExcelBtn.addEventListener('click', function() {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const worksheetData = [['Nombre del Dispositivo', 'Código']];
        devices.forEach(device => {
            worksheetData.push([device.name, device.code]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispositivos');

        XLSX.writeFile(workbook, 'dispositivos.xlsx');
    });

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

    function extractDevicesFromExcel(data) {
        const devices = [];
        data.forEach((row, index) => {
            if (index !== 0 && row[0] && row[1]) {
                const name = row[0];
                const code = row[1];
                devices.push({ name, code });
            }
        });
        return devices;
    }

    loadDevices();
});
