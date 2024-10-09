document.addEventListener('DOMContentLoaded', function() {
    const deviceForm = document.getElementById('deviceForm');
    const searchForm = document.getElementById('searchForm');
    const deviceTableBody = document.getElementById('deviceTableBody');
    const searchResults = document.getElementById('searchResults');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    let editingDevice = null;

    // Función para cargar dispositivos guardados
    function loadDevices() {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        deviceTableBody.innerHTML = ''; // Limpiar tabla
        devices.forEach((device, index) => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const codeCell = document.createElement('td');
            const actionsCell = document.createElement('td');
            
            nameCell.textContent = device.name;
            codeCell.textContent = device.code;
            
            // Botón para editar
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.addEventListener('click', () => editDevice(index));

            // Botón para eliminar
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

    // Función para guardar dispositivos en el Local Storage
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

    // Función para eliminar un dispositivo
    function deleteDevice(index) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        devices.splice(index, 1);
        localStorage.setItem('devices', JSON.stringify(devices));
        loadDevices();
    }

    // Función para editar un dispositivo
    function editDevice(index) {
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const device = devices[index];
        document.getElementById('deviceName').value = device.name;
        document.getElementById('deviceCode').value = device.code;
        editingDevice = index;
    }

    // Evento al enviar el formulario para agregar o modificar dispositivos
    deviceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('deviceName').value;
        const code = document.getElementById('deviceCode').value;
        saveDevice(name, code);
        deviceForm.reset(); // Limpiar formulario
    });

    // Evento al enviar el formulario de búsqueda
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const searchName = document.getElementById('searchName').value.toLowerCase();
        const devices = JSON.parse(localStorage.getItem('devices')) || [];
        const matchingDevices = devices.filter(device => 
            device.name.toLowerCase().includes(searchName)
        );
        
        searchResults.innerHTML = ''; // Limpiar resultados anteriores

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

        searchForm.reset(); // Limpiar formulario
    });

    // Función para descargar la tabla como PDF
    downloadPdfBtn.addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const devices = JSON.parse(localStorage.getItem('devices')) || [];

        doc.setFontSize(16);
        doc.text('Dispositivos Guardados', 10, 10);
        doc.setFontSize(12);

        // Dibujar encabezados de la tabla
        doc.text('Nombre del Dispositivo', 10, 20);
        doc.text('Código', 100, 20);

        // Dibujar dispositivos en la tabla
        let startY = 30;
        devices.forEach((device, index) => {
            doc.text(device.name, 10, startY + (index * 10));
            doc.text(device.code, 100, startY + (index * 10));
        });

        doc.save('dispositivos.pdf');
    });

    // Cargar dispositivos al cargar la página
    loadDevices();
});
