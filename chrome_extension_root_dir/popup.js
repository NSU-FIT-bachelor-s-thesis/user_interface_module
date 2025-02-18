
// определение основного popup окна:
function buildContentForCurrentTab() {
    chrome.runtime.sendMessage({ action: 'checkTab' }, (response) => {
        const contentElement = document.getElementById("content");

        if (response.isWildberries) {
            if (response.isProduct) {
                buildWildberriesProductContent(contentElement);
            } else {
                 contentElement.innerHTML = buildDefaultWildberriesContent();
            }
        } else {
            contentElement.innerHTML = buildDefaultContent();
        }
    });
}

// Запускаем функцию при загрузке попапа
document.addEventListener("DOMContentLoaded", buildContentForCurrentTab);


//---------------------------------------------------------------------------------------------------
// билдеры контента для каждого типа вкладок:

function buildWildberriesProductContent(contentElement) {
    const content = `
        <p>Вы на странице товара Wildberries!</p>
        <p>Это страница товара.</p>
        <button id="buttonAddProductToTrack">Добавить в отслеживаемые!</button>
        <button id="buttonListAllTrackingProducts">Просмотреть все отслеживаемые!</button>
    `;
    contentElement.innerHTML = content;

    const button = contentElement.querySelector("#buttonAddProductToTrack");
    button.addEventListener('click', function () {

        fetchProductId(
            (productId) => {
                addProduct(productId, contentElement);
            }
        );
    });

    const button1 = contentElement.querySelector("#buttonListAllTrackingProducts");
    button1.addEventListener('click', function () {

        getAllTrackingProducts(
            (numbers) => {
                let liist = "<h1>WEL: " + numbers.join(" ") + "</h1>";
                // let htmlList = "<ul><li>" + numbers.join("</li><li>") + "</li></ul>";
                // contentElement.innerHTML = htmlList;
                contentElement.innerHTML = liist;
            },
            contentElement
        );
    });
}

function buildDefaultWildberriesContent() {
    const content = `
        <p>Вы на сайте Wildberries, но это не страница товара.</p>
    `;
    return content;
}

function buildDefaultContent() {
    const content = `
        <p>Расширение для сбора статистики и прогнозирования цен товаров на сайте <a id="wb_link" href="https://www.wildberries.ru/">Wildberries</a>.</p>
    `;
  return content;
}


//-------------------------------------------------------------------------------------------------
function fetchProductId(callback) {
    chrome.runtime.sendMessage({ action: "getProductId"}, (response) => {
        if (response && response.success) {
            callback(response.productId);
        } else {
            callback(null);
        }
    });
}
//-------------------------------------------------------------------------------------------------

function addProduct(id, contentElement) {
    //saving request to backend:
    //todo: отправить запрос к бэку на добавление юзера-отслеживателя товара id
    //saving into local storage:
    console.log("OOOOO: " + id);
    chrome.runtime.sendMessage({ action: "addProduct", id: id }, (response) => {
        if (response && response.success) {
            contentElement.innerHTML = `<p>Добавлено!</p>`;
        } else {
            contentElement.innerHTML = `<p>Уже отслеживается</p>`;
        }
    });
}

function removeProduct(id, contentElement) {
    //removing request to backend:
    //todo: отправить запрос к бэку на удаление юзера-отслеживателя товара id
    //remove from local storage:
    chrome.runtime.sendMessage({ action: "removeProduct", id: id }, (response) => {
        if (response && response.success) {
            contentElement.innerHTML = `<p>Удалено из отслеживания!</p>`;
        }
    });
}

function getAllTrackingProducts(callback, contentElement) {
    chrome.runtime.sendMessage({ action: "getTrackedProducts" }, (response) => {
        if (response && response.success) {
            callback(response.numbers);
        } else {
            callback([]); // Если что-то пошло не так, возвращаем пустой массив
        }
    });
}

function isTrackingProduct(callback, id) {
    chrome.runtime.sendMessage({ action: "isTrackingProduct", id: id }, (response) => {
        if (response && response.success) {
            callback(response.tracking);
        } else {
            callback(false); // Если ошибка, считаем, что товар не отслеживается
        }
    });
}

function getStatistics(id) {
    //statistics request to backend:
    //todo: request
    //building statistics content:
    //todo: build content using response from backend
    const content = `
        <p>Хей, тут будет статистика, честно...</p>
    `;
}

function buildProduct() {
    return [];
}

//----------------------------------------------------------------------------------------------------------------------

































