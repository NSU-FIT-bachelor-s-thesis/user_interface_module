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

function buildStatisticsPage(contentElement, messageString, imageUrl) {
    buildBaseContent(contentElement);

    const message = document.createElement("p");
    message.textContent = messageString;
    contentElement.append(message);

    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "График статистики";
        image.style.maxWidth = "100%";
        contentElement.append(image);
    }

    buildHomeButton(contentElement);
}

function buildAllTrackingListPage(contentElement, idsAndNames) {
    buildBaseContent(contentElement);

    const listName = document.createElement("h2");
    listName.textContent = "Список отслеживаемых товаров";

    contentElement.append(listName, generateLinksList(idsAndNames));
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

function getAllTrackingProducts(callback) {
    chrome.runtime.sendMessage({ action: "getTrackedProducts" }, (response) => {
        if (response && response.success) {
            callback(response.numbers);
        } else {
            callback([]);
        }
    });
}

function generateLinksList(productsIdsAndNamesArray) {
    let linksArray = productsIdsAndNamesArray.map(([id, name]) => ({
        url: `https://www.wildberries.ru/catalog/${id}/detail.aspx`,
        name: name
    }));

    let ul = document.createElement("ul");

    linksArray.forEach(({ url, name }) => {
        let li = document.createElement("li");
        let a = document.createElement("a");

        a.href = url;
        a.textContent = name;
        a.target = "_blank";

        li.appendChild(a);
        ul.appendChild(li);
    });

    return ul;
}

function addProduct(id, contentElement) {
    //saving request to backend:
    addProductBack(id)
        .then(message => {
            //saving into local storage:
            chrome.runtime.sendMessage({ action: "addProduct", id: id}, (response) => {
                if (response && response.success) {
                    buildOperationStatusPage(contentElement, message);
                } else {
                    buildOperationStatusPage(contentElement, "Не удалось добавить!");
                }
            });
        })
        .catch(error => {
            buildOperationStatusPage(contentElement, error.message);
        });

    //-----------------------------------------------------заглушка когда отключен бэк
    // //saving into local storage:
    // chrome.runtime.sendMessage({ action: "addProduct", id: id}, (response) => {
    //     if (response && response.success) {
    //         buildOperationStatusPage(contentElement, "ДОБАВЛЕН ТОВАР.");
    //     } else {
    //         buildOperationStatusPage(contentElement, "Не удалось добавить!");
    //     }
    // });
}

function removeProduct(id, contentElement) {
    //removing request to backend:
    removeProductBack(id)
        .then(message => {
            //remove from local storage:
            chrome.runtime.sendMessage({ action: "removeProduct", id: id }, (response) => {
                if (response && response.success) {
                    buildOperationStatusPage(contentElement, message);
                } else {
                    buildOperationStatusPage(contentElement, "Не удалось удалить из отслеживания!");
                }
            });
        })
        .catch(error => {
            buildOperationStatusPage(contentElement, error.message);
        });

    //-----------------------------------------------------заглушка когда отключен бэк
    // chrome.runtime.sendMessage({ action: "removeProduct", id: id }, (response) => {
    //     if (response && response.success) {
    //         buildOperationStatusPage(contentElement, "УДАЛЕН ТОВАР.");
    //     } else {
    //         buildOperationStatusPage(contentElement, "Не удалось удалить из отслеживания!");
    //     }
    // });
}

function showStatistics(id, contentElement) {
    // get statistics request to backend:
    getProductStatsBack(id)
        .then(stats => {
            // show statistics:
            buildStatisticsPage(contentElement, stats.message, stats.imageUrl);
        })
        .catch(error => {
            buildOperationStatusPage(contentElement, error.message);
        });

    //-----------------------------------------------------заглушка когда отключен бэк
    // buildStatisticsPage(contentElement, "СООБЩЕНИЕ ПРО СТАТИСТИКУ", null);
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

//--------------------------------------------------------- ф-ии для обращения к back
const API_BASE_URL = "http://localhost:8080";

function addProductBack(productId) {
    return fetch(`${API_BASE_URL}/add_product`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId })
    })
        .then(response => {
            if (!response.ok) {
                const message = response.headers.get("X-Message") || "Ошибка при попытке добавить товар в отслеживаемые.";
                throw new Error(message);
            }
            return response.headers.get("X-Message");
        })
        .catch(error => {
            throw new Error("Ошибка при попытке добавить товар в отслеживаемые. Сервис временно недоступен, попробуйте позже.");
        });
}

function removeProductBack(productId) {
    return fetch(`${API_BASE_URL}/remove_product`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: productId })
    })
        .then(response => {
            if (!response.ok) {
                const message = response.headers.get("X-Message") || "Ошибка при попытке удалить товар из отслеживаемых.";
                throw new Error(message);
            }
            return response.headers.get("X-Message");
        })
        .catch(error => {
            throw new Error("Ошибка при попытке удалить товар из отслеживаемых. Сервис временно недоступен, попробуйте позже.");
        });
}

function getProductStatsBack(productId) {
    const url = new URL(`${API_BASE_URL}/get_product_stats`);
    url.searchParams.append("product_id", productId);

    return fetch(url, { method: "GET" })
        .then(response => {
            if (!response.ok) {
                const message = response.headers.get("X-Message") || "Ошибка при попытке построить график статистики и прогноза.";
                throw new Error(message);
            }
            return response.blob().then(blob => ({
                message: response.headers.get("X-Message"),
                imageUrl: URL.createObjectURL(blob)
            }));
        })
        .catch(error => {
            throw new Error("Ошибка при попытке построить график статистики и прогноза. Сервис временно недоступен, попробуйте позже.");
        });
}
