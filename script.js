const pages = [...document.querySelectorAll('.page')];
const navs = [...document.querySelectorAll('.nav')];
const title = document.getElementById('pageTitle');

const titles = {
  dashboard: 'How can we help?',
  reports: 'Game Reports',
  appeals: 'Appeals',
  tickets: 'Other Tickets',
  forms: 'Forms',
  moderation: 'Moderation Dashboard'
};

const statuses = [
  'Pending',
  'Reviewing',
  'Reviewed',
  'Accepted',
  'Rejected',
  'Closed'
];

/* =========================================
   STAFF SETTINGS
   =========================================
   
   Put the Roblox User IDs of your staff here.

   Example:
   const STAFF_USER_IDS = [
     '123456789',
     '987654321'
   ];

   You can add as many as you want.
*/

const STAFF_USER_IDS = [
  '11638098536'
];

/*
   You can also allow usernames.

   Example:
   const STAFF_USERNAMES = [
     'YourUsername',
     'ModeratorUsername'
   ];
*/

const STAFF_USERNAMES = [
  'zjehoua'
];


/* =========================================
   REQUEST STORAGE
========================================= */

function getRequests() {
  try {
    return JSON.parse(
      localStorage.getItem('sp_support_requests') || '[]'
    );
  } catch {
    return [];
  }
}

function saveRequests(value) {
  localStorage.setItem(
    'sp_support_requests',
    JSON.stringify(value)
  );
}


/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(id) {
  pages.forEach(page => {
    page.classList.toggle(
      'active',
      page.id === id
    );
  });

  navs.forEach(nav => {
    nav.classList.toggle(
      'active',
      nav.dataset.page === id
    );
  });

  title.textContent =
    titles[id] || 'SP Support';

  const main =
    document.querySelector('.main');

  if (main) {
    main.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  if (id === 'moderation') {
    renderModeration();
  }
}


document.addEventListener(
  'click',
  event => {

    const element =
      event.target.closest('[data-page]');

    if (element) {
      showPage(
        element.dataset.page
      );
    }
  }
);


/* =========================================
   SIDEBAR
========================================= */

const collapseButton =
  document.getElementById('collapse');

if (collapseButton) {

  collapseButton.onclick = () => {

    document
      .getElementById('sidebar')
      ?.classList.toggle('collapsed');

    document
      .querySelector('.main')
      ?.classList.toggle('shift');
  };
}


/* =========================================
   TOAST
========================================= */

function toast(
  message,
  bold = 'Submitted!'
) {

  const toastElement =
    document.getElementById('toast');

  if (!toastElement) return;

  const boldElement =
    toastElement.querySelector('b');

  const messageElement =
    toastElement.querySelector('span');

  if (boldElement) {
    boldElement.textContent = bold;
  }

  if (messageElement) {
    messageElement.textContent = message;
  }

  toastElement.classList.add('show');

  setTimeout(() => {
    toastElement.classList.remove('show');
  }, 4000);
}


/* =========================================
   SUBMIT REPORT / APPEAL / TICKET
========================================= */

function submitRequest(
  event,
  type
) {

  event.preventDefault();

  const data =
    Object.fromEntries(
      new FormData(
        event.target
      ).entries()
    );

  const item = {

    id:
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2, 7),

    type,

    username:
      data.username || '',

    reason:
      data.reason || '',

    description:
      data.description || '',

    evidence:
      data.evidence || '',

    status:
      'Pending',

    note:
      '',

    createdAt:
      new Date().toLocaleString()
  };

  const all =
    getRequests();

  all.unshift(item);

  saveRequests(all);

  event.target.reset();

  toast(
    type +
      ' received and marked Pending.',
    'Submitted!'
  );
}


/* =========================================
   HTML ESCAPE
========================================= */

function esc(value = '') {

  return String(value).replace(
    /[&<>'"]/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    })[character]
  );
}


/* =========================================
   MODERATION DASHBOARD
========================================= */

function renderModeration() {

  const filterElement =
    document.getElementById(
      'modFilter'
    );

  const box =
    document.getElementById(
      'modList'
    );

  if (!filterElement || !box) {
    return;
  }

  const all =
    getRequests();

  const filter =
    filterElement.value;

  const list =
    filter === 'All'
      ? all
      : all.filter(
          item =>
            item.status === filter
        );


  const pending =
    document.getElementById(
      'statPending'
    );

  const reviewing =
    document.getElementById(
      'statReviewing'
    );

  const accepted =
    document.getElementById(
      'statAccepted'
    );

  const rejected =
    document.getElementById(
      'statRejected'
    );


  if (pending) {
    pending.textContent =
      all.filter(
        x =>
          x.status === 'Pending'
      ).length;
  }

  if (reviewing) {
    reviewing.textContent =
      all.filter(
        x =>
          x.status === 'Reviewing'
      ).length;
  }

  if (accepted) {
    accepted.textContent =
      all.filter(
        x =>
          x.status === 'Accepted'
      ).length;
  }

  if (rejected) {
    rejected.textContent =
      all.filter(
        x =>
          x.status === 'Rejected'
      ).length;
  }


  if (!list.length) {

    box.innerHTML = `
      <div class="empty-mod">
        <div>◆</div>
        <h3>No requests here</h3>
        <p>
          New public submissions will appear
          in this dashboard.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    list
      .map(item => `

        <article class="mod-item">

          <div class="mod-item-head">

            <div>

              <span class="type-badge">
                ${esc(item.type)}
              </span>

              <h3>
                ${esc(item.username)}
              </h3>

              <small>
                ${esc(item.createdAt)}
                · ID ${esc(item.id)}
              </small>

            </div>

            <span
              class="
                status-dot-badge
                ${esc(
                  item.status.toLowerCase()
                )}
              "
            >
              ${esc(item.status)}
            </span>

          </div>


          <div class="request-body">

            <div>

              <b>
                ${esc(
                  item.reason ||
                  'Request'
                )}
              </b>

              <p>
                ${esc(
                  item.description
                )}
              </p>

              ${
                item.evidence
                  ? `
                    <a
                      href="${esc(
                        item.evidence
                      )}"
                      target="_blank"
                      rel="noopener"
                    >
                      Evidence link ↗
                    </a>
                  `
                  : ''
              }

            </div>


            <div class="mod-controls">

              <label>
                Status

                <select
                  onchange="
                    changeStatus(
                      '${esc(item.id)}',
                      this.value
                    )
                  "
                >

                  ${statuses
                    .map(
                      status => `
                        <option
                          ${
                            status ===
                            item.status
                              ? 'selected'
                              : ''
                          }
                        >
                          ${status}
                        </option>
                      `
                    )
                    .join('')}

                </select>

              </label>


              <label>

                Moderator note

                <textarea
                  id="note-${esc(
                    item.id
                  )}"
                  placeholder="Internal note..."
                >${esc(
                  item.note
                )}</textarea>

              </label>


              <button
                class="save-note"
                onclick="
                  saveNote(
                    '${esc(item.id)}'
                  )
                "
              >
                Save note
              </button>

            </div>

          </div>

        </article>

      `)
      .join('');
}


/* =========================================
   CHANGE STATUS
========================================= */

function changeStatus(
  id,
  status
) {

  const all =
    getRequests();

  const item =
    all.find(
      request =>
        request.id === id
    );

  if (!item) return;

  item.status =
    status;

  saveRequests(all);

  renderModeration();

  toast(
    'Status updated to ' +
      status +
      '.',
    'Updated!'
  );
}


/* =========================================
   SAVE MODERATOR NOTE
========================================= */

function saveNote(id) {

  const textarea =
    document.getElementById(
      'note-' + id
    );

  const all =
    getRequests();

  const item =
    all.find(
      request =>
        request.id === id
    );

  if (!item || !textarea) {
    return;
  }

  item.note =
    textarea.value;

  saveRequests(all);

  toast(
    'Moderator note saved.',
    'Saved!'
  );
}


const modFilter =
  document.getElementById(
    'modFilter'
  );

if (modFilter) {

  modFilter.addEventListener(
    'change',
    renderModeration
  );
}


/* =========================================
   LOADING SCREEN
========================================= */

window.addEventListener(
  'load',
  () => {

    setTimeout(() => {

      const loader =
        document.getElementById(
          'loader'
        );

      if (loader) {
        loader.classList.add(
          'done'
        );
      }

      document.body.style.overflow =
        'auto';

    }, 2550);
  }
);


/* =========================================
   ROBLOX STAFF LOGIN
========================================= */

const authGate =
  document.getElementById(
    'authGate'
  );

const modNav =
  document.getElementById(
    'modNav'
  );

const signOutBtn =
  document.getElementById(
    'signOut'
  );

const avatar =
  document.getElementById(
    'avatar'
  );

const authError =
  document.getElementById(
    'authError'
  );

const robloxUsernameInput =
  document.getElementById(
    'robloxUsername'
  );

const robloxUserIdInput =
  document.getElementById(
    'robloxUserId'
  );

const robloxLoginButton =
  document.getElementById(
    'robloxLogin'
  );


/* =========================================
   CHECK STAFF
========================================= */

function isStaff(
  username,
  userId
) {

  const cleanUsername =
    String(username || '')
      .trim()
      .toLowerCase();

  const cleanUserId =
    String(userId || '')
      .trim();


  const idMatch =
    STAFF_USER_IDS.some(
      id =>
        String(id)
          .trim() ===
        cleanUserId
    );


  const usernameMatch =
    STAFF_USERNAMES.some(
      name =>
        String(name)
          .trim()
          .toLowerCase() ===
        cleanUsername
    );


  return (
    idMatch ||
    usernameMatch
  );
}


/* =========================================
   SET STAFF UI
========================================= */

function setStaffUI(
  username,
  userId
) {

  if (authGate) {
    authGate.style.display =
      'none';
  }

  if (modNav) {
    modNav.hidden =
      false;
  }

  if (signOutBtn) {
    signOutBtn.hidden =
      false;
  }

  if (avatar) {

    avatar.textContent =
      String(
        username ||
        'Staff'
      )
        .trim()
        .slice(0, 2)
        .toUpperCase();
  }


  sessionStorage.setItem(
    'sp_staff_username',
    username
  );

  sessionStorage.setItem(
    'sp_staff_userid',
    userId
  );
}


/* =========================================
   ROBLOX LOGIN
========================================= */

function robloxLogin() {

  if (authError) {
    authError.textContent =
      '';
  }


  const username =
    robloxUsernameInput
      ? robloxUsernameInput.value
      : '';

  const userId =
    robloxUserIdInput
      ? robloxUserIdInput.value
      : '';


  if (!username && !userId) {

    if (authError) {
      authError.textContent =
        'Enter your Roblox username or User ID.';
    }

    return;
  }


  if (
    !isStaff(
      username,
      userId
    )
  ) {

    if (authError) {
      authError.textContent =
        'This Roblox account is not authorized for the SP staff dashboard.';
    }

    return;
  }


  setStaffUI(
    username || 'Staff',
    userId || ''
  );


  toast(
    'Staff access granted.',
    'Welcome!'
  );
}


if (robloxLoginButton) {

  robloxLoginButton.addEventListener(
    'click',
    robloxLogin
  );
}


/* =========================================
   SIGN OUT
========================================= */

if (signOutBtn) {

  signOutBtn.onclick = () => {

    sessionStorage.removeItem(
      'sp_staff_username'
    );

    sessionStorage.removeItem(
      'sp_staff_userid'
    );


    if (modNav) {
      modNav.hidden =
        true;
    }

    signOutBtn.hidden =
      true;


    if (authGate) {
      authGate.style.display =
        'flex';
    }


    if (authError) {
      authError.textContent =
        '';
    }


    if (robloxUsernameInput) {
      robloxUsernameInput.value =
        '';
    }

    if (robloxUserIdInput) {
      robloxUserIdInput.value =
        '';
    }


    showPage(
      'dashboard'
    );
  };
}


/* =========================================
   RESTORE STAFF SESSION
========================================= */

window.addEventListener(
  'load',
  () => {

    const savedUsername =
      sessionStorage.getItem(
        'sp_staff_username'
      );

    const savedUserId =
      sessionStorage.getItem(
        'sp_staff_userid'
      );


    if (
      savedUsername &&
      isStaff(
        savedUsername,
        savedUserId
      )
    ) {

      setStaffUI(
        savedUsername,
        savedUserId
      );
    }

  }
);
