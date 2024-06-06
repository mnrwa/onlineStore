function openLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('modalBackground').style.display = 'block';
}

function closeLoginForm(){
    document.getElementById('loginForm').style.display = "none"
    document.getElementById('modalBackground').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const falseAuthMessage = document.getElementById('falseAuth');

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const login = formData.get('login');
        const password = formData.get('password');

        if (!login || !password) {
            falseAuthMessage.textContent = 'Пожалуйста, заполните все поля.';
            return;
        }

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    login,
                    password
                })
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
});



function getCurrentUserId() {
    return window.currentUserId;
}

function addProd(id_prod) {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        console.error('Не авторизован');
        return;
    }

    var count = parseInt(document.getElementById('counter-value').innerHTML);
    count += 1;
    document.getElementById('counter-value').innerHTML = count;

    const storageKey = `productCounts_${currentUserId}`;

    let productCounts = JSON.parse(localStorage.getItem(storageKey)) || {};

    if (productCounts[id_prod]) {
        productCounts[id_prod] += 1; 
    } else {
        productCounts[id_prod] = 1; 
    }

    

    localStorage.setItem(storageKey, JSON.stringify(productCounts));
}


// function cart(){
//     var myContent = localStorage.getItem("storageKey");
//     document.getElementById("myTextarea").value = myContent;
// }



function displayProductCounts() {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        console.error('Не авторизован');
        return;
    }

    const storageKey = `productCounts_${currentUserId}`;
    const productCounts = JSON.parse(localStorage.getItem(storageKey)) || {};
    let selectHTML = ''; 

    for (const id in productCounts) {
        selectHTML += `Товар ID: ${id} был выбран ${productCounts[id]} раз(а)<br>`;
    }

    document.querySelector('.my-select').innerHTML = selectHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    displayProductCounts();
});


function exitbtn(){

    window.location.href = '/logout';

}






