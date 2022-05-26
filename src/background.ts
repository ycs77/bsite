chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      is_login: true,
    })

    chrome.storage.sync.set({
      password: '',
    })
  }
})
