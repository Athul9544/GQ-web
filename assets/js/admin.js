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
    showHub();
    loadPosts();
    loadStatus();
  }

  /* ------------------------------------------------------------------- hub */
  /* The landing view. Every card counts something real, so the numbers come
     from the posts themselves rather than being stored anywhere. */

  var hub = $('hub');
  var postsView = $('posts-view');

  function showHub() {
    postsView.hidden = true;
    hub.hidden = false;
    window.scrollTo(0, 0);
  }

  function showPosts() {
    hub.hidden = true;
    postsView.hidden = false;
    window.scrollTo(0, 0);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  document.querySelectorAll('[data-open="posts"]').forEach(function (btn) {
    btn.addEventListener('click', showPosts);
  });
  $('back-to-hub').addEventListener('click', function () { closeEditor(); showHub(); });

  /* Where the live site actually is. Worth stating: a post is committed the
     moment it is saved, but its image is only served once that commit has
     redeployed. */
  function loadStatus() {
    fetch('/api/status', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) {
        if (!s || !s.deployment) return;
        var note = $('hub-status');
        note.textContent = 'Serving commit ' + s.deployment.commit + ' on ' +
                           s.deployment.branch + '. A new post shows up straight away; ' +
                           'its image follows once the deploy finishes, about a minute.';
        note.hidden = false;
      })
      .catch(function () { /* local server has no status endpoint */ });
  }

  /* Everything the site knows about the posts, as a file. */
  $('export').addEventListener('click', function () {
    api('GET', '/api/posts')
      .then(function (posts) {
        var blob = new Blob([JSON.stringify(posts, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'golden-qube-posts.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        toast('Exported ' + posts.length + ' post' + (posts.length === 1 ? '' : 's'));
      })
      .catch(function (err) { toast(err.message, true); });
  });

  /* ------------------------------------------------------------ post list */

  function loadPosts() {
    api('GET', '/api/posts')
      .then(renderPosts)
      .catch(function (err) { toast(err.message, true); });
  }

  function renderPosts(posts) {
    $('post-count').textContent = posts.length;
    $('count-posts').textContent = pad(posts.length);
    $('count-images').textContent = pad(posts.filter(function (p) { return !!p.image; }).length);
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

    /* The thumbnail is the file just committed, which is not served until the
       redeploy that commit triggered has finished. Retry rather than leaving
       the operator looking at a broken image and assuming the upload failed. */
    list.querySelectorAll('.post-row__thumb img').forEach(function (img) {
      var tries = 0;
      img.addEventListener('error', function () {
        if (tries >= 4) return;
        var wait = 8000 * Math.pow(2, tries);        // 8s, 16s, 32s, 64s
        tries++;
        setTimeout(function () {
          img.src = img.src.split('?')[0] + '?r=' + Date.now();
        }, wait);
      });
    });

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

  // New Post is reachable from the hub as well as the list, so it moves there.
  $('new-post').addEventListener('click', function () { showPosts(); openEditor(null); });
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

  /* Whatever is uploaded here is the exact file every visitor downloads, and a
     photo straight off a phone is a few megabytes. Nothing on the site shows a
     post image wider than about 700 CSS pixels, so it is resized and re-encoded
     before it is ever sent: a 2 MB PNG lands at a couple of hundred KB, which
     is the difference between the blog loading and the blog crawling. */
  var MAX_EDGE = 1400;                       // 2x the widest place it is shown
  var MAX_BYTES = 3 * 1024 * 1024;           // Vercel's body limit, less base64

  function bytesOf(dataUrl) {
    // base64 carries 3 bytes in every 4 characters.
    return Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
  }

  function readAsDataUrl(file, done) {
    var reader = new FileReader();
    reader.onload = function () { done(reader.result); };
    reader.onerror = function () { toast('That file could not be read', true); };
    reader.readAsDataURL(file);
  }

  function shrink(file, done) {
    // A GIF may be animated, and redrawing it would flatten it to one frame.
    if (file.type === 'image/gif') return readAsDataUrl(file, done);

    var url = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
      URL.revokeObjectURL(url);
      var scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      var ctx = canvas.getContext('2d');
      // JPEG has no alpha, so a transparent PNG would come out black without it.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // WebP is roughly a third smaller than JPEG at the same quality; older
      // browsers quietly hand back a PNG instead, so check what came out.
      var out = canvas.toDataURL('image/webp', 0.82);
      if (out.indexOf('data:image/webp') !== 0) out = canvas.toDataURL('image/jpeg', 0.82);
      done(out);
    };

    // Anything the canvas cannot decode goes up untouched rather than not at all.
    img.onerror = function () { URL.revokeObjectURL(url); readAsDataUrl(file, done); };
    img.src = url;
  }

  function readFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type)) {
      return toast('Use a PNG, JPG, WebP or GIF image', true);
    }
    if (file.size > 25 * 1024 * 1024) {
      return toast('That image is over 25 MB — please use a smaller one', true);
    }

    shrink(file, function (dataUrl) {
      var size = bytesOf(dataUrl);
      if (size > MAX_BYTES) {
        return toast('That image is still over 3 MB once compressed — please use a smaller one', true);
      }
      pendingImage = dataUrl;
      showPreview(dataUrl);

      var saved = file.size - size;
      toast(saved > 20 * 1024
        ? 'Image ready — ' + Math.round(size / 1024) + ' KB, down from ' +
          Math.round(file.size / 1024) + ' KB'
        : 'Image ready — ' + Math.round(size / 1024) + ' KB');
    });
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
