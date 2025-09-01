// Toggle recipient selection based on recipient type
function toggleRecipientSelection() {
    const recipientType = document.getElementById('recipientType').value;
    const individualSelect = document.getElementById('recipient');
    const groupSelect = document.getElementById('groupRecipient');

    if (recipientType === 'individual') {
        individualSelect.disabled = false;
        groupSelect.disabled = true;
        groupSelect.value = '';
    } else if (recipientType === 'group') {
        individualSelect.disabled = true;
        groupSelect.disabled = false;
        individualSelect.value = '';
    }
}

// Load message template
function loadTemplate() {
    const template = document.getElementById('messageTemplate').value;
    const messageContent = document.getElementById('messageContent');

    if (template === 'reminder') {
        messageContent.value = 'Please take your medication as prescribed at the scheduled time.';
    } else if (template === 'checkup') {
        messageContent.value = 'Reminder: Your next checkup is scheduled for [insert date/time].';
    } else {
        messageContent.value = '';
    }
}

// Wire up message page controls
document.addEventListener('DOMContentLoaded', function () {
    const rType = document.getElementById('recipientType');
    if (rType) {
        rType.addEventListener('change', toggleRecipientSelection);
        // Initialize state on load
        try { toggleRecipientSelection(); } catch (_) {}
    }
    const tpl = document.getElementById('messageTemplate');
    if (tpl) {
        tpl.addEventListener('change', loadTemplate);
    }
});

// Handle form submission
(() => {
  const form = document.getElementById('sendMessageForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    const action = (form.getAttribute('action') || '').trim();
    // If this is the real backend route, let the browser submit normally
    if (action === '/admin/messages/send') {
      return; // do NOT preventDefault
    }
    // Demo/static HTML behavior only
    e.preventDefault();
    const recipientType = document.getElementById('recipientType').value;
    const recipient = document.getElementById('recipient').value;
    const groupRecipient = document.getElementById('groupRecipient').value;
    const messageContent = document.getElementById('messageContent').value;
    if ((recipientType === 'individual' && !recipient) || (recipientType === 'group' && !groupRecipient) || !messageContent) {
      alert('Please fill in all required fields.');
      return;
    }
    alert('Message sent successfully!');
  });
})();




















// Settings Page: Roles & Permissions
function searchRoles() {
    const searchValue = document.getElementById('searchRoles').value.toLowerCase();
    const rows = document.querySelectorAll('#roles tbody tr');
    rows.forEach(row => {
        const roleName = row.cells[0].textContent.toLowerCase();
        row.style.display = roleName.includes(searchValue) ? '' : 'none';
    });
}

document.getElementById('searchRoles').addEventListener('input', searchRoles);

(() => {
  const form = document.getElementById('addRoleForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    const action = (form.getAttribute('action')||'').trim();
    if (action === '/admin/settings/roles') return; // allow backend submit
    e.preventDefault();
    const roleName = document.getElementById('roleName').value;
    if (!roleName) { alert('Role name is required.'); return; }
    alert(`Role "${roleName}" added successfully!`);
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('addRoleModal')).hide();
  });
})();

(() => {
  const form = document.getElementById('editRoleForm');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    const action = (form.getAttribute('action')||'').trim();
    if (action.startsWith('/admin/settings/roles/') && action.endsWith('/update')) return; // allow backend submit
    e.preventDefault();
    const roleName = document.getElementById('editRoleName').value;
    if (!roleName) { alert('Role name is required.'); return; }
    alert(`Role "${roleName}" updated successfully!`);
    bootstrap.Modal.getInstance(document.getElementById('editRoleModal')).hide();
  });
})();

function deleteRole(roleName) {
    if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
        alert(`Role "${roleName}" deleted successfully!`);
        // Add API call to delete role via Laravel backend
    }
}

// Chatbot Settings
(() => {
  const f = document.getElementById('chatbotSettingsForm');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    // If posting to backend route, allow default submit
    const action = (f.getAttribute('action')||'').trim();
    if (action === '/admin/settings/chatbot') return;
    e.preventDefault();
    const responses = document.getElementById('chatbotResponses').value;
    try { JSON.parse(responses); alert('Chatbot settings saved successfully!'); } catch(_) { alert('Invalid JSON format for default responses.'); }
  });
})();

// Wearable Settings
(() => {
  const f = document.getElementById('wearableSettingsForm');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    const action = (f.getAttribute('action')||'').trim();
    if (action === '/admin/settings/wearables') return;
    e.preventDefault();
    alert('Wearable settings saved successfully!');
  });
})();

// Security Settings
(() => {
  const f = document.getElementById('securitySettingsForm');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    const action = (f.getAttribute('action')||'').trim();
    if (action === '/admin/settings/security') return;
    e.preventDefault();
    alert('Security settings saved successfully!');
  });
})();

























// Enable/Disable custom date range inputs
function toggleDateInputs(tab) {
    const timeRange = document.getElementById(`${tab}TimeRange`).value;
    const startDate = document.getElementById(`${tab}StartDate`);
    const endDate = document.getElementById(`${tab}EndDate`);
    
    if (timeRange === 'custom') {
        startDate.disabled = false;
        endDate.disabled = false;
    } else {
        startDate.disabled = true;
        endDate.disabled = true;
        startDate.value = '';
        endDate.value = '';
    }
}

document.getElementById('userTimeRange').addEventListener('change', () => toggleDateInputs('user'));
document.getElementById('appTimeRange').addEventListener('change', () => toggleDateInputs('app'));
document.getElementById('psychTimeRange').addEventListener('change', () => toggleDateInputs('psych'));

// Filter users table based on role
document.getElementById('userFilter').addEventListener('change', function () {
    const role = this.value.toLowerCase();
    const rows = document.querySelectorAll('#users tbody tr');
    rows.forEach(row => {
        const rowRole = row.cells[2].textContent.toLowerCase();
        row.style.display = role === '' || rowRole === role ? '' : 'none';
    });
});

// Filter wearables table based on device type
document.getElementById('wearableFilter').addEventListener('change', function () {
    const device = this.value.toLowerCase();
    const rows = document.querySelectorAll('#wearables tbody tr');
    rows.forEach(row => {
        const rowDevice = row.cells[0].textContent.toLowerCase();
        row.style.display = device === '' || rowDevice.includes(device) ? '' : 'none';
    });
});

// Export functions (placeholder)
function exportToPDF(tab) {
    alert(`Exporting ${tab} analytics as PDF`);
    // Add API call or jsPDF logic for PDF export
}

function exportToExcel(tab) {
    alert(`Exporting ${tab} analytics as Excel`);
    // Add API call or SheetJS logic for Excel export
}

























// Wearable Management: Search Devices
function searchDevices() {
    const searchValue = document.getElementById('searchDevices').value.toLowerCase();
    const deviceFilter = document.getElementById('deviceFilter').value.toLowerCase();
    const rows = document.querySelectorAll('#devices tbody tr');
    rows.forEach(row => {
        const userId = row.cells[0].textContent.toLowerCase();
        const deviceType = row.cells[2].textContent.toLowerCase();
        const matchesSearch = userId.includes(searchValue) || row.cells[3].textContent.toLowerCase().includes(searchValue);
        const matchesFilter = deviceFilter === '' || deviceType.includes(deviceFilter);
        row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
}

document.getElementById('searchDevices').addEventListener('input', searchDevices);
document.getElementById('deviceFilter').addEventListener('change', searchDevices);

// Connect New Device
document.getElementById('addDeviceForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const deviceType = document.getElementById('deviceType').value;
    const deviceId = document.getElementById('deviceId').value;
    if (!userId || !deviceType || !deviceId) {
        alert('All fields are required.');
        return;
    }
    alert(`Device ${deviceId} (${deviceType}) connected for User ${userId}`);
    // Add API call to connect device via Laravel backend
    document.getElementById('addDeviceForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
});

// Disconnect Device
function disconnectDevice(userId, deviceId) {
    if (confirm(`Are you sure you want to disconnect device ${deviceId} for User ${userId}?`)) {
        alert(`Device ${deviceId} disconnected for User ${userId}`);
        // Add API call to disconnect device via Laravel backend
    }
}

// Reconnect Device
function reconnectDevice(userId, deviceId) {
    alert(`Device ${deviceId} reconnected for User ${userId}`);
    // Add API call to reconnect device via Laravel backend
}

// Save Configuration
document.getElementById('wearableConfigForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const googleFitStatus = document.getElementById('googleFitStatus').checked;
    const healthKitStatus = document.getElementById('healthKitStatus').checked;
    const googleFitApiKey = document.getElementById('googleFitApiKey').value;
    const healthKitApiKey = document.getElementById('healthKitApiKey').value;
    if ((googleFitStatus && !googleFitApiKey) || (healthKitStatus && !healthKitApiKey)) {
        alert('Please provide API keys for enabled integrations.');
        return;
    }
    alert('Configuration saved successfully!');
    // Add API call to save configuration via Laravel backend
});

// Filter Status Table
document.getElementById('statusFilter').addEventListener('change', function () {
    const device = this.value.toLowerCase();
    const rows = document.querySelectorAll('#status tbody tr');
    rows.forEach(row => {
        const rowDevice = row.cells[0].textContent.toLowerCase();
        row.style.display = device === '' || rowDevice.includes(device) ? '' : 'none';
    });
});

// Export functions (placeholder)
function exportToPDF(tab) {
    alert(`Exporting ${tab} data as PDF`);
    // Add API call or jsPDF logic for PDF export
}

function exportToExcel(tab) {
    alert(`Exporting ${tab} data as Excel`);
    // Add API call or SheetJS logic for Excel export
}









