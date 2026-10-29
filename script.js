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
    try {
    localStorage.setItem("stickyNotes", JSON.stringify(notes))
    } catch (err) {
        alert("Storage can only hold up 5MB. Please remove some images before trying again.")
    }
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

// insert images 
function imagereader(file, callback) {
    const reader = new FileReader();

    reader.onload = function() {
        const img = new Image()

        img.onload = function () {
            const maxSize = 500;
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));

            const canvas = document.createElement("canvas")
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            const context = canvas.getContext("2d");
            context.fillStyle = "#ffffff"
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, 0, 0, canvas.width, canvas.height);

            callback(canvas.toDataURL("image/jpeg", 0.8))
        };
        img.src = reader.result;
    }
    reader.readAsDataURL(file)
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
        <div class="note-actions">
            <button class="add-img" title="Add your image">+ IMG</button>
            <button class="delete">X</button>
        </div>
    </div>
    <div class="img-box" hidden>
        <img class="note-img" alt="" draggable="false">
    </div>
    <textarea placeholder="write something..."></textarea>
    <div class = "note-date">${formatDate(note.createdwhen)}</div>
    <input type="file" accept="image/*" class="file-input" hidden>
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

    //images
    const fileInput = element.querySelector(".file-input");
    const imgElement = element.querySelector(".note-img");
    const imgBox = element.querySelector(".img-box")
    const imgBtn = element.querySelector(".add-img")

    function showImage() {
        if (note.image) {
            imgElement.src = note.image;
            imgBox.style.height = (note.imgHeight || 140) + "px";
            imgBox.hidden = false;
            imgBtn.textContent = "- IMG"
            imgBtn.title = "Remove image?";
        } else {
            imgBox.hidden = true;
            imgBtn.textContent = "+ IMG";
            imgBtn.title = "Add Image?"
        }
    }
    showImage()

    imgBtn.addEventListener("click", function () {
        if (note.image) {
            if (confirm("Remove image?")) {
                note.image = null;
                note.imgHeight = null
                showImage()
                savetolocalstorage()
            }
        } else {
            fileInput.click()
        }
    });

    const imgSizing = new ResizeObserver(function () {
        if (imgBox.hidden) return;

        const h = imgBox.offsetHeight;
        if (h === 0 || h === note.imgHeight) return;

        note.imgHeight = h;
        savetolocalstorage
    });
    imgSizing.observe(imgBox)

    fileInput.addEventListener("change", function () {
        const file = fileInput.files[0];
        fileInput.value = "";

        if (!file || !file.type.startsWith("image/")) return;

        imagereader(file, function (dataUrl) {
            note.image = dataUrl
            note.h = Math.max(note.h || 180, 300);
            element.style.height = note.h + "px";
            showImage()
            savetolocalstorage()
        });
    });

    imgElement.addEventListener("click", function () {
        if (confirm("Remove image")) {
            note.image = null;
            showImage();
            savetolocalstorage()
        }
    })

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

// + New note colour change correpsonding to the chosen note
function changeButtonColour() {
    addBtn.dataset.category = categories.value;
}

categories.addEventListener("change", changeButtonColour);
changeButtonColour()

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

function spawnBat() {
    const bat = document.createElement("div")
    bat.className = "bat";
    bat.innerHTML = '<span><img src="images/bat.png" alt="bats" draggable="false"></span>';
    bat.style.top = Math.random() * 60 + "vh"
    bat.style.width = 40 + Math.random() * 60 + "px"
    bat.style.setProperty("--duration", 4 + Math.random() * 5 + "s")
    bat.style.setProperty("--wave", 20 + Math.random() * 60 + "px")

    bat.addEventListener("animationend", function () {
        bat.remove()
    })

    document.body.appendChild(bat)
}

function releaseBats() {
    if (!document.hidden) {
        spawnBat()
    }
    setTimeout(releaseBats, 1000 + Math.random() * 7000)
}

const motionReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!motionReduce) {
    setTimeout(releaseBats, 2000)
}