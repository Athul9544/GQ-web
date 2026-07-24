/* Golden Qube — blog admin portal */

(function () {
  'use strict';

  var TOKEN_KEY = 'gq_admin_token';
  var token = localStorage.getItem(TOKEN_KEY) || '';
  var pendingImage;                 // data URL awaiting save, or null to clear

  var $ = function (id) { return document.getElementById(id); };

  var loginView = $('login');
  var adminView = $('admin');
  var editor = $('editor');
  var form = $('post-form');
  var fileInput = $('image');
  var dropzone = $('dropzone');

  /* ------------------------------------------------------------------ api */

  function api(method, url, body) {
    var options = { method: method, headers: {} };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    return fetch(url, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Request failed (' + res.status + ')');
        return data;
      });
    });
  }

  function toast(message, isError) {
    var el = $('toast');
    el.textContent = message;
    el.className = 'toast' + (isError ? ' toast--error' : '');
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.hidden = true; }, 3200);
  }

  /* ---------------------------------------------------------------- login */

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var error = $('login-error');
    error.hidden = true;

    api('POST', '/api/login', { password: $('password').value })
      .then(function (data) {
        token = data.token;
        localStorage.setItem(TOKEN_KEY, token);
        $('password').value = '';
        showAdmin();
      })
      .catch(function (err) {
        error.textContent = err.message;
        error.hidden = false;
      });
  });

  $('signout').addEventListener('click', signOut);

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    token = '';
    showLogin();
  }

  function showLogin() {
    adminView.hidden = true;
    loginView.hidden = false;
    $('login-error').hidden = true;
  }

  function showAdmin() {
    loginView.hidden = true;
    adminView.hidden = false;
    loadPosts();
  }

  /* ------------------------------------------------------------ post list */

  function loadPosts() {
    api('GET', '/api/posts')
      .then(renderPosts)
      .catch(function (err) { toast(err.message, true); });
  }

  function renderPosts(posts) {
    $('post-count').textContent = posts.length;
    var list = $('post-list');

    if (!posts.length) {
      list.innerHTML =
        '<div class="post-list__empty">' +
          '<p>No posts yet. Use <strong>New Post</strong> to publish the first one — ' +
          'it appears on the blog page immediately.</p>' +
        '</div>';
      return;
    }

    list.innerHTML = posts.map(function (p) {
      var date = new Date(p.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
      var thumb = p.image
        ? '<img src="' + p.image + '" alt="">'
        : '<span class="post-row__noimg">No image</span>';

      return '<article class="post-row" data-id="' + p.id + '">' +
        '<div class="post-row__thumb">' + thumb + '</div>' +
        '<div class="post-row__body">' +
          '<span class="post-row__meta">' + esc(p.category || 'Uncategorised') + ' &nbsp;•&nbsp; ' + date + '</span>' +
          '<h3>' + esc(p.title) + '</h3>' +
          '<p>' + esc(p.description).slice(0, 160) + (p.description.length > 160 ? '…' : '') + '</p>' +
        '</div>' +
        '<div class="post-row__actions">' +
          '<button class="btn btn--outline btn--sm" data-act="edit">Edit</button>' +
          '<button class="btn btn--sm btn--danger" data-act="delete">Delete</button>' +
        '</div>' +
      '</article>';
    }).join('');

    list.querySelectorAll('.post-row').forEach(function (row) {
      var post = posts.find(function (p) { return p.id === row.dataset.id; });
      row.querySelector('[data-act="edit"]').addEventListener('click', function () { openEditor(post); });
      row.querySelector('[data-act="delete"]').addEventListener('click', function () { remove(post); });
    });
  }

  function remove(post) {
    if (!confirm('Delete "' + post.title + '"? This cannot be undone.')) return;
    api('DELETE', '/api/posts/' + post.id)
      .then(function () { toast('Post deleted'); loadPosts(); closeEditor(); })
      .catch(function (err) { toast(err.message, true); });
  }

  /* --------------------------------------------------------------- editor */

  function openEditor(post) {
    editor.hidden = false;
    pendingImage = undefined;
    $('form-error').hidden = true;

    $('editor-title').textContent = post ? 'Edit Post' : 'New Post';
    $('save-post').textContent = post ? 'Save Changes' : 'Publish Post';
    $('post-id').value = post ? post.id : '';
    $('title').value = post ? post.title : '';
    $('category').value = post ? (post.category || '') : '';
    $('description').value = post ? post.description : '';

    showPreview(post && post.image ? post.image : null);
    if (editor.scrollIntoView) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('title').focus();
  }

  function closeEditor() {
    editor.hidden = true;
    form.reset();
    pendingImage = undefined;
    showPreview(null);
  }

  $('new-post').addEventListener('click', function () { openEditor(null); });
  $('cancel-edit').addEventListener('click', closeEditor);
  $('cancel-edit-2').addEventListener('click', closeEditor);

  /* ---------------------------------------------------------------- image */

  function showPreview(src) {
    var empty = $('dropzone-empty');
    var preview = $('dropzone-preview');
    if (src) {
      $('preview-img').src = src;
      preview.hidden = false;
      empty.hidden = true;
    } else {
      preview.hidden = true;
      empty.hidden = false;
    }
  }

  function readFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type)) {
      return toast('Use a PNG, JPG, WebP or GIF image', true);
    }
    if (file.size > 6 * 1024 * 1024) {
      return toast('That image is over 6 MB — please use a smaller one', true);
    }
    var reader = new FileReader();
    reader.onload = function () {
      pendingImage = reader.result;
      showPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  dropzone.addEventListener('click', function (e) {
    if (e.target.id !== 'remove-image') fileInput.click();
  });
  fileInput.addEventListener('change', function () { readFile(fileInput.files[0]); });

  ['dragenter', 'dragover'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.add('is-over');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) {
      e.preventDefault();
      dropzone.classList.remove('is-over');
    });
  });
  dropzone.addEventListener('drop', function (e) {
    readFile(e.dataTransfer.files[0]);
  });

  $('remove-image').addEventListener('click', function (e) {
    e.stopPropagation();
    pendingImage = null;                 // null tells the server to clear it
    fileInput.value = '';
    showPreview(null);
  });

  /* ----------------------------------------------------------------- save */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var error = $('form-error');
    error.hidden = true;

    var id = $('post-id').value;
    var payload = {
      title: $('title').value.trim(),
      category: $('category').value.trim(),
      description: $('description').value.trim()
    };
    if (pendingImage !== undefined) payload.image = pendingImage;

    var button = $('save-post');
    var label = button.textContent;
    button.disabled = true;
    button.textContent = 'Saving…';

    api(id ? 'PUT' : 'POST', id ? '/api/posts/' + id : '/api/posts', payload)
      .then(function () {
        toast(id ? 'Post updated' : 'Post published');
        closeEditor();
        loadPosts();
      })
      .catch(function (err) {
        error.textContent = err.message;
        error.hidden = false;
      })
      .then(function () {
        button.disabled = false;
        button.textContent = label;
      });
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* --------------------------------------------------------------- start */

  if (token) {
    // Both views start hidden, so a stale token cannot flash the login screen.
    api('GET', '/api/session')
      .then(function (data) { data.valid ? showAdmin() : signOut(); })
      .catch(showLogin);
  } else {
    showLogin();
  }
})();
