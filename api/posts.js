const crypto = require('crypto');
const {
  send, readBody, requireAuth, withConfig, readPosts, updatePosts, cleanPost
} = require('./_lib');

module.exports = withConfig(async (req, res) => {
  /* Public: the blog page reads this first and falls back to the committed
     data/posts.json if it fails, so a new post shows up straight away rather
     than waiting for the redeploy the commit triggers. */
  if (req.method === 'GET') {
    const { posts } = await readPosts();
    return send(res, 200, posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
  }

  requireAuth(req);

  if (req.method === 'POST') {
    const fields = await cleanPost(await readBody(req), null);
    const now = Date.now();
    const post = {
      id: crypto.randomBytes(8).toString('hex'),
      ...fields,
      createdAt: now,
      updatedAt: now
    };
    await updatePosts(posts => { posts.push(post); }, 'New blog post: ' + post.title);
    return send(res, 201, post);
  }

  send(res, 405, { error: 'Method not allowed' });
});
