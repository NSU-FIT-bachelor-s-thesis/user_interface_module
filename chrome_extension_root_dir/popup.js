const API_BASE_URL = "http://localhost:8080";


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
            appendDescription(contentElement);
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

function buildStatisticsPage(contentElement, messageString, svgString) {
    buildBaseContent(contentElement);

    const message = document.createElement("p");
    message.textContent = messageString;
    contentElement.append(message);

    if (svgString) {
        const svgContainer = document.createElement("div");
        svgContainer.innerHTML = svgString;

        svgContainer.style.width = "720px";
        svgContainer.style.height = "432px";

        svgContainer.style.display = "flex";
        svgContainer.style.justifyContent = "center";
        svgContainer.style.alignItems = "center";

        svgContainer.style.overflow = "auto";

        contentElement.append(svgContainer);
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
}

function appendDescription(contentElement) {
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
    homeButton.textContent = "back";

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

    ul.style.maxHeight = "250px";
    ul.style.overflowY = "auto";
    ul.style.border = "1px solid #ccc";

    linksArray.forEach(({ url, name }) => {
        let li = document.createElement("li");
        let a = document.createElement("a");

        // a.href = url;
        a.textContent = name;
        // a.target = "_blank";

        a.addEventListener('click', (event) => {
            event.preventDefault();
            chrome.tabs.update({ url: url });
        });


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
                    buildOperationStatusPage(contentElement, "Не удалось добавить товар в отслеживание.");
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
                    buildOperationStatusPage(contentElement, "Не удалось удалить товар из отслеживания.");
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
            buildStatisticsPage(contentElement, stats.message, stats.svgGraph);
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
                throw new Error("Ошибка при попытке добавить товар в отслеживаемые.");
            }
            return "Товар добавлен в отслеживаемые.";
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
                throw new Error("Ошибка при попытке удалить товар из отслеживаемых.");
            }
            return "Товар удалён из отслеживаемых.";
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
                throw new Error("Ошибка при попытке получить статистику и прогноз.");
            }
            return response.json();
        })
        .then(data => {
            const backStatus = data.status || null;
            const svgGraph = data.graph || null;

            console.log("AAA: ", data);
            console.log("STATUS: ", backStatus);

            let backMessage;
            switch (backStatus) {
                case "STATISTICS_AND_PREDICTIONS":
                    backMessage = "Статистика и прогноз.";
                    break;
                case "BROKEN_DATA__STATISTICS_ONLY":
                    backMessage = "Пока что недостаточно данных для прогноза. В процессе сбора.";
                    break;
                case "NOT_ENOUGH_DATA_YET__STATISTICS_ONLY":
                    backMessage = "Пока что недостаточно данных для прогноза. В процессе сбора.";
                    break;
                case "TRY_LATER__STATISTICS_ONLY":
                    backMessage = "Статистика без прогноза. Ошибка при получении прогноза, попробуйте позже.";
                    break;
                case "NO_DATA_YET":
                    backMessage = "В процессе сбора данных.";
                    break;
                default:
                    backMessage = "Не удалось обработать полученную статистику и прогноз. Попробуйте позже.";
            }
            return {
                message: backMessage,
                svgGraph: svgGraph
            };
        })
        .catch(error => {
            throw new Error("Ошибка при попытке получить статистику и прогноз. Сервис временно недоступен, попробуйте позже.");
        });
}
