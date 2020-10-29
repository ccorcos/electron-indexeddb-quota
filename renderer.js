// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// 1. sometimes the quota usage goes down when I'm only adding data.

async function updateQuotaLabel() {
  const { quota, usage } = await navigator.storage.estimate()
  const elm = document.getElementById('indexeddb-label')
  elm.innerText = `${usage}/${quota} : ${((usage / quota) * 100)
    .toString()
    .slice(0, 6)}%`
}

async function main() {
  await updateQuotaLabel()
  const db = await createDatabase()

  const button = document.getElementById('indexeddb-button')
  button.onclick = async function (event) {
    button.disabled = true
    await saveRecords(db, randomRecords())
    await updateQuotaLabel()
    button.disabled = false
  }

  button.disabled = true
  for (let i = 0; i < 1000; i++) {
    await saveRecords(db, randomRecords())
    await updateQuotaLabel()
  }
}

// Documentation:
// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
function createDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('TestDatabase', 1)
    request.onerror = function (event) {
      console.error('OpenDbError', event)
      reject(event)
    }

    request.onupgradeneeded = function (event) {
      const db = event.target.result
      const recordStore = db.createObjectStore('record', { keyPath: 'id' })
    }

    request.onsuccess = function (event) {
      const db = event.target.result
      db.onerror = function (event) {
        console.error('DbError', event)
      }
      resolve(db)
    }
  })
}

function saveRecords(db, records) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['record'], 'readwrite')

    transaction.oncomplete = function (event) {
      resolve()
    }

    transaction.onerror = function (event) {
      console.error('SaveRecordsError', event)
      reject(error)
    }

    const recordStore = transaction.objectStore('record')
    for (const record of records) {
      recordStore.add(record)
    }
  })
}

function randomId() {
  return Math.random().toString().slice(3)
}

function randomText() {
  return Array(50).fill(0).map(randomId).join('')
}

function randomRecord() {
  return { id: randomId(), text: randomText() }
}

function randomRecords() {
  return Array(10000).fill(0).map(randomRecord)
}

main()
