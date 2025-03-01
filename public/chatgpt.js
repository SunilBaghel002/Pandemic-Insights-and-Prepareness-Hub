// Function to fetch user's location and display on map
async function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const map = L.map('map').setView([latitude, longitude], 10);

            // Add map tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            // Add marker to map
            L.marker([latitude, longitude]).addTo(map).bindPopup('You are here!').openPopup();

            // Fetch location-based pandemic stats
            const locationStats = document.getElementById('user-location-stats');
            locationStats.textContent = `Fetching pandemic stats for your location...`;

            try {
                const response = await fetch(`https://api.example.com/pandemic-stats?lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                locationStats.textContent = `Cases in your location: ${data.cases} | Deaths: ${data.deaths}`;
            } catch (error) {
                locationStats.textContent = 'Could not fetch location-based stats.';
            }
        });
    } else {
        document.getElementById('user-location-stats').textContent = 'Geolocation is not supported by your browser.';
    }
}

// Function to fetch news
async function fetchNews() {
    const newsList = document.getElementById('news-list');
    newsList.textContent = 'Fetching news...';

    try {
        const response = await fetch('https://newsapi.org/v2/everything?q=pandemic&apiKey=YOUR_NEWS_API_KEY');
        const { articles } = await response.json();
        newsList.innerHTML = articles
            .slice(0, 5)
            .map((article) => `<div><a href="${article.url}" target="_blank">${article.title}</a></div>`)
            .join('');
    } catch (error) {
        newsList.textContent = 'Failed to load news.';
    }
}

// Function to visualize data (Chart.js)
async function visualizeData() {
    const ctxCases = document.getElementById('chart-cases').getContext('2d');
    const ctxBar = document.getElementById('chart-bar').getContext('2d');

    // Mock data for pandemic stats
    const mockData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        cases: [1000, 3000, 5000, 2000, 7000, 10000],
        deaths: [50, 100, 150, 200, 250, 300],
    };

    new Chart(ctxCases, {
        type: 'line',
        data: {
            labels: mockData.labels,
            datasets: [
                {
                    label: 'Cases',
                    data: mockData.cases,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                },
            ],
        },
    });

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: mockData.labels,
            datasets: [
                {
                    label: 'Deaths',
                    data: mockData.deaths,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Function to display pandemic timeline
function displayPandemicTimeline() {
    const timelineContent = document.getElementById('timeline-content');

    const timeline = [
        { year: 2003, event: 'SARS outbreak' },
        { year: 2009, event: 'H1N1 pandemic' },
        { year: 2014, event: 'Ebola outbreak in West Africa' },
        { year: 2019, event: 'COVID-19 pandemic begins' },
    ];

    timelineContent.innerHTML = timeline
        .map((entry) => `<div><strong>${entry.year}:</strong> ${entry.event}</div>`)
        .join('');
}

// Event listeners
document.getElementById('apply-filters').addEventListener('click', async () => {
    const country = document.getElementById('country-select').value;
    const pandemic = document.getElementById('pandemic-select').value;

    alert(`Fetching data for ${country} during the ${pandemic} pandemic...`);
    // Here you could implement additional filtering logic based on these values
});

// Initialize the page
function initializeDashboard() {
    getUserLocation();
    fetchNews();
    visualizeData();
    displayPandemicTimeline();
}

document.addEventListener('DOMContentLoaded', initializeDashboard);
