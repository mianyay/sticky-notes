let notes = [];
let toplayerZ = 0;
const categories = document.getElementById("categories")
const filter = document.getElementById("filter")
const addBtn = document.getElementById("addBtn")
const board = document.getElementById("board")

const labels = {
    ideas: "Ideas",
    journal: "Journal",
    due: "Due",
    goals: "Goals"
}

function savetolocalstorage() {
    localStorage.setItem("stickyNotes", JSON.stringify(notes))
}

function load() {
    const saved = localStorage.getItem("stickyNotes");
    if (saved) {
        notes = JSON.parse(saved);
        toplayerZ = Math.max(0, ...notes.map(function (n) { return n.z || 0; }))
    }
}

function formatDate(timestamp) {
    if (!timestamp) return "";

    return new Date(timestamp).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function createNote(note) {
    const element = document.createElement("div")
    element.className = "note " + note.category;
    element.style.left = note.x + "px";
    element.style.top = note.y + "px";
    element.style.width = (note.w || 200) + "px";
    element.style.height = (note.h || 180) + "px";
    element.style.zIndex = note.z || 0;

    element.innerHTML = `
    <div class="note-header">
        <span>${labels[note.category]}</span>
        <button class="delete">X</button>
    </div>
    <textarea placeholder="Write..."></textarea>
    <div class = "note-date">${formatDate(note.createdwhen)}</div>
    `;
    
    const textarea = element.querySelector("textarea");
    textarea.value = note.text;

    textarea.addEventListener("input", function () {
        note.text = textarea.value;
        savetolocalstorage();
    });

    element.querySelector(".delete").addEventListener("click", function() {
        notes = notes.filter(function(a) {
            return a.id !== note.id;
        });
        savetolocalstorage()
        render()
    });
    drag(element, element.querySelector(".note-header"), note)
    toFront(element, note)

    const sizing = new ResizeObserver(function () {
        const w = element.offsetWidth;
        const h = element.offsetHeight;

        if (w === note.w && h === note.h) return;

        note.w = w
        note.h = h
        savetolocalstorage()
    })
    sizing.observe(element)
    return element;
};

function render() {
    board.innerHTML = "";
    const filtering = filter.value;

    notes
    .filter(function (note) {
        return filtering === "all" || filtering === "" || note.category === filtering;
    })
    .forEach(function (note) {
        board.appendChild(createNote(note));
    });
}

addBtn.addEventListener("click", function () {
    notes.push({
        id: Date.now(),
        text: "",
        category: categories.value,
        x: 40 + Math.random() * 300,
        y: 40 + Math.random() * 200,
        z: ++toplayerZ,
        createdwhen: Date.now(),
        w: 200,
        h: 180,
    });
    savetolocalstorage();
    render();
});

filter.addEventListener("change", render);

load();
render();

function toFront(element, note) {
    element.addEventListener("pointerdown", function () {
        note.z = ++toplayerZ
        element.style.zIndex = note.z
        savetolocalstorage()
    });
};

function drag(element, handle, note) {
    handle.addEventListener("pointerdown", function(e) {
        if (e.target.tagName === "BUTTON") return;

        const offsetX = e.clientX - element.offsetLeft;
        const offsetY = e.clientY - element.offsetTop;
        handle.setPointerCapture(e.pointerId);

        function move(e) {
            element.style.left = e.clientX - offsetX + "px";
            element.style.top = e.clientY - offsetY + "px";
        }

        function up() {
            note.x = element.offsetLeft;
            note.y = element.offsetTop;
            savetolocalstorage()
            handle.removeEventListener("pointermove", move)
            handle.removeEventListener("pointerup", up)
        }

        handle.addEventListener("pointermove", move)
        handle.addEventListener("pointerup", up)
    });
}