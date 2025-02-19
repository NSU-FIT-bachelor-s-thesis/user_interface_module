document.addEventListener("DOMContentLoaded", buildContentOnStart);

function buildContentOnStart() {
    const contentElement = document.getElementById("content");
    buildMainContentPage(contentElement);
}

//todo: построение всех кнопок тоже вынести в отдельные ф-ии
//todo: хорошая идея: пусть каждая build-page (окон а не мелких элементов) ф-я начинает с uildBaseContent(contentElement)

function buildMainContentPage(contentElement) {
    chrome.runtime.sendMessage({ action: 'checkTab' }, (response) => {

        buildBaseContent(contentElement);

        if (response.isWildberries) {
            if (response.isProduct) {
                buildWbProductContent(contentElement);
            } else {
                buildDefaultWbContent(contentElement);
            }
        } else {
            buildDefaultContent(contentElement);
        }
    });
}

function buildBaseContent(contentElement) {
    contentElement.innerHTML = "";

    const message = document.createElement("p");
    message.textContent = "Расширение для отслеживания статистики и прогнозов цен товаров на сайте Wildberries.";

    contentElement.append(message);
}

function buildDefaultContent(contentElement) {//home page v1
    const link = document.createElement("a");
    link.href = "https://www.wildberries.ru";
    link.textContent = "Перейти на Wildberries";
    link.target = "_blank";
    contentElement.append(link);
}

function buildDefaultWbContent(contentElement) {//homa page v2
    buildListAllTrackingProductsButton(contentElement);
}

function buildWbProductContent(contentElement) {//home page v3
    fetchProductId((productId) => {
            isTrackingProduct((isTracking) => {
                if (isTracking) {
                    buildTrackingProductContent(contentElement);
                } else {
                    buildNotTrackingProductContent(contentElement);
                }
            }, productId)
        }
    )
}

function buildTrackingProductContent(contentElement) {
    buildViewStatisticsButton(contentElement);
    buildRemoveProductButton(contentElement);
    buildListAllTrackingProductsButton(contentElement);
}

function buildNotTrackingProductContent(contentElement) {
    buildAddProductButton(contentElement);
    buildListAllTrackingProductsButton(contentElement);
}



//-------------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ построение основных кнопок
//-------------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ построение основных кнопок
//-------------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ построение основных кнопок
function buildAddProductButton(contentElement) {
    const addCurrentProductButton = document.createElement("button");
    addCurrentProductButton.id = "addCurrentProductButton";
    addCurrentProductButton.textContent = "Добавить этот товар в отслеживаемые";

    addCurrentProductButton.addEventListener("click", () => {
        //todo: лучше все это вынести в buildAddTrackingProductContentBuild(), который тоже с base начнет
        fetchProductId((productId) => addProduct(productId, contentElement));
    });

    contentElement.append(addCurrentProductButton);
}

function buildRemoveProductButton(contentElement) {
    const removeCurrentProductButton = document.createElement("button");
    removeCurrentProductButton.id = "removeCurrentProductButton";
    removeCurrentProductButton.textContent = "Удалить этот товар из отслеживаемых";

    removeCurrentProductButton.addEventListener("click", () => {
        //
    });

    contentElement.append(removeCurrentProductButton);
}

function buildViewStatisticsButton(contentElement) {
    const viewCurrentProductStatisticsButton = document.createElement("button");
    viewCurrentProductStatisticsButton.id = "viewCurrentProductStatisticsButton";
    viewCurrentProductStatisticsButton.textContent = "Смотреть статистику по этому товару";

    viewCurrentProductStatisticsButton.addEventListener("click", () => {
        //
    });

    contentElement.append(viewCurrentProductStatisticsButton);
}

function buildListAllTrackingProductsButton(contentElement) {
    const listButton = document.createElement("button");
    listButton.id = "buttonListAllTrackingProducts";
    listButton.textContent = "Просмотреть все отслеживаемые!";

    listButton.addEventListener("click", () => {
        //todo: лучше все это вынести в buildAllTrackingListContentBuild(), который тоже с base начнет
        getAllTrackingProducts((numbers) => {
            listButton.remove();
            contentElement.append(generateLinksList(numbers));
        });
    });

    contentElement.append(listButton);
}


//-------------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ построение основных кнопок
//-------------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ построение основных кнопок
//-------------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ построение основных кнопок











//------------------------------------------------------------------------вспомогательные ф-ии:

function getAllTrackingProducts(callback, contentElement) {
    chrome.runtime.sendMessage({ action: "getTrackedProducts" }, (response) => {
        if (response && response.success) {
            callback(response.numbers);
        } else {
            callback([]); // Если что-то пошло не так, возвращаем пустой массив
        }
    });
}

function generateLinksList(productsIdsArray) {
    let linksArray = productsIdsArray.map(num => `https://www.wildberries.ru/catalog/${num}/detail.aspx`);

    let ul = document.createElement("ul");

    linksArray.forEach(link => {
        let li = document.createElement("li");
        let a = document.createElement("a");

        a.href = link;
        a.textContent = link;
        a.target = "_blank"; // Открывать ссылки в новой вкладке

        li.appendChild(a);
        ul.appendChild(li);
    });

    return ul;
}

function addProduct(id, contentElement) {
    //saving request to backend:
    //todo: отправить запрос к бэку на добавление юзера-отслеживателя товара id
    //saving into local storage:
    chrome.runtime.sendMessage({ action: "addProduct", id: id }, (response) => {
        if (response && response.success) {
            contentElement.innerHTML = `<p>Добавлено!</p>`;
        } else {
            contentElement.innerHTML = `<p>Уже отслеживается</p>`;
        }
    });
}

function fetchProductId(callback) {
    chrome.runtime.sendMessage({ action: "getProductId"}, (response) => {
        if (response && response.success) {
            callback(response.productId);
        } else {
            callback(null);
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