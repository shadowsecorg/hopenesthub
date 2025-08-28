// Navigation
// Navigation is handled server-side via URLs now.

// Search Patients (on /caregiver/patient-list)
(function initPatientSearch() {
    const input = document.getElementById('searchPatients');
    if (!input) return;
    input.addEventListener('input', function () {
        const searchValue = (this.value || '').toLowerCase();
        document.querySelectorAll('#patientRows tr').forEach(row => {
            const patientId = row.cells[0].textContent.toLowerCase();
            const patientName = row.cells[1].textContent.toLowerCase();
            row.style.display = patientId.includes(searchValue) || patientName.includes(searchValue) ? '' : 'none';
        });
    });
})();

// Add Patient
document.getElementById('addPatientForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const patientId = document.getElementById('patientId').value;
    const patientName = document.getElementById('patientName').value;
    const patientAge = document.getElementById('patientAge').value;
    if (!patientId || !patientName || !patientAge) {
        alert('All fields are required.');
        return;
    }
    try {
        await fetch('/caregiver/patients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId, patientName, patientAge })
        });
        document.getElementById('addPatientForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addPatientModal')).hide();
        location.reload();
    } catch (err) {
        alert('Failed to add patient');
    }
});

// Assign Patient
async function assignPatient(patientId) {
    if (!confirm(`Assign patient ${patientId} to your care?`)) return;
    try {
        await fetch('/caregiver/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caregiver_id: window.caregiverId || 1, patient_id: patientId })
        });
        alert('Assigned');
    } catch (err) {
        alert('Failed to assign');
    }
}

// Health Status Filter
function updateHealthCharts() {
    const patientValue = document.getElementById('underCarePatientFilter').value;
    const patientId = (patientValue || '').replace(/^PT/, '');
    if (!patientId) return;
    fetch(`/caregiver/api/metrics?patientId=${encodeURIComponent(patientId)}&days=7`)
      .then(r => r.json())
      .then(data => {
        const hr = data.map(d => d.heart_rate || 0);
        const sleep = data.map(d => Math.round((d.sleep_hours || 0) * 12));
        const steps = data.map(d => d.steps || 0);
        const avg = arr => (arr.reduce((a,b)=>a+b,0) / (arr.length || 1));
        document.getElementById('avgHeartRate').textContent = `${avg(hr).toFixed(1)} bpm`;
        document.getElementById('avgSleepQuality').textContent = `${avg(sleep).toFixed(1)}%`;
        document.getElementById('avgActivity').textContent = `${avg(steps).toFixed(0)} steps`;
        // Note: demo charts created in charts.js; dynamic update would require chart instances. Skipping live redraw to avoid refactor.
      })
      .catch(() => {});
}

// Under care filter (on /caregiver/under-care)
const underCareFilter = document.getElementById('underCarePatientFilter');
if (underCareFilter) {
    underCareFilter.addEventListener('change', function(){
        // Redraw charts with API data
        const val = this.value;
        const patientId = (val||'').replace(/^PT/,'');
        if (!patientId) return updateHealthCharts();
        fetch(`/caregiver/api/metrics?patientId=${encodeURIComponent(patientId)}&days=7`).then(r=>r.json()).then(data=>{
            const labels = data.map(d=>new Date(d.recorded_at).toISOString().slice(0,10));
            const hr = data.map(d=>d.heart_rate||0);
            const sleep = data.map(d=>Math.round((d.sleep_hours||0)*100/8));
            const steps = data.map(d=>d.steps||0);
            if (window.underCareCharts && window.underCareCharts.hr) {
                window.underCareCharts.hr.data.labels = labels; window.underCareCharts.hr.data.datasets[0].data = hr; window.underCareCharts.hr.update();
                window.underCareCharts.sleep.data.labels = labels; window.underCareCharts.sleep.data.datasets[0].data = sleep; window.underCareCharts.sleep.update();
                window.underCareCharts.steps.data.labels = labels; window.underCareCharts.steps.data.datasets[0].data = steps; window.underCareCharts.steps.update();
            }
            // Also update summary
            const avg = arr => (arr.reduce((a,b)=>a+b,0) / (arr.length||1));
            document.getElementById('avgHeartRate').textContent = `${avg(hr).toFixed(1)} bpm`;
            document.getElementById('avgSleepQuality').textContent = `${avg(sleep).toFixed(1)}%`;
            document.getElementById('avgActivity').textContent = `${avg(steps).toFixed(0)} steps`;
        }).catch(()=>updateHealthCharts());
    });
}

// Send Message
document.getElementById('sendMessageForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const recipient = document.getElementById('messageRecipientModal').value;
    const content = document.getElementById('messageContent').value;
    if (!recipient || !content) {
        alert('Recipient and message content are required.');
        return;
    }
    try {
        await fetch('/caregiver/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, content })
        });
        document.getElementById('sendMessageForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('sendMessageModal')).hide();
        location.reload();
    } catch (err) {
        alert('Failed to send message');
    }
});

// Add Recommendation (on /caregiver/recommendations)
(function initAddRecommendation() {
    const form = document.getElementById('addRecommendationForm');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const patientId = document.getElementById('recommendationPatient').value;
        const content = document.getElementById('recommendationContent').value;
        if (!patientId || !content) {
            alert('Patient and recommendation content are required.');
            return;
        }
        try {
            await fetch('/caregiver/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, content })
            });
            form.reset();
            bootstrap.Modal.getInstance(document.getElementById('addRecommendationModal')).hide();
            location.reload();
        } catch (err) {
            alert('Failed to add recommendation');
        }
    });
})();

// Export Reports
function exportToPDF(section) {
    const sel = document.getElementById('reportPatientFilter');
    const pid = sel ? sel.value : '';
    const qs = pid ? `?format=pdf&pid=${encodeURIComponent(pid)}` : `?format=pdf`;
    window.location = `/caregiver/reports/export${qs}`;
}

function exportToExcel(section) {
    const sel = document.getElementById('reportPatientFilter');
    const pid = sel ? sel.value : '';
    const qs = pid ? `?format=excel&pid=${encodeURIComponent(pid)}` : `?format=excel`;
    window.location = `/caregiver/reports/export${qs}`;
}

// Save Settings
const settingsForm = document.getElementById('settingsForm');
if (settingsForm) settingsForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const notificationPreference = document.getElementById('notificationPreference').value;
    const alertThreshold = document.getElementById('alertThreshold').value;
    const language = document.getElementById('language').value;
    if (!alertThreshold) {
        alert('Alert threshold is required.');
        return;
    }
    try {
        await fetch('/caregiver/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationPreference, alertThreshold, language })
        });
        alert('Settings saved successfully!');
    } catch (err) {
        alert('Failed to save settings');
    }
});














// Add to existing script.js

// Navigate to Section
function navigateTo(sectionId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// Acknowledge/Dismiss Alerts
async function acknowledgeAlert(alertId) {
    try {
        await fetch(`/caregiver/alerts/${alertId}/ack`, { method: 'POST' });
        location.reload();
    } catch (err) {
        alert('Failed to acknowledge');
    }
}

async function dismissAlert(alertId) {
    if (!confirm('Dismiss this alert?')) return;
    try {
        await fetch(`/caregiver/alerts/${alertId}/dismiss`, { method: 'POST' });
        location.reload();
    } catch (err) {
        alert('Failed to dismiss');
    }
}