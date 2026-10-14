let notes = [];
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
    }
}

function createNote(note) {
    const element = document.createElement("div")
    element.className = "note " + note.category;
    element.style.left = note.x + "px";
    element.style.top = note.y + "px";

    element.innerHTML = `
    <div class="note-header">
        <span>${labels[note.category]}</span>
        <button class="delete">X</button>
    </div>
    <textarea placeholder="Write..."></textarea>
    `;
    
    const textarea = element.querySelector("textarea")
    .value = note.text;

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
    });
    savetolocalstorage();
    render();
});

filter.addEventListener("change", render);

load();
render();

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