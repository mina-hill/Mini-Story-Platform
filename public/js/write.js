// write.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!getUser()) {
    window.location.href = '/login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  
  const form = document.getElementById('write-form');
  const titleInput = document.getElementById('story-title');
  const contentInput = document.getElementById('story-content');
  const errorMsg = document.getElementById('write-error');
  const saveStatus = document.getElementById('save-status');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');

  // If editing an existing story, load it
  if (editId) {
    try {
      const story = await fetchAPI(`/stories/${editId}`);
      titleInput.value = story.title;
      contentInput.value = story.content;
      if (story.status === 'published') {
        publishBtn.textContent = 'Update Published Story';
        saveDraftBtn.textContent = 'Revert to Draft';
      }
    } catch (err) {
      errorMsg.textContent = 'Error loading story for edit: ' + err.message;
      errorMsg.classList.remove('hidden');
    }
  }

  async function saveStory(status) {
    errorMsg.classList.add('hidden');
    saveStatus.textContent = 'Saving...';
    
    const body = {
      title: titleInput.value,
      content: contentInput.value,
      status
    };

    try {
      let res;
      if (editId) {
        res = await fetchAPI(`/stories/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      } else {
        res = await fetchAPI('/stories', {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }
      
      if (status === 'published') {
        window.location.href = `/story.html?id=${res.id}`;
      } else {
        saveStatus.textContent = 'Draft saved at ' + new Date().toLocaleTimeString();
        if (!editId) {
          // Update URL to edit mode without reloading
          window.history.replaceState(null, '', `?id=${res.id}`);
        }
      }
    } catch (err) {
      saveStatus.textContent = '';
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    }
  }

  saveDraftBtn.addEventListener('click', () => saveStory('draft'));
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveStory('published');
  });

});
