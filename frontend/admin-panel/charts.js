// Helper function to initialize charts only if canvas exists
function createChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        new Chart(canvas, config);
    }
}

// Patient Status Charts (dashboard & reports reuse)
(() => {
  const c = document.getElementById('heartRateChart');
  if (!c) return;
  const labels = JSON.parse(c.getAttribute('data-labels')||'[]');
  const series = JSON.parse(c.getAttribute('data-series')||'[]');
  createChart('heartRateChart', { type: 'line', data: { labels, datasets: [{ label: 'Heart Rate (bpm)', data: series, borderColor: '#dc3545', fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
})();

(() => {
  const c = document.getElementById('sleepQualityChart');
  if (!c) return;
  const labels = JSON.parse(c.getAttribute('data-labels')||'[]');
  const series = JSON.parse(c.getAttribute('data-series')||'[]');
  createChart('sleepQualityChart', { type: 'bar', data: { labels, datasets: [{ label: 'Sleep Quality (%)', data: series, backgroundColor: '#007bff' }] }, options: { responsive: true, maintainAspectRatio: false } });
})();

(() => {
  const c = document.getElementById('activityChart');
  if (!c) return;
  const labels = JSON.parse(c.getAttribute('data-labels')||'[]');
  const series = JSON.parse(c.getAttribute('data-series')||'[]');
  createChart('activityChart', { type: 'line', data: { labels, datasets: [{ label: 'Steps', data: series, borderColor: '#28a745', fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
})();

// Advanced Analytics: Users Analytics
fetch('/admin/api/analytics/health').then(r=>r.json()).then(({labels,heartRate,sleepQuality,steps})=>{
  createChart('userActivityChart', { type: 'line', data: { labels, datasets: [{ label: 'Avg HR', data: heartRate, borderColor: '#007bff', fill: false }, { label: 'Avg Steps', data: steps, borderColor: '#28a745', fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
});

fetch('/admin/api/analytics/emotions').then(r=>r.json()).then(({distribution})=>{
  const labels = Object.keys(distribution||{});
  const data = labels.map(l=>distribution[l]);
  createChart('emotionDistributionChart', { type: 'pie', data: { labels, datasets: [{ data, backgroundColor: ['#007bff','#dc3545','#28a745','#ffc107','#6f42c1','#17a2b8'] }] }, options: { responsive: true, maintainAspectRatio: false } });
});

fetch('/admin/api/analytics/health').then(r=>r.json()).then(({labels,heartRate})=>{
  createChart('retentionRateChart', { type: 'line', data: { labels, datasets: [{ label: 'Signal (proxy)', data: heartRate.map(x=>Math.max(70, 90 - Math.abs(75-x))), borderColor: '#007bff', fill: false }] }, options: { responsive: true, maintainAspectRatio: false } });
});

fetch('/admin/api/analytics/health').then(r=>r.json()).then(({labels,heartRate})=>{
  const dist = { Stable: 0, 'At Risk': 0, Critical: 0 };
  heartRate.forEach(v => { if (v < 60 || v > 100) dist['Critical']++; else if (v < 65 || v > 90) dist['At Risk']++; else dist['Stable']++; });
  createChart('healthTrendsChart', { type: 'doughnut', data: { labels: Object.keys(dist), datasets: [{ data: Object.values(dist), backgroundColor: ['#28a745','#ffc107','#dc3545'] }] }, options: { responsive: true, maintainAspectRatio: false } });
});

// Advanced Analytics: Wearables Analytics
createChart('syncSuccessChart', {
    type: 'bar',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [
            {
                label: 'Google Fit Sync Success (%)',
                data: [95, 92, 98, 90, 96, 93, 97],
                backgroundColor: '#007bff'
            },
            {
                label: 'HealthKit Sync Success (%)',
                data: [90, 88, 92, 85, 91, 89, 93],
                backgroundColor: '#28a745'
            }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('wearableUsageChart', {
    type: 'polarArea',
    data: {
        labels: ['Google Fit', 'Apple HealthKit', 'Others'],
        datasets: [{
            data: [60, 35, 5],
            backgroundColor: ['#007bff', '#28a745', '#ffc107']
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('abnormalHeartRateChart', {
    type: 'line',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [{
            label: 'Abnormal Heart Rate Incidents',
            data: [2, 3, 1, 4, 2, 3, 2],
            borderColor: '#dc3545',
            fill: false
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('dataVolumeChart', {
    type: 'pie',
    data: {
        labels: ['Heart Rate', 'Sleep Quality', 'Activity'],
        datasets: [{
            data: [40, 30, 30],
            backgroundColor: ['#dc3545', '#007bff', '#28a745']
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// Advanced Analytics: Platform & Server Analytics
createChart('serverUptimeChart', {
    type: 'line',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [{
            label: 'Server Uptime (%)',
            data: [99.8, 99.9, 99.7, 99.9, 99.8, 100, 99.9],
            borderColor: '#007bff',
            fill: false
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('apiResponseChart', {
    type: 'bar',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [{
            label: 'API Response Time (ms)',
            data: [200, 180, 220, 190, 210, 200, 195],
            backgroundColor: '#dc3545'
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('serverLoadChart', {
    type: 'line',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [{
            label: 'Server Load (%)',
            data: [60, 65, 70, 62, 68, 64, 66],
            borderColor: '#ffc107',
            fill: false
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('errorRateChart', {
    type: 'doughnut',
    data: {
        labels: ['API Errors', 'Sync Errors', 'Other Errors'],
        datasets: [{
            data: [15, 10, 5],
            backgroundColor: ['#dc3545', '#ffc107', '#6f42c1']
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// Advanced Analytics: App Usage Analytics
createChart('appInstallsChart', {
    type: 'line',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [
            {
                label: 'Android Installs',
                data: [50, 60, 55, 70, 65, 80, 75],
                borderColor: '#007bff',
                fill: false
            },
            {
                label: 'iOS Installs',
                data: [30, 40, 35, 50, 45, 55, 50],
                borderColor: '#28a745',
                fill: false
            }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('sessionDurationChart', {
    type: 'bar',
    data: {
        labels: ['0-5 min', '5-10 min', '10-15 min', '15-20 min', '20+ min'],
        datasets: [{
            label: 'Session Duration Distribution',
            data: [100, 150, 120, 80, 50],
            backgroundColor: '#ffc107'
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('featureUsageChart', {
    type: 'bar',
    data: {
        labels: ['Dashboard', 'Patient Status', 'Messages', 'Reports', 'Alerts'],
        datasets: [{
            label: 'Feature Usage (%)',
            data: [30, 25, 20, 15, 10],
            backgroundColor: '#007bff'
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('appRetentionChart', {
    type: 'line',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [
            {
                label: 'Android Retention (%)',
                data: [80, 78, 79, 75, 77, 76, 80],
                borderColor: '#007bff',
                fill: false
            },
            {
                label: 'iOS Retention (%)',
                data: [85, 84, 86, 82, 83, 85, 87],
                borderColor: '#28a745',
                fill: false
            }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// Advanced Analytics: Psychological Insights
createChart('emotionalTrendsChart', {
    type: 'line',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [
            {
                label: 'Positive Sentiment',
                data: [60, 62, 58, 65, 63, 60, 64],
                borderColor: '#28a745',
                fill: false
            },
            {
                label: 'Negative Sentiment',
                data: [20, 18, 22, 19, 21, 20, 18],
                borderColor: '#dc3545',
                fill: false
            }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('sentimentDistributionChart', {
    type: 'polarArea',
    data: {
        labels: ['Happy', 'Anxious', 'Calm', 'Sad', 'Stressed'],
        datasets: [{
            data: [30, 20, 25, 15, 10],
            backgroundColor: ['#007bff', '#dc3545', '#28a745', '#ffc107', '#6f42c1']
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});














// Wearable Management Charts
createChart('syncSuccessChart', {
    type: 'bar',
    data: {
        labels: ['2025-08-01', '2025-08-02', '2025-08-03', '2025-08-04', '2025-08-05', '2025-08-06', '2025-08-07'],
        datasets: [
            {
                label: 'Google Fit Sync Success (%)',
                data: [95, 92, 98, 90, 96, 93, 97],
                backgroundColor: '#007bff'
            },
            {
                label: 'HealthKit Sync Success (%)',
                data: [90, 88, 92, 85, 91, 89, 93],
                backgroundColor: '#28a745'
            }
        ]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

createChart('deviceUsageChart', {
    type: 'pie',
    data: {
        labels: ['Google Fit', 'Apple HealthKit', 'Others'],
        datasets: [{
            data: [60, 35, 5],
            backgroundColor: ['#007bff', '#28a745', '#ffc107']
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});