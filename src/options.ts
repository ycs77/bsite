const loginFormEl = document.getElementById('login')!
const logoutEl = document.getElementById('logout')!

const dashboardEl = document.getElementById('dashboard')!
const blockUrlsListEl = document.getElementById('block-urls')!
const addBlockUrlFormEl = document.getElementById('add-block-url')!

interface UpdateBlockRulesOptions {
  addUrls?: string[]
  removeUrls?: string[]
}

function e(content: any) {
  return String(content).replace(/[\u00A0-\u9999<>\&]/g, i => '&#'+i.charCodeAt(0)+';')
}

async function updateBlockUrls() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules()

  async function deleteBlockUrl(e: Event) {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') {
      const buttonEl = e.target as HTMLElement
      const url = buttonEl.dataset.url!
      await updateBlockRules({ removeUrls: [url] })
      await updateBlockUrls()
    }
  }

  blockUrlsListEl.textContent = ''
  blockUrlsListEl.innerHTML = rules.map(rule =>
    `<li class="list-group-item d-flex justify-content-between align-items-center">
      ${e(rule.condition.urlFilter || '')}
      <button type="button" class="btn btn-sm btn-danger" data-id="${e(rule.id)}" data-url="${e(rule.condition.urlFilter || '')}">刪除</button>
    </li>`
  , '').join('')
  blockUrlsListEl.removeEventListener('click', deleteBlockUrl)
  blockUrlsListEl.addEventListener('click', deleteBlockUrl)
}

chrome.storage.local.get('is_login', ({ is_login }) => {
  if (is_login) {
    dashboardEl.classList.remove('d-none')
    updateBlockUrls()
  } else {
    loginFormEl.classList.remove('d-none')
  }
})

async function setPasswordPlaceholder() {
  chrome.storage.sync.get('password', async data => {
    const password: string = data.password
    const passwordEl = document.getElementById('password') as HTMLInputElement
    passwordEl.placeholder = password ? '' : '設定密碼'
  })
}

setPasswordPlaceholder()

loginFormEl.addEventListener('submit', e => {
  e.preventDefault()

  chrome.storage.sync.get('password', async data => {
    const password: string = data.password
    const passwordEl = document.getElementById('password') as HTMLInputElement
    if (password && passwordEl.value === atob(password) || !password) {
      if (!password) {
        await chrome.storage.sync.set({ password: btoa(passwordEl.value) })
      }
      loginFormEl.classList.add('d-none')
      dashboardEl.classList.remove('d-none')
      updateBlockUrls()
      await chrome.storage.local.set({ is_login: true })
      await setPasswordPlaceholder()
    }
    passwordEl.value = ''
  })
})

logoutEl.addEventListener('click', async () => {
  loginFormEl.classList.remove('d-none')
  dashboardEl.classList.add('d-none')
  chrome.storage.local.set({ is_login: false })
  await setPasswordPlaceholder()
})

addBlockUrlFormEl.addEventListener('submit', async e => {
  e.preventDefault()

  const rules = await chrome.declarativeNetRequest.getDynamicRules()
  const urlEl = document.getElementById('block-url') as HTMLInputElement
  const url = urlEl.value
  if (!rules.find(rule => rule.condition.urlFilter === url)) {
    await updateBlockRules({ addUrls: [url] })
    await updateBlockUrls()
  }
  urlEl.value = ''
})

async function updateBlockRules(options: UpdateBlockRulesOptions) {
  const { addUrls, removeUrls } = options

  let rules = await chrome.declarativeNetRequest.getDynamicRules()

  let addRules: chrome.declarativeNetRequest.Rule[] = []
  if (addUrls) {
    rules.sort((a, b) => a.id - b.id)
    const id = rules.length > 0 ? rules[rules.length - 1].id + 1 : 1
    addRules = addUrls.map(url => ({
      id,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { extensionPath: '/block.html' },
      },
      condition: {
        urlFilter : url,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    }))
  }

  let removeRuleIds: number[] = []
  if (removeUrls) {
    removeRuleIds = removeUrls
      .map(url => rules.find(rule => rule.condition.urlFilter === url)?.id)
      .filter(id => !isNaN(Number(id))) as number[]
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules,
    removeRuleIds,
  })

  rules = await chrome.declarativeNetRequest.getDynamicRules()
}
