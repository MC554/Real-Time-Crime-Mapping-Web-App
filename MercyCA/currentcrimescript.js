
const SUPABASE_URL = "https://ewndxymuxarazcshanry.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmR4eW11eGFyYXpjc2hhbnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTkyMDcsImV4cCI6MjA3MzU5NTIwN30.QvtvV5q7pZaSbuGQcLpeDG5AutHL0e_1dZ_qXJFdGOY";

let crimes = [];
let feed, search, filter, sort, count;

document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  feed   = document.getElementById("feed");
  search = document.getElementById("search");
  filter = document.getElementById("filter");
  sort   = document.getElementById("sort");
  count  = document.getElementById("count");

  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  sort.addEventListener("change", render);


  // FETCH DATA

  const { data, error } = await supabase
  .from("crimes")
  .select(`
  id,
  title,
  description,
  crime_types ( name, severity_level ),
  areas ( name )
  `)
  .order("id", { ascending: false });

  if(error){
  console.error("Error:", error);
  return;
  }

  crimes = data.map(c => ({
  title: c.title,
  area: c.areas?.name || "Unknown",
  type: c.crime_types?.name || "Unknown",
  severity: c.crime_types?.severity_level || 1,
  desc: c.description,
  id: c.id
  }));

  render();
});

//  SEVERITY 
function getSeverity(level){
if(level === 5) return {label:"Severe", class:"severe", dot:"red"};
if(level === 4) return {label:"High", class:"high", dot:"orange"};
if(level === 3) return {label:"Moderate", class:"medium", dot:"yellow"};
return {label:"Low", class:"low", dot:"blue"};
}

//  RENDER 
function render(){

let data = [...crimes];

// SEARCH
data = data.filter(c =>
c.title.toLowerCase().includes(search.value.toLowerCase()) ||
c.area.toLowerCase().includes(search.value.toLowerCase())
);

// FILTER
if(filter.value !== "all"){
data = data.filter(c => c.type === filter.value);
}

// SORT
if(sort.value === "severity"){
data.sort((a,b)=> b.severity - a.severity);
}

// COUNT
count.textContent = `${data.length} active incidents`;

feed.innerHTML = "";
data.forEach(c => {
  const sev = getSeverity(c.severity);
  feed.innerHTML += `
<article class="card">

<div class="card-top">
<div class="title-group">
<span class="dot ${sev.dot}"></span>
<h2>${c.title}</h2>
</div>

<span class="badge ${sev.class}">${sev.label}</span>
</div>

<div class="action-row">
<button class="btn" onclick="goToMap(${c.id})">View on Map</button>
</div>

<p class="meta">${c.area} • ${c.type}</p>
<p class="desc">${c.desc}</p>

</article>
`;
});

}

function goToMap(id){
window.location.href = `index.html?crime=${id}`;
}
