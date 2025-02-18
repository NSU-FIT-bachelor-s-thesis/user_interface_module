console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!!!------------->");


function isOnWildberries(url) {
  return url.includes('wildberries.ru');
}

function isProductPage(url) {
  const productPagePattern = /^https:\/\/www\.wildberries\.ru\/catalog\/\d+\/detail\.aspx(?:\?.*)?$/;
  return productPagePattern.test(url);
}

// Обработчик запросов от popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkTab') {
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        const isWildberries = isOnWildberries(activeTab.url);
        const isProduct = isProductPage(activeTab.url);
        sendResponse({ isWildberries, isProduct });
      } else {
        sendResponse({ isWildberries: false, isProduct: false });
      }
    });
    return true; // Важно для асинхронного ответа
  }
});

//-------------------------------

function getProductId(url) {
  try {
    let urlObj = new URL(url);
    let parts = urlObj.pathname.split("/"); // Разбиваем путь по "/"
    return parts[2] || null; // 3-й элемент после `wildberries.ru/catalog/{id}/detail.aspx`
  } catch (e) {
    return null;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("my_log 1 : ---");
  if (request.action === 'getProductId') {
    console.log("my_log 2 : ---");
    // Получаем активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        let productId = getProductId(activeTab.url);
        console.log("MYYYYYYYYYYYYYYYYYYYYYYYYYYYYY: " + productId);
        sendResponse({ success: true, productId: productId });
      } else {
        sendResponse({ success: false, productId: null });
      }
    });
    return true; // Важно для асинхронного ответа
  }
});


//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBB---------->");
  if (message.action === "addProduct") {
    let id = message.id;

    // Сохранение в локальное хранилище
    chrome.storage.local.get(["numbers"], (result) => {
      let savedNumbers = Array.isArray(result.numbers) ? result.numbers : [];

      if (!savedNumbers.includes(id)) {
        savedNumbers.push(id);
        chrome.storage.local.set({ numbers: savedNumbers }, () => {
          console.log(`Product ${id} added to tracking list`);
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, message: "Already tracked" });
      }
    });

    return true; // Не забываем вернуть true для асинхронного sendResponse
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "removeProduct") {
    let id = message.id;

    chrome.storage.local.get(["numbers"], (result) => {
      let savedNumbers = Array.isArray(result.numbers) ? result.numbers : [];
      let newNumbers = savedNumbers.filter((item) => item !== id);

      chrome.storage.local.set({ numbers: newNumbers }, () => {
        console.log(`Product ${id} removed from tracking list`);
        sendResponse({ success: true });
      });
    });

    return true; // Важно для работы sendResponse с асинхронными операциями
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTrackedProducts") {
    chrome.storage.local.get(["numbers"], (result) => {
      let savedNumbers = Array.isArray(result.numbers) ? result.numbers : [];
      sendResponse({ success: true, numbers: savedNumbers });
    });

    return true; // Важно для работы sendResponse с асинхронными операциями
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "isTrackingProduct") {
    let id = message.id;

    chrome.storage.local.get(["numbers"], (result) => {
      let savedNumbers = Array.isArray(result.numbers) ? result.numbers : [];
      let isTracking = savedNumbers.includes(id);
      sendResponse({ success: true, tracking: isTracking });
    });

    return true; // Важно для sendResponse в асинхронной функции
  }
});

