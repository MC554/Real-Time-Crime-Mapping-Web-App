const el = (id) => document.getElementById(id);
const body = document.body;
const list = el("locationList");
const notifyToggle = el("notifyToggle");

const updateSummary = () => {
  const crimes = document.querySelectorAll(".crime-checkbox:checked").length;
  const locations = document.querySelectorAll(".location-item").length;
  const live = notifyToggle.classList.contains("active");

  el("trackedCrimesCount").textContent = `${crimes} selected`;
  el("alertRadiusText").textContent = el("radius").value;
  el("frequencyText").textContent = el("frequency").value;
  el("savedCount").textContent =
    `${locations} location${locations !== 1 ? "s" : ""}`;
  el("notifyStatusText").textContent = live ? "Enabled" : "Disabled";
  el("liveStatusPill").textContent = live
    ? `Live alerts active within ${el("radius").value}`
    : "Live alerts turned off";
};

const makeLocation = (name, address) => `
  <div class="location-item">
    <div>
      <strong>${name}</strong>
      <p>${address}</p>
    </div>
    <div class="location-actions">
      <button class="ghost-btn edit-btn" type="button">Edit</button>
      <button class="ghost-btn remove-btn" type="button">Remove</button>
    </div>
  </div>
`;

el("themeToggle").onclick = () => body.classList.toggle("dark");

notifyToggle.onclick = () => {
  notifyToggle.classList.toggle("active");
  updateSummary();
};

el("addLocationBtn").onclick = () => {
  const name = el("newLocationName").value.trim();
  const address = el("newLocationAddress").value.trim();

  if (!name || !address) {
    alert("Please enter both a location label and address.");
    return;
  }

  list.insertAdjacentHTML("beforeend", makeLocation(name, address));
  el("newLocationName").value = "";
  el("newLocationAddress").value = "";
  updateSummary();
};

["radius", "frequency"].forEach((id) => (el(id).onchange = updateSummary));
document
  .querySelectorAll(".crime-checkbox")
  .forEach((box) => (box.onchange = updateSummary));

["newLocationName", "newLocationAddress"].forEach((id) => {
  el(id).onkeydown = (e) => e.key === "Enter" && el("addLocationBtn").click();
});

list.onclick = (e) => {
  const item = e.target.closest(".location-item");
  if (!item) return;

  if (e.target.classList.contains("remove-btn")) {
    item.remove();
    updateSummary();
  }

  if (e.target.classList.contains("edit-btn")) {
    const title = item.querySelector("strong");
    const address = item.querySelector("p");

    const newTitle = prompt("Edit location label:", title.textContent);
    if (newTitle === null) return;

    const newAddress = prompt("Edit location address:", address.textContent);
    if (newAddress === null) return;

    if (!newTitle.trim() || !newAddress.trim()) {
      alert("Location label and address cannot be empty.");
      return;
    }

    title.textContent = newTitle.trim();
    address.textContent = newAddress.trim();
    updateSummary();
  }
};

updateSummary();
