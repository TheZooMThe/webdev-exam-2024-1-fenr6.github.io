function showNotification(message, type = 'info', timeout = 5000) {
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

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('orderDeleted') === 'true') {
        showNotification('Заказ успешно удалён', 'success');
        localStorage.removeItem('orderDeleted'); // Clear the flag
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const BASE_API_URL = 
    'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';
    const API_KEY = '8d1c5ae7-15f2-43a9-9364-c17231682e71';
    
    const ORDERS_API_URL = `${BASE_API_URL}/orders?&api_key=${API_KEY}`;
    const GOODS_API_URL = `${BASE_API_URL}/goods?&api_key=${API_KEY}`;

    
    const orderHistoryGrid = document.querySelector('.order_history_grid');

    let goodsMap = {};
    // Глобальный объект для хранения стоимости заказов
    const ordersCostMap = {};

    // Функция для вычисления стоимости заказа
    function calculateOrderTotalCost(order, allGoods) {
        const deliveryCostBase = 200; // Базовая стоимость доставки
        let totalCost = 0;
        
        // Получаем текущую дату
        const currentDate = new Date();
        const currentDay = currentDate.getDay(); 
        
        let deliveryCost = deliveryCostBase;
        
        // Проверка, если время доставки с 18:00 до 22:00
        if (order.delivery_interval === "18:00-22:00") {
            deliveryCost += 200; // Доплата за вечерние часы
        }
        
        // Проверка, если выбран выходной день (суббота или воскресенье)
        if (currentDay === 0 || currentDay === 6) {
            deliveryCost += 300; // Доплата за выходной день
        }
        
        // Суммируем стоимость товаров из allGoods
        order.good_ids.forEach(id => {
            const item = allGoods[id];
            if (item) {
                const price = item.discount_price || item.actual_price;
                totalCost += parseInt(price, 10);
            }
        });
        
        // Добавляем стоимость доставки
        totalCost += deliveryCost;
        
        // Сохраняем стоимость заказа в глобальном объекте
        ordersCostMap[order.id] = totalCost;
        
        // Возвращаем итоговую стоимость заказа
        return totalCost;
    }
    async function fetchGoods() {
        try {
            const response = await fetch(GOODS_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const goods = await response.json();
            goods.forEach(good => {
                goodsMap[good.id] = { name: good.name, price: good.price };
            });
        } catch (error) {
            console.error('Error fetching goods:', error);
        }
    }
    
    // Функция для получения всех товаров
    async function fetchAllGoods() {
        try {
            const BASE2_URL = 
            'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods';
            const API2_KEY = '8d1c5ae7-15f2-43a9-9364-c17231682e71';

            const response = await fetch(`${BASE2_URL}?api_key=${API2_KEY}`);
            const data = await response.json();
            
            // Маппируем товары по id для быстрого доступа
            const goodsMap = {};
            data.forEach(item => {
                goodsMap[item.id] = item; // Сохраняем товар по его id
            });
            
            return goodsMap;
        } catch (error) {
            console.error('Ошибка при загрузке товаров:', error);
            return {}; // Возвращаем пустой объект в случае ошибки
        }
    }

    async function handleViewOrder(event) {
        const orderId = event.target.dataset.id;
    
        try {
            const response = 
            await fetch(`${BASE_API_URL}/orders/${orderId}?api_key=${API_KEY}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const order = await response.json();
    
            if (!order) {
                throw new Error('Order data is empty.');
            }
    
            // Генерация списка товаров в заказе
            const orderItems = order.good_ids.map(goodId => {
                const good = goodsMap[goodId]; // Получаем товар из goodsMap
                return good ? 
                    `<li>${good.name}</li>` : '';
            }).join('');
    
            const orderCost = ordersCostMap[orderId]; 

    
            // Создаем модальное окно
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2>Просмотр заказа</h2>
                    <p><strong>Дата оформления:</strong> ${order.created_at ? 
        new Date(order.created_at).toLocaleString() : 
        'Неизвестно'}</p>
                    <p><strong>Имя:</strong> ${order.full_name 
                        || 'Не указано'}</p>
                    <p><strong>Номер телефона:</strong> ${order.phone 
                        || 'Не указан'}</p>
                    <p><strong>Email:</strong> ${order.email 
                        || 'Не указан'}</p>
                    <p><strong>Адрес доставки:</strong> 
                    ${order.delivery_address 
                        || 'Не указан'}</p>
                    <p><strong>Дата доставки:</strong> 
                        ${order.delivery_date || 'Не указано'}</p>
                    <p><strong>Время доставки:</strong> 
                        ${order.delivery_interval || 'Не указано'}</p>
                    <p><strong>Состав заказа</strong></p>
                    <ul>${orderItems || '<li>Нет данных</li>'}</ul>
                    <p><strong>Стоимость:</strong> ${orderCost}₽</p>
                    <p><strong>Комментарий</strong></p>
                    <p>${order.comment || 'Нет комментария'}</p>
                </div>
            `;
    
            document.body.appendChild(modal);
    
            // Закрытие модального окна
            const closeModalBtn = modal.querySelector('.close-btn');
            closeModalBtn.onclick = () => {
                modal.remove();
            };
    
            window.onclick = (event) => {
                if (event.target === modal) {
                    modal.remove();
                }
            };
        } catch (error) {
            console.error('Error fetching order details:', error);
            showNotification(
                'Не удалось загрузить детали заказа. Попробуйте позже.',
                'error');
        }
    }
    

    async function handleEditOrder(event) {
        const orderId = event.target.dataset.id;
        const orderCost = ordersCostMap[orderId];
        try {
            const response = 
            await fetch(`${BASE_API_URL}/orders/${orderId}?api_key=${API_KEY}`);
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            const order = await response.json();
            console.log(order);
    
            const orderItems = order.good_ids.map(goodId => {
                const good = goodsMap[goodId]; // Получаем товар из goodsMap
                return good ? `<li>${good.name}</li>` : '';
            }).join('');
    
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>Редактирование заказа</h2>
                <form id="edit-order-form">
                    <label><strong>Дата оформления:</strong>
                        <input type="text" name="created_at" value="${
    order.created_at ? new 
    Date(order.created_at).toLocaleString() 
        : 'Неизвестно'
}" disabled>
                    </label>
    
                    <label><strong>Имя получателя:</strong>
                        <input type="text" 
                        name="full_name" value="${order.full_name?.trim() 
                            || ''}" required>
                    </label>
    
                    <label><strong>Адрес доставки:</strong>
                    <input type="text" 
                    name="delivery_address" 
                    value="${order.delivery_address?.trim() || ''}" required>
                </label>
    
                    <label><strong>Телефон:</strong>
                        <input type="text" name="phone" 
                        value="${order.phone || ''}" required>
                    </label>
    
                    <label><strong>Email:</strong>
                        <input type="email" name="email" value="
                        ${order.email || ''}" required>
                    </label>
    
                    <label><strong>Дата доставки:</strong>
                    <input type="date" name="delivery_date" 
                    value="${order.delivery_date?.trim() || ''}" required>
                    </label>
    
                    <label><strong>Интервал доставки:</strong>
                        <select name="delivery_interval" required>
                            <option 
                            value="08:00-12:00" ${order.delivery_interval 
                                === "08:00-12:00" 
        ? "selected" : ""}>08:00-12:00</option>
                            <option 
                            value="12:00-14:00" ${order.delivery_interval 
                                === "12:00-14:00" 
        ? "selected" : ""}>12:00-14:00</option>
                            <option 
                            value="14:00-18:00" ${order.delivery_interval === 
                                "14:00-18:00" 
        ? "selected" : ""}>14:00-18:00</option>
                            <option 
                            value="18:00-22:00" ${order.delivery_interval 
                                === "18:00-22:00" ? "selected" 
        : ""}>18:00-22:00</option>
                        </select>
                    </label>
    
                    <div class="cost-div">
                    <strong class="cost-label">Стоимость:</strong>
                    <p>${orderCost}₽</p>
                    </div>
                    <label><strong>Комментарий:</strong>
                        <textarea 
                        name="comment">${order.comment || ''}</textarea>
                    </label>
    
                    <h3>Состав заказа</h3>
                    <ul>${orderItems || '<li>Нет данных</li>'}</ul>
    
                    <div class="form-actions">
                        <button type="button" class="cls-btn">Отмена</button>
                        <button type="submit" class="cls-btn">Сохранить</button>
                    </div>
                </form>
            </div>
            `;
    
            document.body.appendChild(modal);
    
            // Закрытие модального окна
            modal.querySelector('.close-btn').addEventListener(
                'click', () => modal.remove());
            modal.querySelector('.cls-btn').addEventListener(
                'click', () => modal.remove());
            window.onclick = (event) => {
                if (event.target === modal) {
                    modal.remove();
                }
            };
    
            // Сохранение изменений
            const form = modal.querySelector('#edit-order-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
    
                const formData = new FormData(form);
                const updatedOrder = Object.fromEntries(formData.entries());
                updatedOrder.id = order.id;
    
                try {
                    const saveResponse = await 
                    fetch(
                        `${BASE_API_URL}/orders/${orderId}?api_key=${API_KEY}`,
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updatedOrder),
                        });
                    if (!saveResponse.ok) {
                        throw new Error(`Ошибка HTTP: ${saveResponse.status}`);
                    }
    
                    showNotification('Заказ успешно сохранён!', 'success');
                    modal.remove();
                    location.reload();
                } catch (saveError) {
                    console.error('Ошибка сохранения заказа:', saveError);
                    showNotification(
                        'Не удалось сохранить изменения. Попробуйте позже.', 
                        'error');
                }
            });
        } catch (error) {
            console.error('Ошибка загрузки данных для редактирования:', error);
            showNotification(
                'Не удалось загрузить данные заказа. Попробуйте позже.', 
                'error');
        }
    }
    

    async function deleteOrder(orderId) {
        try {
            const response = await 
            fetch(`${BASE_API_URL}/orders/${orderId}?api_key=${API_KEY}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            // Set a flag in localStorage before reloading
            localStorage.setItem('orderDeleted', 'true');
            location.reload();
        } catch (error) {
            console.error('Error deleting order:', error);
            showNotification(
                'Не удалось удалить заказ. Попробуйте позже.', 'error');
        }
    }
    

    function handleDeleteOrder(event) {
        const orderId = event.target.dataset.id;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-btn">&times;</span>
                        <h2>Удаление заказа</h2>
                        <p><strong>Вы уверены, что хотите удалить заказ?
                        </strong></p>
                        <div class="del-modal-buttons">
                        <button class="cls-btn">Отмена</button>
                        <button class="del-btn">Удалить</button>
                        </div>
                    </div>
                `;

        document.body.appendChild(modal);

        const closeModalBtn = modal.querySelector('.close-btn');
        closeModalBtn.onclick = () => {
            modal.remove(); 
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.remove(); 
            }
        };
        const deleteModalBtn = modal.querySelector('.del-btn');
        deleteModalBtn.addEventListener("click",
            function (event) {
                deleteOrder(orderId);
            }
        );

        const closModalBtn = modal.querySelector('.cls-btn');
        closModalBtn.addEventListener("click",
            function (event) {
                modal.remove();
            }
        );
    }

    // Функция для рендеринга заказов
    async function renderOrders(orders) {
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
        // Создаём основной контейнер
        const table = document.createElement('div');
        table.classList.add('order-table');

        // Создаём заголовок
        table.innerHTML = `
                <div class="table-header">
                    <div class="table-row">
                        <div class="table-cell">№</div>
                        <div class="table-cell">Дата оформления</div>
                        <div class="table-cell">Состав заказа</div>
                        <div class="table-cell">Стоимость</div>
                        <div class="table-cell">Время доставки</div>
                        <div class="table-cell">Действия</div>
                    </div>
                </div>
                <div class="table-body"></div>
            `;
    
        const tbody = table.querySelector('.table-body');
    
        // Получаем все товары заранее
        const allGoods = await fetchAllGoods();
    
        // Заполняем строки таблицы
        for (const [index, order] of orders.entries()) {
            const items = order.good_ids
                .map(id => allGoods[id]?.name)
                .filter(Boolean)
                .join(', ');
    
            const totalCost = calculateOrderTotalCost(order, allGoods);
    
            // Создаём строку с Flexbox
            const row = document.createElement('div');
            row.classList.add('table-row');
            row.innerHTML = `
                    <div class="table-cell">${index + 1}</div>
                    <div class="table-cell">
                    ${new Date(order.created_at).toLocaleString()}</div>
                    <div class="table-cell">${items || "Нет товаров"}</div>
                    <div class="table-cell">
                    ${totalCost > 0 ? totalCost + "₽" : "Не указано"}</div>
                    <div class="table-cell">${order.delivery_interval}</div>
                    <div class="table-cell action-flex">
                    <button class="view-btn" data-id="${order.id}">👁️</button>
                    <button class="edit-btn" data-id="${order.id}">✏️</button>
                    <button class="delete-btn" data-id="${order.id}">🗑️</button>
                    </div>
                `;
            tbody.appendChild(row);
        }
    
        // Заменяем содержимое контейнера
        orderHistoryGrid.innerHTML = '';
        orderHistoryGrid.appendChild(table);
    
        // Добавляем обработчики событий
        table.querySelectorAll('.view-btn').forEach(button =>
            button.addEventListener('click', handleViewOrder));
        table.querySelectorAll('.edit-btn').forEach(button =>
            button.addEventListener('click', handleEditOrder));
        table.querySelectorAll('.delete-btn').forEach(button =>
            button.addEventListener('click', handleDeleteOrder));
    }
    async function fetchOrders() {
        try {
            const response = await fetch(ORDERS_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const orders = await response.json();
            renderOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            orderHistoryGrid.innerHTML = 
                '<p>Не удалось загрузить заказы. Попробуйте позже.</p>';
        }
    }
    // Инициализация страницы
    async function initializePage() {
        await fetchGoods(); // Получаем список товаров
        fetchOrders(); // Получаем список заказов
    }

    
    initializePage();
    
});
