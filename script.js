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

function showPage(id) {
  pages.forEach(page => {
    page.classList.toggle('active', page.id === id);
  });

  navs.forEach(nav => {
    nav.classList.toggle(
      'active',
      nav.dataset.page === id
    );
  });

  title.textContent = titles[id] || 'SP Support';

  const main = document.querySelector('.main');

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

document.addEventListener('click', event => {
  const element = event.target.closest('[data-page]');

  if (element) {
    showPage(element.dataset.page);
  }
});

const collapseButton = document.getElementById('collapse');

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

function toast(message, bold = 'Submitted!') {
  const toastElement = document.getElementById('toast');

  if (!toastElement) return;

  toastElement.querySelector('b').textContent = bold;
  toastElement.querySelector('span').textContent = message;

  toastElement.classList.add('show');

  setTimeout(() => {
    toastElement.classList.remove('show');
  }, 4000);
}

function submitRequest(event, type) {
  event.preventDefault();

  const data = Object.fromEntries(
    new FormData(event.target).entries()
  );

  const item = {
    id:
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7),

    type,

    username: data.username || '',

    reason: data.reason || '',

    description: data.description || '',

    evidence: data.evidence || '',

    status: 'Pending',

    note: '',

    createdAt: new Date().toLocaleString()
  };

  const all = getRequests();

  all.unshift(item);

  saveRequests(all);

  event.target.reset();

  toast(
    type + ' received and marked Pending.',
    'Submitted!'
  );
}

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

function renderModeration() {
  const filterElement =
    document.getElementById('modFilter');

  const box =
    document.getElementById('modList');

  if (!filterElement || !box) return;

  const all = getRequests();

  const filter = filterElement.value;

  const list =
    filter === 'All'
      ? all
      : all.filter(item => item.status === filter);

  const pending =
    document.getElementById('statPending');

  const reviewing =
    document.getElementById('statReviewing');

  const accepted =
    document.getElementById('statAccepted');

  const rejected =
    document.getElementById('statRejected');

  if (pending) {
    pending.textContent =
      all.filter(x => x.status === 'Pending').length;
  }

  if (reviewing) {
    reviewing.textContent =
      all.filter(x => x.status === 'Reviewing').length;
  }

  if (accepted) {
    accepted.textContent =
      all.filter(x => x.status === 'Accepted').length;
  }

  if (rejected) {
    rejected.textContent =
      all.filter(x => x.status === 'Rejected').length;
  }

  if (!list.length) {
    box.innerHTML = `
      <div class="empty-mod">
        <div>◆</div>
        <h3>No requests here</h3>
        <p>
          New public submissions will appear in this dashboard.
        </p>
      </div>
    `;

    return;
  }

  box.innerHTML = list.map(item => `
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
          class="status-dot-badge ${esc(
            item.status.toLowerCase()
          )}"
        >
          ${esc(item.status)}
        </span>

      </div>

      <div class="request-body">

        <div>

          <b>
            ${esc(item.reason || 'Request')}
          </b>

          <p>
            ${esc(item.description)}
          </p>

          ${
            item.evidence
              ? `
                <a
                  href="${esc(item.evidence)}"
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
              onchange="changeStatus(
                '${esc(item.id)}',
                this.value
              )"
            >
              ${statuses
                .map(
                  status => `
                    <option
                      ${
                        status === item.status
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
              id="note-${esc(item.id)}"
              placeholder="Internal note..."
            >${esc(item.note)}</textarea>

          </label>

          <button
            class="save-note"
            onclick="saveNote('${esc(item.id)}')"
          >
            Save note
          </button>

        </div>

      </div>

    </article>
  `).join('');
}

function changeStatus(id, status) {
  const all = getRequests();

  const item = all.find(
    request => request.id === id
  );

  if (!item) return;

  item.status = status;

  saveRequests(all);

  renderModeration();

  toast(
    'Status updated to ' + status + '.',
    'Updated!'
  );
}

function saveNote(id) {
  const textarea =
    document.getElementById('note-' + id);

  const all = getRequests();

  const item = all.find(
    request => request.id === id
  );

  if (!item || !textarea) return;

  item.note = textarea.value;

  saveRequests(all);

  toast(
    'Moderator note saved.',
    'Saved!'
  );
}

const modFilter =
  document.getElementById('modFilter');

if (modFilter) {
  modFilter.addEventListener(
    'change',
    renderModeration
  );
}

/* ================================
   LOADING SCREEN
================================ */

window.addEventListener('load', () => {
  setTimeout(() => {
    const loader =
      document.getElementById('loader');

    if (loader) {
      loader.classList.add('done');
    }

    document.body.style.overflow = 'auto';
  }, 2550);
});


/* ================================
   GOOGLE STAFF AUTHENTICATION
================================ */

const GOOGLE_CLIENT_ID =
  '148690866861-krt7sfvat6dj5aahbse3c0jcsnshbljn.apps.googleusercontent.com';

const ALLOWED_STAFF = new Set([
  'contactkyrixpixel@gmail.com'
]);

const authGate =
  document.getElementById('authGate');

const googleSignIn =
  document.getElementById('googleSignIn');

const modNav =
  document.getElementById('modNav');

const signOutBtn =
  document.getElementById('signOut');

const avatar =
  document.getElementById('avatar');

const authError =
  document.getElementById('authError');

let staffEmail = '';

let googleReady = false;


/* Decode Google's ID token */

function decodeJwt(token) {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const part = parts[1];

    const normalized = part
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded =
      normalized +
      '='.repeat(
        (4 - normalized.length % 4) % 4
      );

    return JSON.parse(
      atob(padded)
    );

  } catch {
    return null;
  }
}


/* Show staff UI */

function setStaffUI(
  email,
  name = 'Staff'
) {
  staffEmail = email;

  if (authGate) {
    authGate.style.display = 'none';
  }

  if (modNav) {
    modNav.hidden = false;
  }

  if (signOutBtn) {
    signOutBtn.hidden = false;
  }

  if (avatar) {
    avatar.textContent =
      (name || email)
        .trim()
        .slice(0, 2)
        .toUpperCase();
  }
}


/* Handle successful Google login */

function finishStaffLogin(response) {
  if (authError) {
    authError.textContent = '';
  }

  if (!response || !response.credential) {
    if (authError) {
      authError.textContent =
        'Google did not return a sign-in credential. Please try again.';
    }

    return;
  }

  const data =
    decodeJwt(response.credential);

  const email =
    (data?.email || '')
      .toLowerCase()
      .trim();

  if (!data || !data.email_verified) {
    if (authError) {
      authError.textContent =
        'Your Google email could not be verified.';
    }

    return;
  }

  if (!ALLOWED_STAFF.has(email)) {
    if (authError) {
      authError.textContent =
        'This Google account is not authorized for the SP staff dashboard.';
    }

    if (
      typeof google !== 'undefined' &&
      google.accounts?.id
    ) {
      google.accounts.id.disableAutoSelect();
    }

    return;
  }

  sessionStorage.setItem(
    'sp_staff_email',
    email
  );

  sessionStorage.setItem(
    'sp_staff_name',
    data.name || email
  );

  setStaffUI(
    email,
    data.name || email
  );

  toast(
    'Signed in as ' + email + '.',
    'Welcome!'
  );
}


/* Google error */

function showGoogleError(message) {
  if (authError) {
    authError.textContent = message;
  }

  googleReady = false;
}


/* Initialize Google */

function initGoogle() {

  if (googleReady) {
    return;
  }

  if (
    typeof google === 'undefined' ||
    !google.accounts?.id
  ) {
    setTimeout(
      initGoogle,
      200
    );

    return;
  }

  if (
    !GOOGLE_CLIENT_ID ||
    GOOGLE_CLIENT_ID.startsWith('YOUR_')
  ) {
    showGoogleError(
      'Add your Google OAuth Web Client ID to script.js first.'
    );

    return;
  }

  try {

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,

      callback: finishStaffLogin,

      auto_select: false,

      cancel_on_tap_outside: true,

      context: 'signin',

      use_fedcm_for_button: false
    });

    googleReady = true;

    if (googleSignIn) {
      googleSignIn.disabled = false;

      googleSignIn.onclick = () => {

        if (
          typeof google === 'undefined' ||
          !google.accounts?.id
        ) {
          showGoogleError(
            'Google Sign-In has not loaded yet. Please wait a moment and try again.'
          );

          return;
        }

        authError.textContent = '';

        google.accounts.id.prompt(
          notification => {

            if (
              notification.isNotDisplayed() ||
              notification.isSkippedMoment()
            ) {

              let reason =
                'Google sign-in could not open.';

              if (
                notification.getNotDisplayedReason
              ) {
                const notDisplayedReason =
                  notification.getNotDisplayedReason();

                console.log(
                  'Google not displayed:',
                  notDisplayedReason
                );
              }

              if (
                notification.getSkippedReason
              ) {
                const skippedReason =
                  notification.getSkippedReason();

                console.log(
                  'Google skipped:',
                  skippedReason
                );
              }

              authError.textContent =
                reason +
                ' Please check your Google OAuth settings and Authorized JavaScript origins.';
            }
          }
        );
      };
    }

  } catch (error) {

    console.error(
      'Google initialization error:',
      error
    );

    showGoogleError(
      'Google sign-in failed to initialize. Check your OAuth client ID and website origin.'
    );
  }
}


/* ================================
   SIGN OUT
================================ */

if (signOutBtn) {

  signOutBtn.onclick = () => {

    staffEmail = '';

    sessionStorage.removeItem(
      'sp_staff_email'
    );

    sessionStorage.removeItem(
      'sp_staff_name'
    );

    if (modNav) {
      modNav.hidden = true;
    }

    signOutBtn.hidden = true;

    if (authGate) {
      authGate.style.display = 'flex';
    }

    if (authError) {
      authError.textContent = '';
    }

    showPage('dashboard');

    if (
      typeof google !== 'undefined' &&
      google.accounts?.id
    ) {
      google.accounts.id.disableAutoSelect();
    }
  };

}


/* ================================
   START GOOGLE AUTH
================================ */

window.addEventListener(
  'load',
  () => {

    const saved =
      sessionStorage.getItem(
        'sp_staff_email'
      );

    const savedName =
      sessionStorage.getItem(
        'sp_staff_name'
      ) || 'Staff';

    if (
      saved &&
      ALLOWED_STAFF.has(saved)
    ) {
      setStaffUI(
        saved,
        savedName
      );
    }

    initGoogle();

  }
);
