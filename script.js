/* =========================================================
   SP SUPPORT - SCRIPT.JS
   Roblox Staff Login
   ========================================================= */


/* =========================
   STAFF CONFIG
   ========================= */

const STAFF_USER_IDS = [
    "11638098536"
];

const STAFF_USERNAMES = [
    "zjehoua"
];


/* =========================
   STORAGE KEYS
   ========================= */

const REPORTS_KEY = "sp_support_reports";
const APPEALS_KEY = "sp_support_appeals";
const TICKETS_KEY = "sp_support_tickets";
const STAFF_SESSION_KEY = "sp_support_staff_session";


/* =========================
   HELPERS
   ========================= */

function $(id) {
    return document.getElementById(id);
}

function getJSON(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function makeID(prefix = "SP") {
    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );
}

function formatDate(date) {
    return new Date(date).toLocaleString();
}


/* =========================
   STAFF AUTHENTICATION
   ========================= */

function isStaff(username, userId) {
    const cleanUsername = String(username || "")
        .trim()
        .toLowerCase();

    const cleanUserId = String(userId || "").trim();

    const idAllowed =
        cleanUserId !== "" &&
        STAFF_USER_IDS.includes(cleanUserId);

    const usernameAllowed =
        cleanUsername !== "" &&
        STAFF_USERNAMES.some(
            name => name.toLowerCase() === cleanUsername
        );

    return idAllowed || usernameAllowed;
}


function getStaffSession() {
    try {
        const session = sessionStorage.getItem(
            STAFF_SESSION_KEY
        );

        return session ? JSON.parse(session) : null;
    } catch (error) {
        return null;
    }
}


function setStaffUI(staff) {
    const authGate = $("authGate");
    const modNav = $("modNav");
    const signOut = $("signOut");
    const avatar = $("avatar");

    if (staff) {

        if (authGate) {
            authGate.classList.add("hidden");
        }

        if (modNav) {
            modNav.classList.remove("hidden");
        }

        if (signOut) {
            signOut.classList.remove("hidden");
        }

        if (avatar) {
            avatar.textContent = String(
                staff.username || "S"
            )
                .charAt(0)
                .toUpperCase();
        }

    } else {

        if (authGate) {
            authGate.classList.remove("hidden");
        }

        if (modNav) {
            modNav.classList.add("hidden");
        }

        if (signOut) {
            signOut.classList.add("hidden");
        }

        if (avatar) {
            avatar.textContent = "S";
        }
    }
}


/* =========================
   ROBLOX STAFF LOGIN
   ========================= */

function robloxLogin() {
    const usernameInput = $("robloxUsername");
    const userIdInput = $("robloxUserId");
    const error = $("authError");

    if (!usernameInput || !userIdInput) {
        console.error(
            "Missing robloxUsername or robloxUserId element."
        );
        return;
    }

    const username = usernameInput.value.trim();
    const userId = userIdInput.value.trim();

    if (!username && !userId) {

        if (error) {
            error.textContent =
                "Enter your Roblox username or User ID.";

            error.classList.remove("hidden");
        }

        return;
    }

    if (!isStaff(username, userId)) {

        if (error) {
            error.textContent =
                "You are not authorized as SP staff.";

            error.classList.remove("hidden");
        }

        return;
    }

    const staff = {
        username: username || "Staff",
        userId: userId || "",
        loggedInAt: Date.now()
    };

    sessionStorage.setItem(
        STAFF_SESSION_KEY,
        JSON.stringify(staff)
    );

    if (error) {
        error.textContent = "";
        error.classList.add("hidden");
    }

    setStaffUI(staff);

    showPage("moderation");

    showToast("Staff login successful.");
}


function signOutStaff() {
    sessionStorage.removeItem(
        STAFF_SESSION_KEY
    );

    setStaffUI(null);

    showPage("dashboard");

    showToast("Signed out.");
}


/* =========================
   TOAST
   ========================= */

function showToast(message) {
    let toast = $("toast");

    if (!toast) {
        toast = document.createElement("div");

        toast.id = "toast";
        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.spToastTimer);

    window.spToastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================
   PAGE NAVIGATION
   ========================= */

function showPage(page) {

    document.querySelectorAll(".page").forEach(
        element => {
            element.classList.remove("active");
        }
    );

    const target = $("page-" + page);

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll("[data-page]").forEach(
        button => {
            button.classList.toggle(
                "active",
                button.dataset.page === page
            );
        }
    );

    if (page === "moderation") {

        const staff = getStaffSession();

        if (
            !staff ||
            !isStaff(
                staff.username,
                staff.userId
            )
        ) {

            showPage("dashboard");

            const authGate = $("authGate");

            if (authGate) {
                authGate.classList.remove("hidden");
            }

            showToast(
                "Staff login required."
            );

            return;
        }

        renderModeration();
    }
}


/* =========================
   REPORTS
   ========================= */

function submitReport() {

    const username = $("reportUsername");
    const reason = $("reportReason");
    const details = $("reportDetails");

    if (!username || !reason) {
        return;
    }

    const targetUsername =
        username.value.trim();

    const selectedReason =
        reason.value;

    const reportDetails =
        details ? details.value.trim() : "";

    if (
        !targetUsername ||
        !selectedReason
    ) {

        showToast(
            "Please complete the required fields."
        );

        return;
    }

    const reports =
        getJSON(REPORTS_KEY);

    const report = {
        id: makeID("REPORT"),
        username: targetUsername,
        reason: selectedReason,
        details: reportDetails,
        status: "Pending",
        moderatorNote: "",
        createdAt:
            new Date().toISOString()
    };

    reports.unshift(report);

    saveJSON(
        REPORTS_KEY,
        reports
    );

    username.value = "";
    reason.value = "";

    if (details) {
        details.value = "";
    }

    showToast(
        "Report submitted."
    );
}


/* =========================
   APPEALS
   ========================= */

function submitAppeal() {

    const username =
        $("appealUsername");

    const reason =
        $("appealReason");

    const details =
        $("appealDetails");

    if (!username || !details) {
        return;
    }

    const robloxUsername =
        username.value.trim();

    const appealReason =
        reason && reason.value
            ? reason.value
            : "Ban Appeal";

    const appealDetails =
        details.value.trim();

    if (
        !robloxUsername ||
        !appealDetails
    ) {

        showToast(
            "Please complete the required fields."
        );

        return;
    }

    const appeals =
        getJSON(APPEALS_KEY);

    const appeal = {
        id: makeID("APPEAL"),
        username: robloxUsername,
        reason: appealReason,
        details: appealDetails,
        status: "Pending",
        moderatorNote: "",
        createdAt:
            new Date().toISOString()
    };

    appeals.unshift(appeal);

    saveJSON(
        APPEALS_KEY,
        appeals
    );

    username.value = "";

    if (reason) {
        reason.value = "";
    }

    details.value = "";

    showToast(
        "Appeal submitted."
    );
}


/* =========================
   TICKETS
   ========================= */

function submitTicket() {

    const username =
        $("ticketUsername");

    const subject =
        $("ticketSubject");

    const details =
        $("ticketDetails");

    if (
        !username ||
        !subject ||
        !details
    ) {
        return;
    }

    const robloxUsername =
        username.value.trim();

    const ticketSubject =
        subject.value.trim();

    const ticketDetails =
        details.value.trim();

    if (
        !robloxUsername ||
        !ticketSubject ||
        !ticketDetails
    ) {

        showToast(
            "Please complete the required fields."
        );

        return;
    }

    const tickets =
        getJSON(TICKETS_KEY);

    const ticket = {
        id: makeID("TICKET"),
        username: robloxUsername,
        subject: ticketSubject,
        details: ticketDetails,
        status: "Pending",
        moderatorNote: "",
        createdAt:
            new Date().toISOString()
    };

    tickets.unshift(ticket);

    saveJSON(
        TICKETS_KEY,
        tickets
    );

    username.value = "";
    subject.value = "";
    details.value = "";

    showToast(
        "Ticket submitted."
    );
}


/* =========================
   GET ALL SUBMISSIONS
   ========================= */

function getAllSubmissions() {

    const reports =
        getJSON(REPORTS_KEY).map(
            item => ({
                ...item,
                type: "Game Report"
            })
        );

    const appeals =
        getJSON(APPEALS_KEY).map(
            item => ({
                ...item,
                type: "Appeal"
            })
        );

    const tickets =
        getJSON(TICKETS_KEY).map(
            item => ({
                ...item,
                type: "Ticket"
            })
        );

    return [
        ...reports,
        ...appeals,
        ...tickets
    ].sort(
        (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
    );
}


/* =========================
   UPDATE SUBMISSION
   ========================= */

function getStorageKey(type) {

    if (type === "Game Report") {
        return REPORTS_KEY;
    }

    if (type === "Appeal") {
        return APPEALS_KEY;
    }

    return TICKETS_KEY;
}


function updateSubmission(
    type,
    id,
    status,
    note
) {

    const key =
        getStorageKey(type);

    const items =
        getJSON(key);

    const index =
        items.findIndex(
            item => item.id === id
        );

    if (index === -1) {
        return;
    }

    items[index].status =
        status;

    items[index].moderatorNote =
        note;

    items[index].updatedAt =
        new Date().toISOString();

    const staff =
        getStaffSession();

    if (staff) {
        items[index].reviewedBy =
            staff.username;
    }

    saveJSON(
        key,
        items
    );

    renderModeration();

    showToast(
        "Submission updated."
    );
}


/* =========================
   DELETE SUBMISSION
   ========================= */

function deleteSubmission(
    type,
    id
) {

    const key =
        getStorageKey(type);

    const items =
        getJSON(key);

    const filtered =
        items.filter(
            item => item.id !== id
        );

    saveJSON(
        key,
        filtered
    );

    renderModeration();

    showToast(
        "Submission deleted."
    );
}


/* =========================
   MODERATION DASHBOARD
   ========================= */

function renderModeration() {

    const container =
        $("moderationList");

    if (!container) {
        return;
    }

    const submissions =
        getAllSubmissions();

    const filter =
        $("statusFilter");

    const selectedStatus =
        filter && filter.value
            ? filter.value
            : "All";

    const filtered =
        selectedStatus === "All"
            ? submissions
            : submissions.filter(
                item =>
                    item.status ===
                    selectedStatus
            );

    updateModerationCounters(
        submissions
    );

    if (!filtered.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No submissions</h3>
                <p>
                    There are no submissions
                    matching this filter.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        filtered.map(item => {

            const statusClass =
                String(item.status)
                    .toLowerCase()
                    .replace(/\s+/g, "-");

            return `
                <div class="moderation-card">

                    <div class="moderation-header">

                        <div>
                            <span class="submission-type">
                                ${escapeHTML(item.type)}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    item.username ||
                                    "Unknown"
                                )}
                            </h3>

                            <small>
                                ${escapeHTML(item.id)}
                            </small>
                        </div>

                        <span class="status ${statusClass}">
                            ${escapeHTML(item.status)}
                        </span>

                    </div>


                    <div class="moderation-body">

                        ${
                            item.reason
                                ? `
                                    <p>
                                        <strong>
                                            Reason:
                                        </strong>
                                        ${escapeHTML(
                                            item.reason
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            item.subject
                                ? `
                                    <p>
                                        <strong>
                                            Subject:
                                        </strong>
                                        ${escapeHTML(
                                            item.subject
                                        )}
                                    </p>
                                `
                                : ""
                        }


                        <p>
                            <strong>
                                Details:
                            </strong>
                            <br>
                            ${escapeHTML(
                                item.details ||
                                "No details provided."
                            )}
                        </p>


                        <p class="submission-date">
                            Submitted:
                            ${escapeHTML(
                                formatDate(
                                    item.createdAt
                                )
                            )}
                        </p>


                        ${
                            item.moderatorNote
                                ? `
                                    <div class="moderator-note">
                                        <strong>
                                            Moderator Note
                                        </strong>

                                        <p>
                                            ${escapeHTML(
                                                item.moderatorNote
                                            )}
                                        </p>
                                    </div>
                                `
                                : ""
                        }

                    </div>


                    <div class="moderation-actions">

                        <select
                            class="status-select"
                            data-status-id="${escapeHTML(item.id)}"
                            data-status-type="${escapeHTML(item.type)}"
                        >

                            <option value="Pending"
                                ${item.status === "Pending" ? "selected" : ""}>
                                Pending
                            </option>

                            <option value="Reviewing"
                                ${item.status === "Reviewing" ? "selected" : ""}>
                                Reviewing
                            </option>

                            <option value="Reviewed"
                                ${item.status === "Reviewed" ? "selected" : ""}>
                                Reviewed
                            </option>

                            <option value="Accepted"
                                ${item.status === "Accepted" ? "selected" : ""}>
                                Accepted
                            </option>

                            <option value="Rejected"
                                ${item.status === "Rejected" ? "selected" : ""}>
                                Rejected
                            </option>

                            <option value="Closed"
                                ${item.status === "Closed" ? "selected" : ""}>
                                Closed
                            </option>

                        </select>


                        <input
                            type="text"
                            class="note-input"
                            placeholder="Moderator note..."
                            value="${escapeHTML(
                                item.moderatorNote || ""
                            )}"
                            data-note-id="${escapeHTML(item.id)}"
                            data-note-type="${escapeHTML(item.type)}"
                        />


                        <button
                            class="primary-btn update-submission"
                            data-id="${escapeHTML(item.id)}"
                            data-type="${escapeHTML(item.type)}"
                            type="button"
                        >
                            Update
                        </button>


                        <button
                            class="danger-btn delete-submission"
                            data-id="${escapeHTML(item.id)}"
                            data-type="${escapeHTML(item.type)}"
                            type="button"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================
   MODERATION COUNTERS
   ========================= */

function updateModerationCounters(
    submissions
) {

    const pending =
        submissions.filter(
            item => item.status === "Pending"
        ).length;

    const reviewing =
        submissions.filter(
            item => item.status === "Reviewing"
        ).length;

    const accepted =
        submissions.filter(
            item => item.status === "Accepted"
        ).length;

    const rejected =
        submissions.filter(
            item => item.status === "Rejected"
        ).length;


    const pendingCount =
        $("pendingCount");

    const reviewingCount =
        $("reviewingCount");

    const acceptedCount =
        $("acceptedCount");

    const rejectedCount =
        $("rejectedCount");


    if (pendingCount) {
        pendingCount.textContent =
            pending;
    }

    if (reviewingCount) {
        reviewingCount.textContent =
            reviewing;
    }

    if (acceptedCount) {
        acceptedCount.textContent =
            accepted;
    }

    if (rejectedCount) {
        rejectedCount.textContent =
            rejected;
    }
}


/* =========================
   CLICK EVENTS
   ========================= */

document.addEventListener(
    "click",
    function (event) {

        const pageButton =
            event.target.closest(
                "[data-page]"
            );

        if (pageButton) {

            const page =
                pageButton.dataset.page;

            showPage(page);

            return;
        }


        if (
            event.target.closest(
                "#robloxLogin"
            )
        ) {

            robloxLogin();

            return;
        }


        if (
            event.target.closest(
                "#signOut"
            )
        ) {

            signOutStaff();

            return;
        }


        if (
            event.target.closest(
                "#submitReport"
            )
        ) {

            submitReport();

            return;
        }


        if (
            event.target.closest(
                "#submitAppeal"
            )
        ) {

            submitAppeal();

            return;
        }


        if (
            event.target.closest(
                "#submitTicket"
            )
        ) {

            submitTicket();

            return;
        }


        const updateButton =
            event.target.closest(
                ".update-submission"
            );

        if (updateButton) {

            const id =
                updateButton.dataset.id;

            const type =
                updateButton.dataset.type;

            const statusSelect =
                document.querySelector(
                    `.status-select[data-status-id="${CSS.escape(id)}"]`
                );

            const noteInput =
                document.querySelector(
                    `.note-input[data-note-id="${CSS.escape(id)}"]`
                );

            const status =
                statusSelect
                    ? statusSelect.value
                    : "Pending";

            const note =
                noteInput
                    ? noteInput.value.trim()
                    : "";

            updateSubmission(
                type,
                id,
                status,
                note
            );

            return;
        }


        const deleteButton =
            event.target.closest(
                ".delete-submission"
            );

        if (deleteButton) {

            const id =
                deleteButton.dataset.id;

            const type =
                deleteButton.dataset.type;

            if (
                confirm(
                    "Are you sure you want to delete this submission?"
                )
            ) {

                deleteSubmission(
                    type,
                    id
                );
            }

            return;
        }
    }
);


/* =========================
   FORM EVENTS
   ========================= */

document.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const form =
            event.target;

        if (form.id === "reportForm") {
            submitReport();
        }

        if (form.id === "appealForm") {
            submitAppeal();
        }

        if (form.id === "ticketForm") {
            submitTicket();
        }

        if (form.id === "staffLoginForm") {
            robloxLogin();
        }
    }
);


/* =========================
   STATUS FILTER
   ========================= */

document.addEventListener(
    "change",
    function (event) {

        if (
            event.target.id ===
            "statusFilter"
        ) {

            renderModeration();
        }
    }
);


/* =========================
   ENTER TO LOGIN
   ========================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter" &&
            (
                event.target.id ===
                    "robloxUsername" ||
                event.target.id ===
                    "robloxUserId"
            )
        ) {

            event.preventDefault();

            robloxLogin();
        }
    }
);


/* =========================
   INITIALIZE
   ========================= */

function initialize() {

    const staff =
        getStaffSession();

    if (
        staff &&
        isStaff(
            staff.username,
            staff.userId
        )
    ) {

        setStaffUI(staff);

    } else {

        sessionStorage.removeItem(
            STAFF_SESSION_KEY
        );

        setStaffUI(null);
    }


    const currentPage =
        document.querySelector(
            ".page.active"
        );

    if (!currentPage) {
        showPage("dashboard");
    }


    renderModeration();
}


/* =========================
   START
   ========================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();
}
