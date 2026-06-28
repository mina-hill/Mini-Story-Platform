// reader.js
document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const storyId = urlParams.get('id');
  if (!storyId) {
    document.getElementById('reader-content').innerHTML = '<div class="error-msg">Story ID missing</div>';
    return;
  }

  const contentDiv = document.getElementById('reader-content');
  const likeBtn = document.getElementById('like-btn');
  const likeCountSpan = document.getElementById('like-count');
  const commentsList = document.getElementById('comments-list');
  const commentFormContainer = document.getElementById('comment-form-container');
  const loginToComment = document.getElementById('login-to-comment');
  const commentForm = document.getElementById('comment-form');

  // Load Story
  try {
    const story = await fetchAPI(`/stories/${storyId}`);
    
    document.title = `${story.title} - Mini Story Platform`;
    
    contentDiv.innerHTML = `
      <h1 class="reader-title">${escapeHtml(story.title)}</h1>
      <div class="reader-meta">
        <span>By <strong>${escapeHtml(story.authorName)}</strong></span>
        <span>•</span>
        <span>${new Date(story.publishedAt || story.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="reader-body">${escapeHtml(story.content)}</div>
    `;

    likeCountSpan.textContent = story.likes;
    if (story.likedByMe) {
      likeBtn.classList.add('liked');
    }

    if (getUser()) {
      commentFormContainer.classList.remove('hidden');
    } else {
      loginToComment.classList.remove('hidden');
    }

    // Load comments
    loadComments();

  } catch (err) {
    contentDiv.innerHTML = `<div class="error-msg">Failed to load story: ${err.message}</div>`;
  }

  // Like Toggle
  likeBtn.addEventListener('click', async () => {
    if (!getUser()) {
      window.location.href = '/login.html';
      return;
    }
    
    try {
      const res = await fetchAPI(`/stories/${storyId}/like`, { method: 'POST' });
      likeCountSpan.textContent = res.likes;
      if (res.liked) {
        likeBtn.classList.add('liked');
      } else {
        likeBtn.classList.remove('liked');
      }
    } catch (err) {
      alert(err.message);
    }
  });

  // Comments
  async function loadComments() {
    try {
      const res = await fetchAPI(`/stories/${storyId}/comments`);
      if (res.length === 0) {
        commentsList.innerHTML = '<p style="color: var(--text-light)">No comments yet.</p>';
      } else {
        commentsList.innerHTML = res.map(c => `
          <div class="comment">
            <span class="comment-author">${escapeHtml(c.userName)}</span>
            <span class="comment-date">${new Date(c.timestamp).toLocaleString()}</span>
            <div class="comment-text">${escapeHtml(c.text)}</div>
          </div>
        `).join('');
      }
    } catch (err) {
      commentsList.innerHTML = `<div class="error-msg">Error loading comments.</div>`;
    }
  }

  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = document.getElementById('comment-text').value;
    try {
      await fetchAPI(`/stories/${storyId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      document.getElementById('comment-text').value = '';
      loadComments();
    } catch (err) {
      alert(err.message);
    }
  });

});

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
