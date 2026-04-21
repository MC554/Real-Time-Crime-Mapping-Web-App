// data
const crimes = [
{title:"Armed Robbery", area:"City Centre", type:"Robbery", severity:5, desc:"Convenience store robbed"},
{title:"Late Night Assault", area:"Temple Bar", type:"Assault", severity:4, desc:"Altercation outside nightclub"},
{title:"Vehicle Theft", area:"Rathmines", type:"Theft", severity:3, desc:"Car stolen overnight"},
{title:"Graffiti Incident", area:"Sandyford", type:"Vandalism", severity:2, desc:"Wall vandalised"}
];


const feed = document.getElementById("feed");
const search = document.getElementById("search");
const filter = document.getElementById("filter");
const sort = document.getElementById("sort");
const count = document.getElementById("count");

// severity
function getSeverity(level){
if(level === 5) return {label:"Severe", class:"severe", dot:"red"};
if(level === 4) return {label:"High", class:"high", dot:"orange"};
if(level === 3) return {label:"Moderate", class:"medium", dot:"yellow"};
return {label:"Low", class:"low", dot:"blue"};
}


function render(){

let data = [...crimes];

// searchbar
data = data.filter(c =>
c.title.toLowerCase().includes(search.value.toLowerCase()) ||
c.area.toLowerCase().includes(search.value.toLowerCase())
);

// filter
if(filter.value !== "all"){
data = data.filter(c => c.type === filter.value);
}

// sorttby
if(sort.value === "severity"){
data.sort((a,b)=> b.severity - a.severity);
}else{
data = data.reverse();
}


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
<button class="btn">View on Map</button>
</div>

<p class="meta">${c.area} • ${c.type}</p>
<p class="desc">${c.desc}</p>

</article>
`;
});

}

// events
search.addEventListener("input", render);
filter.addEventListener("change", render);
sort.addEventListener("change", render);

render();
