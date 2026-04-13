// 1) Connect to Supabase

const SUPABASE_URL = "https://ewndxymuxarazcshanry.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmR4eW11eGFyYXpjc2hhbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTkyMDcsImV4cCI6MjA3MzU5NTIwN30.QvtvV5q7pZaSbuGQcLpeDG5AutHL0e_1dZ_qXJFdGOY";

let supabaseClient;

// Run after page loads
window.addEventListener("DOMContentLoaded", async () => {

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    await loadDashboard();

});


// 2) Load data and build dashboard

async function loadDashboard(){

    const { data, error } = await supabaseClient
        .from("crimes")
        .select(`
            id,
            crime_types(name),
            areas(name)
        `);

    if(error){
        console.error("Error:", error);
        return;
    }

    if(!data || data.length === 0){
        console.log("No data found");
        return;
    }

    // TOTAL CRIMES
    document.getElementById("totalCrimes").textContent = data.length;


    const typeCounts = {};
    const areaCounts = {};

    data.forEach(crime => {

        const type = crime.crime_types.name;
        const area = crime.areas.name;

        // count by type
        if(!typeCounts[type]){
            typeCounts[type] = 1;
        } else {
            typeCounts[type]++;
        }

        // count by area
        if(!areaCounts[area]){
            areaCounts[area] = 1;
        } else {
            areaCounts[area]++;
        }

    });


    // MOST COMMON CRIME
    const typeLabels = Object.keys(typeCounts);
    const typeValues = Object.values(typeCounts);

    const maxIndex = typeValues.indexOf(Math.max(...typeValues));
    document.getElementById("commonCrime").textContent = typeLabels[maxIndex];


    // SAFEST AREA
    const areaLabels = Object.keys(areaCounts);
    const areaValues = Object.values(areaCounts);

    const minIndex = areaValues.indexOf(Math.min(...areaValues));
    document.getElementById("safestArea").textContent = areaLabels[minIndex];


    // CHART 1 - Crimes by Type
    new Chart(document.getElementById("typeChart"), {
        type: "bar",
        data: {
            labels: typeLabels,
            datasets: [{
                label: "Crimes by Type",
                data: typeValues
            }]
        }
    });


    // CHART 2 - Crimes by Area
    new Chart(document.getElementById("areaChart"), {
        type: "pie",
        data: {
            labels: areaLabels,
            datasets: [{
                data: areaValues
            }]
        }
    });

}