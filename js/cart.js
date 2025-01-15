const API_URL = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods";
const API_KEY = "8d1c5ae7-15f2-43a9-9364-c17231682e71";
const productsGrid = document.querySelector(".products-grid");

function showNotification(message, type = 'info', timeout = 500000) {
    // Найти область для уведомлений
    const notificationContainer = 
    document.querySelector('.notifications-container');
    if (!notificationContainer) {
        console.error('Уведомления контейнер отсутствует в HTML!');
        return;
    }

    // Создать новое уведомление
    const notification = document.createElement('div');
    notification.className = `notifications ${type}`;
    notification.innerHTML = `
        <p>${message}</p>
        <button class="close-btn">X</button>
    `;

    // Добавить уведомление в контейнер
    notificationContainer.appendChild(notification);

    // Закрытие уведомления по кнопке
    const closeButton = notification.querySelector('.close-btn');
    closeButton.onclick = () => {
        notification.remove();
    };

    // Автоматическое скрытие уведомления через `timeout` миллисекунд
    if (timeout > 0) {
        setTimeout(() => {
            notification.remove();
        }, timeout);
    }
}

// Функция для добавления id в localStorage
function addToLocalStorage(id) {
    let storedIds = JSON.parse(localStorage.getItem("selectedGoods")) || [];
    if (!storedIds.includes(id)) {
        storedIds.push(id);
        localStorage.setItem("selectedGoods", JSON.stringify(storedIds));
    }
}

async function fetchGoodsByIds(ids) {
    try {
        const url = `${API_URL}?api_key=${API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const allGoods = await response.json();

        // Фильтруем товары по сохранённым ID
        const filteredGoods = allGoods.filter(item => ids.includes(item.id));
        return filteredGoods;
    } catch (error) {
        console.error("Не удалось загрузить товары:", error);
        return [];
    }
}
function removeFromLocalStorage(id) {
    const storedIds = JSON.parse(localStorage.getItem("selectedGoods")) || [];
    const updatedIds = storedIds.filter(storedId => storedId !== id);
    localStorage.setItem("selectedGoods", JSON.stringify(updatedIds));
}

function calculateTotalCost() {
    const deliveryCostBase = 200; // Базовая стоимость доставки
    let totalCost = 0;
    
    // Получаем текущую дату
    const currentDate = new Date();
    const currentDay = 
    currentDate.getDay(); 

    // Дополнительная стоимость доставки в зависимости от времени и дня недели
    let deliveryCost = deliveryCostBase;

    // Получаем интервал доставки из формы
    const deliveryInterval = document.querySelector("#time").value;

    // Проверка, если время доставки с 18:00 до 22:00
    if (deliveryInterval === "18:00-22:00") {
        deliveryCost += 200; // Доплата за вечерние часы
    }

    // Проверка, если выбран выходной день (суббота или воскресенье)
    if (currentDay === 0 || currentDay === 6) {
        deliveryCost += 300; // Доплата за выходной день
    }

    // Выводим промежуточные данные для отладки
    console.log("Base Delivery Cost:", deliveryCostBase);
    console.log("Current Date: ", currentDate);
    console.log("Delivery Interval: ", deliveryInterval);
    console.log("Additional Delivery Cost:", deliveryCost - deliveryCostBase);

    // Найти все карточки товаров
    const productCards = document.querySelectorAll(".product-card");
    
    // Перебираем карточки и суммируем стоимость товаров
    productCards.forEach(card => {
        // Найти элемент с ценой
        const priceElement = 
        card.querySelector(".discount-price") || card.querySelector("p");
        if (priceElement) {
            // Извлечь стоимость товара (удалить лишние символы ₽ и пробелы)
            const priceText = priceElement.textContent.replace(/[^\d]/g, "");
            console.log("Price of item:", priceText);
            totalCost += parseInt(priceText, 10); // Добавляем стоимость товара
        }
    });

    // Добавляем стоимость доставки
    totalCost += deliveryCost;

    // Выводим итоговую стоимость для отладки
    console.log("Total Cost (including delivery):", totalCost);

    const summaryElement = document.querySelector(".form-summary strong");
    if (summaryElement) {
        summaryElement.textContent = `${totalCost} ₽`;
    }

    const deliveryElement = document.querySelector(".form-summary span");
    if (deliveryElement) {
        deliveryElement.textContent = `${totalCost} ₽`;
    }
}


// Функция для рендера товаров
function renderGoods(goods) {
    productsGrid.innerHTML = ""; 

    const storedIds = JSON.parse(localStorage.getItem("selectedGoods")) || [];

    if (goods.length === 0) {
        productsGrid.innerHTML = 
        "<p>Корзина пуста. Перейдите в каталог, чтобы добавить товары.</p>";
        return;
    }

    goods.forEach(item => {
        const card = document.createElement("div");
        card.className = "product-card";

        // Подсветка карточки, если товар уже добавлен
        if (storedIds.includes(item.id)) {
            card.classList.add("selected");
        }

        const img = document.createElement("img");
        img.src = item.image_url;
        img.alt = item.name;

        const name = document.createElement("h3");
        name.textContent = item.name;

        const category = document.createElement("p");
        category.textContent = `Категория: ${item.main_category}`;

        const rating = document.createElement("p");
        rating.textContent = `Рейтинг: ${item.rating}`;

        const price = document.createElement("p");
        const actualPrice = `${item.actual_price} ₽`;
        const discountPrice = item.discount_price
            ? `<span class="discount-price">${item.discount_price} ₽</span>`
            : null;

        if (!item.discount_price) {
            price.classList.add("discount-price");
            price.innerHTML = actualPrice;
        } else {
            price.innerHTML = `${discountPrice} <s>${actualPrice}</s>`;
        }

        const removeButton = document.createElement("button");
        removeButton.textContent = "Удалить";
        removeButton.className = "remove-to-cart-btn";

        // Событие для добавления в localStorage
        removeButton.addEventListener("click", () => {
            // Удаляем ID из localStorage
            removeFromLocalStorage(item.id);
        
            // Удаляем карточку из DOM
            card.remove();
        
            // Пересчитываем итоговую стоимость
            calculateTotalCost();
        });

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(category);
        card.appendChild(rating);
        card.appendChild(price);
        card.appendChild(removeButton);

        productsGrid.appendChild(card);
    });
}

async function loadCartGoods() {
    const storedIds = JSON.parse(localStorage.getItem("selectedGoods")) || [];
    if (storedIds.length > 0) {
        const goods = await fetchGoodsByIds(storedIds);
        renderGoods(goods);
    } else {
        productsGrid.innerHTML = 
        "<p>Корзина пуста. Перейдите в каталог, чтобы добавить товары.</p>";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadCartGoods();
    calculateTotalCost();
});
function displayLocalStorage() {
    const storedIds = JSON.parse(localStorage.getItem("selectedGoods")) || [];
    console.log("Выбранные товары:", storedIds);
}


// Ссылка на API для отправки заказа
const BASE_2URL = 
"https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders";
const API_2KEY = "8d1c5ae7-15f2-43a9-9364-c17231682e71";
const ORDER_API_URL = `${BASE_2URL}?&api_key=${API_2KEY}`;

// Находим форму
const orderForm = document.querySelector("form");

// Обработчик события отправки формы
orderForm.addEventListener("submit", async (event) => {
    event.preventDefault(); 

    // Собираем данные из формы
    const formData = new FormData(orderForm);
    const fullName = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const deliveryAddress = formData.get("address");
    const deliveryDate = formData.get("date");
    const deliveryInterval = formData.get("time");
    const comment = formData.get("comment"); 

    // Проверяем обязательные поля
    if (!fullName || 
        !email || !phone || 
        !deliveryAddress || !deliveryDate || !deliveryInterval) {
        showNotification("Пожалуйста, заполните все обязательные поля.", 
            "error");
        return;
    }

    const formattedDate = deliveryDate.split("-").reverse().join(".");

    const goodsIds = JSON.parse(localStorage.getItem("selectedGoods")) || [];
    console.log('Идентификаторы товаров из localStorage:', goodsIds);

    if (goodsIds.length === 0) {
        showNotification(
            "Корзина пуста. Добавьте товары перед оформлением заказа.", 
            'error');
        return;
    }

    // Формируем объект для отправки
    const orderData = {
        full_name: fullName,
        email: email,
        phone: phone,
        delivery_address: deliveryAddress,
        delivery_date: formattedDate,
        delivery_interval: deliveryInterval,
        good_ids: goodsIds,
        comment: comment,
    };
    try {
        // Отправляем данные на сервер
        const response = await fetch(ORDER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
        });

        // Обрабатываем ответ
        if (response.ok) {
            const result = await response.json();
            showNotification("Заказ успешно создан! Спасибо за покупку.", 
                "success");
            console.log("Ответ сервера:", result);
            orderForm.reset();
            localStorage.removeItem("selectedGoods");
            await loadCartGoods();

            window.location.href = "/index.html";
        } else {
            showNotification("Ошибка при создании заказа. Попробуйте снова.", 
                "error");
            console.error("Ошибка сервера:", await response.text());
        }
    } catch (error) {
        showNotification(
            "Произошла ошибка при отправке заказа.", 
            "error");
        console.error("Ошибка:", error);
    }
});
document.querySelector("#time").addEventListener("change", calculateTotalCost);
