// 1) Connect to Supabase

const SUPABASE_URL = "https://ewndxymuxarazcshanry.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmR4eW11eGFyYXpjc2hhbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTkyMDcsImV4cCI6MjA3MzU5NTIwN30.QvtvV5q7pZaSbuGQcLpeDG5AutHL0e_1dZ_qXJFdGOY";

let supabaseClient;


// Run after page loads
window.addEventListener("DOMContentLoaded", async () => {

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    await loadCrimeChart();

});


// 2) Fetch crimes and build chart

async function loadCrimeChart() {

    const { data, error } = await supabaseClient
        .from("crimes")
        .select(`
            crime_types(name)
        `);

    if (error) {
        console.error("Error loading crimes:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No crimes found");
        return;
    }

    // Count crimes by type

    const counts = {};

    data.forEach((crime) => {

        const type = crime.crime_types.name;

        if (!counts[type]) {
            counts[type] = 1;
        } else {
            counts[type]++;
        }

    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);


    // Create Chart

    new Chart(document.getElementById("typeChart"), {

        type: "bar",

        data: {
            labels: labels,
            datasets: [{
                label: "Crimes by Type",
                data: values
            }]
        }

    });

}