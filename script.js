// --- Dublin Data Definition ---
const crimes = [
    {
        id: 1,
        title: "Phone Theft",
        type: "Theft",
        severity: 2,
        date: "2026-03-01 18:30:00",
        location: [53.287200, -6.373000],
        area: "Tallaght",
        city: "Dublin",
        description: "Phone stolen near The Square Shopping Centre."
    },
    {
        id: 2,
        title: "Late Night Assault",
        type: "Assault",
        severity: 4,
        date: "2026-03-02 23:15:00",
        location: [53.349800, -6.260300],
        area: "City Centre",
        city: "Dublin",
        description: "Physical altercation outside nightclub."
    },
    {
        id: 3,
        title: "House Burglary",
        type: "Burglary",
        severity: 3,
        date: "2026-03-03 14:20:00",
        location: [53.388000, -6.375000],
        area: "Blanchardstown",
        city: "Dublin",
        description: "Break-in reported in residential estate."
    },
    {
        id: 4,
        title: "Graffiti Incident",
        type: "Vandalism",
        severity: 2,
        date: "2026-03-04 09:45:00",
        location: [53.274000, -6.216000],
        area: "Sandyford",
        city: "Dublin",
        description: "Graffiti found on office building wall."
    },
    {
        id: 5,
        title: "Armed Robbery",
        type: "Robbery",
        severity: 5,
        date: "2026-03-05 20:15:00",
        location: [53.345000, -6.267200],
        area: "City Centre",
        city: "Dublin",
        description: "Convenience store robbed by masked suspect."
    }
];

let map;
let markerLayer = L.layerGroup();
let heatLayer = null;
let currentView = 'pins';

const getSeverityColor = (lvl) => {
    const colors = { 5: '#ef4444', 4: '#f97316', 3: '#eab308', 2: '#3b82f6', 1: '#22c55e' };
    return colors[lvl] || '#94a3b8';
};

const isWithinTimeRange = (crimeDate, range) => {
    if (range === 'all') return true;
    const now = new Date();
    const incident = new Date(crimeDate);
    const diffHrs = (now - incident) / (1000 * 60 * 60);
    if (range === '24h') return diffHrs <= 24;
    if (range === '7d') return diffHrs <= (24 * 7);
    return true;
};

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([53.3498, -6.2603], 14);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    markerLayer.addTo(map);
    renderData();
}

function renderData() {
    markerLayer.clearLayers();
    if (heatLayer) map.removeLayer(heatLayer);

    const searchTerm = document.getElementById('search-area').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const timeFilter = document.getElementById('filter-time').value;

    const filteredCrimes = crimes.filter(c => {
        const matchesSearch = c.area.toLowerCase().includes(searchTerm) || c.title.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || c.type === typeFilter;
        const matchesTime = isWithinTimeRange(c.date, timeFilter);
        return matchesSearch && matchesType && matchesTime;
    });

    document.getElementById('crime-count').textContent = filteredCrimes.length;

    const recentContainer = document.getElementById('recent-list');
    recentContainer.innerHTML = '';

    filteredCrimes.slice(0, 3).forEach(c => {
        const item = document.createElement('div');
        item.className = "p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 cursor-pointer hover:bg-white hover:border-indigo-100 transition-all group";
        item.innerHTML = `
            <div class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style="background-color: ${getSeverityColor(c.severity)}"></div>
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-0.5">
                    <h4 class="text-xs font-bold truncate group-hover:text-indigo-600">${c.title}</h4>
                    <span class="text-[10px] text-slate-400 whitespace-nowrap ml-2">${new Date(c.date).getHours()}:${String(new Date(c.date).getMinutes()).padStart(2, '0')}</span>
                </div>
                <p class="text-[10px] text-slate-500 truncate">${c.area} • ${c.type}</p>
            </div>
        `;
        item.onclick = () => {
            map.flyTo(c.location, 16);
            if (window.innerWidth < 640) toggleSidebar();
        };
        recentContainer.appendChild(item);
    });

    filteredCrimes.forEach(crime => {
        const marker = L.circleMarker(crime.location, {
            radius: 10,
            fillColor: getSeverityColor(crime.severity),
            color: "#fff",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        });

        const popupContent = `
            <div class="p-1 min-w-[200px]">
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${getSeverityColor(crime.severity)}"></span>
                    <span class="text-[10px] font-bold uppercase text-slate-400">Sev Level ${crime.severity}</span>
                </div>
                <h3 class="font-bold text-slate-900 text-sm mb-0.5">${crime.title}</h3>
                <p class="text-[11px] text-slate-500 mb-2">${crime.area}, ${crime.city}</p>
                <p class="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">${crime.description}</p>
            </div>
        `;

        marker.bindPopup(popupContent);
        markerLayer.addLayer(marker);
    });

    const heatData = filteredCrimes.map(c => [...c.location, c.severity * 0.3]);

    heatLayer = L.heatLayer(heatData, {
        radius: 30,
        blur: 20,
        maxZoom: 16,
        gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1: 'red'}
    });

    updateViewVisibility();
}

function updateViewVisibility() {
    if (currentView === 'pins') {
        if (!map.hasLayer(markerLayer)) markerLayer.addTo(map);
        if (heatLayer) map.removeLayer(heatLayer);
    } else {
        if (map.hasLayer(markerLayer)) map.removeLayer(markerLayer);
        heatLayer.addTo(map);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleIcon = document.getElementById('toggle-icon');

    sidebar.classList.toggle('closed');
    const isClosed = sidebar.classList.contains('closed');
    toggleIcon.innerText = isClosed ? 'menu' : 'close';
}

document.addEventListener('DOMContentLoaded', () => {

    initMap();

    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', toggleSidebar);

    ['search-area', 'filter-type', 'filter-time'].forEach(id => {
        document.getElementById(id).addEventListener('change', renderData);
        if (id === 'search-area') {
            document.getElementById(id).addEventListener('keyup', renderData);
        }
    });

    const btnPins = document.getElementById('btn-view-pins');
    const btnHeat = document.getElementById('btn-view-heat');

    btnPins.addEventListener('click', () => {
        currentView = 'pins';
        btnPins.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
        btnPins.classList.remove('text-slate-600');
        btnHeat.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        btnHeat.classList.add('text-slate-600');
        updateViewVisibility();
    });

    btnHeat.addEventListener('click', () => {
        currentView = 'heat';
        btnHeat.classList.add('bg-white', 'shadow-sm', 'text-indigo-600');
        btnHeat.classList.remove('text-slate-600');
        btnPins.classList.remove('bg-white', 'shadow-sm', 'text-indigo-600');
        btnPins.classList.add('text-slate-600');
        updateViewVisibility();
    });

    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        const toggleIcon = document.getElementById('toggle-icon');
        sidebar.classList.add('closed');
        toggleIcon.innerText = 'menu';
    }
});
