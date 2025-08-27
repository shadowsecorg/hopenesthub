// Helper function to initialize charts only if canvas exists
function createChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        return new Chart(canvas, config);
    }
    return null;
}

// Dashboard: Health Overview Chart
createChart('healthOverviewChart', {
    type: 'pie',
    data: {
        labels: ['Stable', 'At Risk', 'Critical'],
        datasets: [{
            data: [6, 3, 1],
            backgroundColor: ['#28a745', '#ffc107', '#dc3545']
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// Patients Under Care: Health Charts
let underCareCharts = { hr: null, sleep: null, steps: null };
function renderUnderCareCharts(labels, hr, sleep, steps){
  if (!labels) return;
  underCareCharts.hr = createChart('caregiverHeartRateChart', { type: 'line', data: { labels, datasets: [{ label: 'Heart Rate (bpm)', data: hr, borderColor: '#dc3545', fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
  underCareCharts.sleep = createChart('caregiverSleepQualityChart', { type: 'bar', data: { labels, datasets: [{ label: 'Sleep Quality (%)', data: sleep, backgroundColor: '#1abc9c' }] }, options: { responsive: true, maintainAspectRatio: false } });
  underCareCharts.steps = createChart('caregiverActivityChart', { type: 'line', data: { labels, datasets: [{ label: 'Steps', data: steps, borderColor: '#28a745', fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
}


// Initial load if a patient is preselected
(function(){
  const select = document.getElementById('underCarePatientFilter');
  if (!select) return;
  const val = select.value;
  if (!val) return;
  const patientId = (val||'').replace(/^PT/,'');
  fetch(`/caregiver/api/metrics?patientId=${encodeURIComponent(patientId)}&days=7`).then(r=>r.json()).then(data=>{
    const labels = data.map(d=>new Date(d.recorded_at).toISOString().slice(0,10));
    const hr = data.map(d=>d.heart_rate||0);
    const sleep = data.map(d=>Math.round((d.sleep_hours||0)*100/8));
    const steps = data.map(d=>d.steps||0);
    renderUnderCareCharts(labels, hr, sleep, steps);
  });
})();











// Add to existing charts.js

// Dashboard: Health Trend Chart (fetch from API)
fetch('/caregiver/api/dashboard').then(r=>r.json()).then(({labels,heartRate,sleepQuality,steps})=>{
  createChart('healthTrendChart', {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Average Heart Rate (bpm)', data: heartRate, borderColor: '#dc3545', fill: false },
      { label: 'Average Sleep Quality (hrs)', data: sleepQuality, borderColor: '#1abc9c', fill: false },
      { label: 'Average Steps', data: steps, borderColor: '#28a745', fill: false }
    ]},
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
  });
});