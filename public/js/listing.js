// listing.js
document.addEventListener('DOMContentLoaded', () => {
  const storyList = document.getElementById('story-list');
  const sortBtns = document.querySelectorAll('.sort-btn');
  let currentSort = 'trending';

  async function loadStories(sort) {
    try {
      storyList.innerHTML = '<div class="loader">Loading stories...</div>';
      const res = await fetchAPI(`/stories?sort=${sort}`);
      
      if (res.stories.length === 0) {
        storyList.innerHTML = '<div class="loader">No stories found. Be the first to write one!</div>';
        return;
      }

      storyList.innerHTML = res.stories.map(story => `
        <div class="story-card glass" onclick="window.location.href='/story.html?id=${story.id}'">
          <h2>${escapeHtml(story.title)}</h2>
          <div class="story-meta">
            <span>By ${escapeHtml(story.authorName)}</span>
            <span>•</span>
            <span>${new Date(story.publishedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>${story.likes} ${story.likes === 1 ? 'like' : 'likes'}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      storyList.innerHTML = `<div class="error-msg">Failed to load stories: ${err.message}</div>`;
    }
  }

  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sortBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      loadStories(currentSort);
    });
  });

  loadStories(currentSort);
});

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
