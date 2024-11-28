let dataItems = [0, 0, 0];
let isRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const blocks = document.querySelectorAll('.block');
    const themeToggleButton = document.getElementById('themeToggle');
    const body = document.body;

    document.body.classList.add('day-theme');

    blocks.forEach(block => {
        const blockId = block.id.slice(-1); // Extract block number from ID
        const hungerInput = block.querySelector('.hunger');
        const minusOneBtn = block.querySelector('.minusOne');
        const plusOneBtn = block.querySelector('.plusOne');
        const valueButtons = block.querySelectorAll('.set-value');
        const imageContainer = block.querySelector('.image-container');
        let hungerImage = block.querySelector('.hungerImage');

        setTimeout(() => {
            fetch('/api/hunger')
            .then(response => response.json())
            .then(data => {
                if (dataItems != data) {
                    dataItems = data;
                    console.log(`Данные обновлены: ${dataItems}`);
                }
                if (dataItems[blockId - 1] !== parseInt(hungerInput.value)) {
                    hungerInput.value = data[blockId-1];
                    updateHunger(parseInt(hungerInput.value));
                    console.log(`Данные блока ${blockId-1}: ${data[blockId-1]}`);
                }
                isRunning = true;
            })
            .catch(error => console.error('Error:', error));
        }, 2500);

        const updateImage = (value) => {
            const newImage = new Image();
            newImage.src = `/imgs/${blockId}/${value}.png`;
            newImage.classList.add('hungerImage', 'hidden');

            newImage.onload = () => {
                imageContainer.appendChild(newImage);
                setTimeout(() => {
                    hungerImage.classList.add('hidden');
                    newImage.classList.remove('hidden');

                    setTimeout(() => {
                        hungerImage.remove();
                        hungerImage = newImage;
                    }, 1000);
                }, 50);
            };
        };

        const updateHunger = (value) => {
            if (value < 0) value = 0;
            if (value > 5) value = 5;
            hungerInput.value = value;
            updateImage(value);
            socket.emit('hungerChange', { blockId: block.id, value }); // Emit event to server
        };

        minusOneBtn.addEventListener('click', () => {
            updateHunger(parseInt(hungerInput.value) - 1);
        });

        plusOneBtn.addEventListener('click', () => {
            updateHunger(parseInt(hungerInput.value) + 1);
        });

        valueButtons.forEach(button => {
            button.addEventListener('click', () => {
                updateHunger(parseInt(button.dataset.value));
            });
        });

        hungerInput.addEventListener('input', () => {
            updateHunger(parseInt(hungerInput.value));
        });


        // Listen for hungerChange events from the server
        socket.on('updateHunger', ({ blockId, value }) => {
            if (block.id === blockId) {
                hungerInput.value = value;
                updateImage(value);

                if (isRunning) {
                    dataItems[block.id.slice(-1)-1] = parseInt(hungerInput.value);
                    console.log(`JSON: ${JSON.stringify(dataItems)}`);
                    // Отправляем данные на сервер в формате JSON
                    fetch('/api/hunger', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(dataItems), 
                    })
                    .then(response => response.json())
                    .then(result => {
                        console.log(result.message);
                    })
                    .catch(error => console.error('Error:', error));
                }
            }
        });

        // Set initial values from server
        socket.on('initialValues', (initialValues) => {
            const initialValue = initialValues[block.id];
            hungerInput.value = initialValue;
            updateImage(initialValue);
        });

        // Initial image setup
        updateImage(hungerInput.value);
    });

    // Toggle theme
    themeToggleButton.addEventListener('click', () => {
         if (body.classList.contains('day-theme')) {
              body.classList.remove('day-theme');
              body.classList.add('night-theme');
              themeToggleButton.innerText = 'Switch to Day Theme';
          } else {
              body.classList.remove('night-theme');
              body.classList.add('day-theme');
              themeToggleButton.innerText = 'Switch to Night Theme';
          }
    });

    // Функция для отправки запроса "ping" на сервер
    function sendPing() {
        fetch('/api/ping')
            .then(response => response.json())
            .then(result => {
                console.log(result.message);
            })
            .catch(error => console.error('Error:', error));
    }

    // Запуск метода sendPing каждые 60 секунд (1 минута)
    setInterval(() => {
        sendPing();
    }, 60000); 
});

