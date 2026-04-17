// 1) Connect to Supabase

const SUPABASE_URL = "https://ewndxymuxarazcshanry.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmR4eW11eGFyYXpjc2hhbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTkyMDcsImV4cCI6MjA3MzU5NTIwN30.QvtvV5q7pZaSbuGQcLpeDG5AutHL0e_1dZ_qXJFdGOY";

let supabaseClient;
let allData = [];

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = ['12am','3am','6am','9am','12pm','3pm','6pm','9pm'];
const COLORS = ['#378ADD','#5DCAA5','#EF9F27','#D4537E','#7F77DD'];

window.addEventListener("DOMContentLoaded", async () => {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await fetchData();

  document.getElementById("filterRange").addEventListener("change", () => {
    buildDashboard(getFiltered());
  });
});


async function fetchData() {
  const { data, error } = await supabaseClient
    .from("crimes")
    .select(`
      id,
      crime_date,
      crime_types ( name ),
      areas ( name )
    `);

  if (error) { console.error("Supabase error:", error); return; }
  if (!data || data.length === 0) { console.warn("No data returned"); return; }

  // Normalise into the shape the rest of the code expects
  allData = data.map(c => ({
    ...c,
    recorded_at: c.crime_date,          // your column is crime_date not recorded_at
    crime_types: { name: c.crime_types?.name || "Unknown" },
    areas:       { name: c.areas?.name  || "Unknown" }
  }));

  buildDashboard(allData);
}


function getFiltered() {
  const range = document.getElementById("filterRange").value;
  const now = new Date();

  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return allData.filter(c => new Date(c.recorded_at) >= weekAgo);
  }

  if (range === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    return allData.filter(c => new Date(c.recorded_at) >= monthAgo);
  }

  return allData;
}


function count(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key]?.name || "Unknown";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}


let charts = {};

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}


function buildDashboard(data) {

  // --- Stat cards ---
  document.getElementById("totalCrimes").textContent = data.length;

  const typeCounts = count(data, "crime_types");
  const areaCounts = count(data, "areas");

  const typeEntries = Object.entries(typeCounts).sort((a,b) => b[1]-a[1]);
  const areaEntries = Object.entries(areaCounts).sort((a,b) => b[1]-a[1]);

  document.getElementById("commonCrime").textContent = typeEntries[0]?.[0] || "—";
  document.getElementById("safestArea").textContent =
    Object.entries(areaCounts).sort((a,b) => a[1]-b[1])[0]?.[0] || "—";

  // Peak hour
  const hourCounts = Array(8).fill(0);
  data.forEach(c => {
    if (!c.recorded_at) return;
    const h = new Date(c.recorded_at).getHours();
    hourCounts[Math.floor(h / 3)]++;
  });
  const peakBucket = hourCounts.indexOf(Math.max(...hourCounts));
  document.getElementById("peakHour").textContent = HOURS[peakBucket] || "—";


  // --- Weekly trend chart ---
  const dayCounts = Array(7).fill(0);
  data.forEach(c => {
    if (!c.recorded_at) return;
    dayCounts[new Date(c.recorded_at).getDay()]++;
  });

  destroyChart("trendChart");
  charts.trendChart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels: DAYS,
      datasets: [{
        label: "Crimes",
        data: dayCounts,
        borderColor: "#378ADD",
        backgroundColor: "rgba(55,138,221,0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#378ADD"
      }]
    },
    options: chartOptions()
  });


  // --- Area list (horizontal bars) ---
  const maxArea = areaEntries[0]?.[1] || 1;
  const areaColors = ['#D4537E','#EF9F27','#378ADD','#5DCAA5','#7F77DD'];
  const listEl = document.getElementById("areaList");
  listEl.innerHTML = "";
  areaEntries.forEach(([name, cnt], i) => {
    const pct = Math.round(cnt / maxArea * 100);
    listEl.innerHTML += `
      <div class="area-row">
        <span class="area-name">${name}</span>
        <div class="area-bar-wrap">
          <div class="area-bar" style="width:${pct}%;background:${areaColors[i % areaColors.length]}"></div>
        </div>
        <span class="area-count">${cnt}</span>
      </div>`;
  });


  // --- Crimes by type ---
  const typeLabels = typeEntries.map(e => e[0]);
  const typeValues = typeEntries.map(e => e[1]);

  destroyChart("typeChart");
  charts.typeChart = new Chart(document.getElementById("typeChart"), {
    type: "bar",
    data: {
      labels: typeLabels,
      datasets: [{ data: typeValues, backgroundColor: COLORS }]
    },
    options: chartOptions()
  });


  // --- Time of day ---
  destroyChart("hourChart");
  charts.hourChart = new Chart(document.getElementById("hourChart"), {
    type: "bar",
    data: {
      labels: HOURS,
      datasets: [{ data: hourCounts, backgroundColor: "rgba(55,138,221,0.7)" }]
    },
    options: chartOptions()
  });


  // --- Area comparison (stacked by type) ---
  const topTypes = typeEntries.slice(0, 3).map(e => e[0]);
  const areaNames = areaEntries.map(e => e[0]);

  const stackedData = topTypes.map((type, ti) => ({
    label: type,
    data: areaNames.map(area =>
      data.filter(c => c.crime_types?.name === type && c.areas?.name === area).length
    ),
    backgroundColor: COLORS[ti]
  }));

  destroyChart("compareChart");
  charts.compareChart = new Chart(document.getElementById("compareChart"), {
    type: "bar",
    data: { labels: areaNames, datasets: stackedData },
    options: {
      ...chartOptions(),
      plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 10 } } },
      scales: {
        x: { stacked: true, ticks: { font: { size: 10 } } },
        y: { stacked: true }
      }
    }
  });
}


function chartOptions() {
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 11 } } },
      y: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { font: { size: 11 } } }
    }
  };
}