const {
  send, readBody, requireAuth, withConfig, updatePosts, cleanPost, removeImage
} = require('./../_lib');

module.exports = withConfig(async (req, res) => {
  requireAuth(req);

  const id = req.query.id;

  if (req.method === 'PUT') {
    const body = await readBody(req);
    let updated;

    await updatePosts(async posts => {
      const index = posts.findIndex(p => p.id === id);
      if (index < 0) {
        const err = new Error('Post not found');
        err.status = 404;
        throw err;
      }
      const fields = await cleanPost(body, posts[index]);
      posts[index] = { ...posts[index], ...fields, updatedAt: Date.now() };
      updated = posts[index];
    }, 'Update blog post');

    return send(res, 200, updated);
  }

  if (req.method === 'DELETE') {
    let removedImage = null;

    await updatePosts(posts => {
      const index = posts.findIndex(p => p.id === id);
      if (index < 0) {
        const err = new Error('Post not found');
        err.status = 404;
        throw err;
      }
      removedImage = posts[index].image;
      posts.splice(index, 1);
    }, 'Delete blog post');

    // Only after posts.json is safely written, so a failure here cannot leave
    // a post pointing at an image that no longer exists.
    await removeImage(removedImage);
    return send(res, 200, { deleted: id });
  }

  send(res, 405, { error: 'Method not allowed' });
});
