chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.local.set({
      is_login: false,
    })

    chrome.storage.sync.set({
      password: '',
    })
  }
})
