// 初始化資料庫
let db;
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClickerDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('clicks')) {
                db.createObjectStore('clicks', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('user')) {
                db.createObjectStore('user', { keyPath: 'id' });
            }
        };
    });
};

// 保存用戶名稱
const saveName = async () => {
    try {
        const name = document.getElementById('name-input').value.trim();
        if (!name) {
            alert('請輸入姓名');
            return;
        }

        const transaction = db.transaction(['user'], 'readwrite');
        const store = transaction.objectStore('user');
        await store.put({ id: 1, name: name });

        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        document.getElementById('user-name').textContent = name;
        
        // 初始化點擊記錄顯示
        await updateHistoryDisplay();
    } catch (error) {
        console.error('保存名字錯誤:', error);
        alert('保存名字時發生錯誤');
    }
};

// 更新點擊記錄顯示
const updateHistoryDisplay = async () => {
    try {
        const transaction = db.transaction(['clicks'], 'readonly');
        const store = transaction.objectStore('clicks');
        const allClicks = await store.getAll();
        
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        if (allClicks.length === 0) {
            const li = document.createElement('li');
            li.textContent = '還沒有點擊記錄';
            li.style.textAlign = 'center';
            li.style.color = '#666';
            historyList.appendChild(li);
            return;
        }
        
        // 反轉數組以便最新的記錄顯示在最上方
        allClicks.reverse().forEach((click, index) => {
            const li = document.createElement('li');
            const time = new Date(click.timestamp);
            const timeStr = time.toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            li.textContent = `第 ${allClicks.length - index} 次點擊：按鈕 ${click.buttonId} - ${timeStr}`;
            historyList.appendChild(li);
        });
    } catch (error) {
        console.error('更新顯示錯誤:', error);
    }
};

// 修改 recordClick 函數
const recordClick = async (buttonId) => {
    try {
        const transaction = db.transaction(['clicks'], 'readwrite');
        const store = transaction.objectStore('clicks');
        
        // 添加點擊記錄
        await store.add({
            buttonId,
            timestamp: new Date().toISOString()
        });
        
        // 立即更新顯示
        await updateHistoryDisplay();
        
        // 添加視覺反饋
        const button = document.querySelector(`button[onclick="recordClick(${buttonId})"]`);
        button.style.backgroundColor = '#0056b3';
        setTimeout(() => {
            button.style.backgroundColor = '';
        }, 200);
        
    } catch (error) {
        console.error('記錄點擊錯誤:', error);
        alert('記錄點擊時發生錯誤');
    }
};

// 修改 initApp 函數
const initApp = async () => {
    try {
        await initDB();
        
        // 檢查是否已有用戶名稱
        const transaction = db.transaction(['user'], 'readonly');
        const store = transaction.objectStore('user');
        const user = await store.get(1);
        
        if (user) {
            document.getElementById('welcome-screen').classList.add('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
            document.getElementById('user-name').textContent = user.name;
            await updateHistoryDisplay();
        } else {
            // 如果沒有用戶名稱，顯示歡迎畫面
            document.getElementById('welcome-screen').classList.remove('hidden');
            document.getElementById('main-screen').classList.add('hidden');
        }
    } catch (error) {
        console.error('初始化錯誤:', error);
    }
};

// 註冊 Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// 啟動應用
initApp(); 