function openLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('modalBackground').style.display = 'block';
}

function closeLoginForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('modalBackground').style.display = 'none';
}


function getCurrentUserId() {
    return window.currentUserId;
}


function addProd(id_prod) {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        console.error('Не авторизован');
        return;
    }

    const counterElement = document.getElementById('counter-value');
    let count = parseInt(counterElement.innerHTML, 10);
    counterElement.innerHTML = ++count;

    const storageKey = `productCounts_${currentUserId}`;
    let productCounts = JSON.parse(localStorage.getItem(storageKey)) || {};

    productCounts[id_prod] = (productCounts[id_prod] || 0) + 1;
    localStorage.setItem(storageKey, JSON.stringify(productCounts));
}

const setCart = () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        console.error('Не авторизован');
        return;
    }

    const storageKey = `productCounts_${currentUserId}`;
    const productCountsRaw = localStorage.getItem(storageKey);
    if (!productCountsRaw) {
        console.error(`Данные о продуктах не найдены для ключа: ${storageKey}`);
        document.querySelector('.my-select').innerHTML = 'Корзина пуста';
        return;
    }

    const productCounts = JSON.parse(productCountsRaw);
    const ids = Object.keys(productCounts);

    if (ids.length === 0) {
        const cartItemsContainer = document.querySelector('.cart-items');
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = 'Корзина пуста';
        }
        const totalSumDiv = document.getElementById('grand-total');
        if (totalSumDiv) {
            totalSumDiv.innerText = '0 руб.';
        }
        return;
    }

    fetch('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении данных о товарах');
        }
        return response.json();
    })
    .then(products => {
        const cartItemsContainer = document.querySelector('.cart-items');
        if (!cartItemsContainer) {
            console.error('Элемент .cart-items не найден на странице');
            return;
        }
    
        if (!products || products.length === 0) {
            cartItemsContainer.innerHTML = 'Товары не найдены';
            return;
        }
    
        cartItemsContainer.innerHTML = '';
        let totalSum = 0;

        products.forEach(product => {
            const cartItem = document.createElement('div');
            let total_cost = productCounts[product.id] * product.price;
            totalSum += total_cost;

            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <div class="product-img">
                    <img src="../images/products_img/${product.image_path}" alt="${product.name}"/>
                </div>

                <div class="product-info">
                    <p>Товар: ${product.name}</p>
                    <p id="total_cost">Цена: ${product.price}</p>
                    <p>Количество: <span id="product-count-${product.id}">${productCounts[product.id]}</span></p>
                    <p>Общая стоимость: <strong id="total-cost-${product.id}">${total_cost}</strong></p>
                </div>

                <button onclick="updateProductCount('${product.id}', 1)">+</button>
                <button onclick="updateProductCount('${product.id}', -1)">-</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        const totalSumDiv = document.getElementById('grand-total');
        if (totalSumDiv) {
            totalSumDiv.innerText = `${totalSum} руб.`;
        }

        const orderForm = document.querySelector('form[action="/new-order"]');
        if (orderForm) {
            orderForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                try {
                    const response = await fetch(orderForm.action, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            userId: currentUserId,
                            products: products.map(product => ({
                                productId: product.id,
                                quantity: productCounts[product.id],
                                // price: product.price
                            }))
                        }) 
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to place order');
                    }

                    const cartItemsContainer = document.querySelector('.cart-items');
                    if (cartItemsContainer) {
                        cartItemsContainer.innerHTML = 'Корзина пуста';
                    }

                    const totalSumDiv = document.getElementById('grand-total');
                    if (totalSumDiv) {
                        totalSumDiv.innerText = '0 руб.';
                    }
                } catch (error) {
                    console.error('Error placing order:', error);
                }
            });
        }
    })
    .catch(error => {
        console.error('Ошибка при получении данных о товарах:', error);
        const mySelect = document.querySelector('.my-select');
        if (mySelect) {
            mySelect.innerHTML = 'Ошибка при получении данных о товарах';
        } else {
            console.error('Элемент .my-select не найден на странице');
        }
    });
};


const updateProductCount = (productId, change) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        console.error('Не авторизован');
        return;
    }

    const storageKey = `productCounts_${currentUserId}`;
    const productCountsRaw = localStorage.getItem(storageKey);
    if (!productCountsRaw) {
        console.error(`Данные о продуктах не найдены для ключа: ${storageKey}`);
        return;
    }

    const productCounts = JSON.parse(productCountsRaw);
    if (!productCounts[productId]) {
        productCounts[productId] = 0;
    }

    productCounts[productId] += change;

    if (productCounts[productId] <= 0) {
        delete productCounts[productId];
    }

    localStorage.setItem(storageKey, JSON.stringify(productCounts));
    setCart();
};


document.addEventListener('DOMContentLoaded', function() {
    setCart();
});



document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const falseAuthMessage = document.getElementById('falseAuth');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const login = formData.get('login');
            const password = formData.get('password');

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ login, password })
                });

                const result = await response.json();

                if (result.success) {
                    document.cookie = `user=${result.userName};path=/`;
                    document.cookie = `role=${result.role};path=/`;
                    window.location.reload();
                } else {
                    falseAuthMessage.textContent = 'Неправильный логин или пароль';
                }
            } catch (error) {
                console.error('Error during login:', error);
                falseAuthMessage.textContent = 'Произошла ошибка. Попробуйте еще раз.';
            }
        });
    }
});

function exitbtn() {
    // localStorage.removeItem(`productCounts_${getCurrentUserId()}`);
    //localStorage.clear();
    window.location.href = '/logout';
}


function placeOrder() {
    const cartItemsContainer = document.querySelector('.cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';

        localStorage.removeItem(`productCounts_${getCurrentUserId()}`);

        setCart();

        alert("Заказ создан");
    } else {
        console.error('Контейнер элементов корзины не найден.');
    }
}


// Сделать