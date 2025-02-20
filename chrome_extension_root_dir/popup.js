document.addEventListener("DOMContentLoaded", buildContentOnStart);

function buildContentOnStart() {
    const contentElement = document.getElementById("content");
    buildMainContentPage(contentElement);
}

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

//--------------------- построение промежуточных страниц
function buildOperationStatusPage(contentElement, messageString) {
    buildBaseContent(contentElement);

    const message = document.createElement("p");
    message.textContent = messageString;
    contentElement.append(message);

    buildHomeButton(contentElement);
}

function buildStatisticsPage(contentElement, messageString) {
    //todo: добавить картинку с графиком (передается в аргументах)
    buildBaseContent(contentElement);

    const message = document.createElement("p");
    message.textContent = messageString;
    contentElement.append(message);

    buildHomeButton(contentElement);
}

function buildAllTrackingListPage(contentElement, numbers) {
    buildBaseContent(contentElement);
    contentElement.append(generateLinksList(numbers));
    buildHomeButton(contentElement);
}

//------------------- построение контента для страниц

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


//---------- построение кнопок

function buildAddProductButton(contentElement) {
    const addCurrentProductButton = document.createElement("button");
    addCurrentProductButton.id = "addCurrentProductButton";
    addCurrentProductButton.textContent = "Добавить этот товар в отслеживаемые";

    addCurrentProductButton.addEventListener("click", () => {
        fetchProductId((productId) => addProduct(productId, contentElement));
    });

    contentElement.append(addCurrentProductButton);
}

function buildRemoveProductButton(contentElement) {
    const removeCurrentProductButton = document.createElement("button");
    removeCurrentProductButton.id = "removeCurrentProductButton";
    removeCurrentProductButton.textContent = "Удалить этот товар из отслеживаемых";

    removeCurrentProductButton.addEventListener("click", () => {
        fetchProductId((productId) => removeProduct(productId, contentElement));
    });

    contentElement.append(removeCurrentProductButton);
}

function buildViewStatisticsButton(contentElement) {
    const viewCurrentProductStatisticsButton = document.createElement("button");
    viewCurrentProductStatisticsButton.id = "viewCurrentProductStatisticsButton";
    viewCurrentProductStatisticsButton.textContent = "Смотреть статистику по этому товару";

    viewCurrentProductStatisticsButton.addEventListener("click", () => {
        fetchProductId((productId) => showStatistics(productId, contentElement));
    });

    contentElement.append(viewCurrentProductStatisticsButton);
}

function buildListAllTrackingProductsButton(contentElement) {
    const listButton = document.createElement("button");
    listButton.id = "buttonListAllTrackingProducts";
    listButton.textContent = "Просмотреть все отслеживаемые!";

    listButton.addEventListener("click", () => {
        getAllTrackingProducts((numbers) => {
            buildAllTrackingListPage(contentElement, numbers);
        });
    });

    contentElement.append(listButton);
}

function buildHomeButton(contentElement) {
    const homeButton = document.createElement("button");
    homeButton.id = "homeButton";
    homeButton.textContent = "<- Back <-";

    homeButton.addEventListener("click", () => {
        buildMainContentPage(contentElement);
    });

    contentElement.append(homeButton);
}

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
        a.textContent = link;//todo: сделать читабельную ссылку с названием товара (доставать название со страницы)
        a.target = "_blank";

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
            buildOperationStatusPage(contentElement, "Успешно добавлено.");
        } else {
            buildOperationStatusPage(contentElement, "Не удалось добавить!");
        }
    });
}

function removeProduct(id, contentElement) {
    //removing request to backend:
    //todo: отправить запрос к бэку на удаление юзера-отслеживателя товара id
    //remove from local storage:
    chrome.runtime.sendMessage({ action: "removeProduct", id: id }, (response) => {
        if (response && response.success) {
            buildOperationStatusPage(contentElement, "Удалено из отслеживания!");
        } else {
            buildOperationStatusPage(contentElement, "Не удалось удалить из отслеживания!");
        }
    });
}

function showStatistics(id, contentElement) {
    // get statistics request to backend:
    // todo: отправлять запрос к бэку
    // show statistics:
    const success = true;//todo: получили или нет ответ от бэка
    if (success) {
        const messageFromBack = "Некоторо есообщение про статистику с бэка.";
        buildStatisticsPage(contentElement, messageFromBack);
    } else {
        buildOperationStatusPage(contentElement, "Не удалось построить график статистики и прогноза, попробуйте позже.");
    }
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
            callback(false);
        }
    });
}