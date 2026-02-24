// Native fetch is available in Node 18+

// If Node < 18, we might need to mock fetch or use https. 
// But Next.js project likely has node 18+. Let's assume built-in fetch.

async function testOrder() {
    console.log('Testing Order API...');

    const orderPayload = {
        cartItems: [
            {
                productId: 'test-product-1',
                productTitle: 'Test Product',
                price: 1000,
                quantity: 2,
                configuration: { size: 'L' }
            }
        ],
        customerInfo: {
            customerName: 'Test Bot',
            email: 'test@bot.com',
            phone: '+79990000000',
            address: 'Test Address, Bot City',
            telegram: '@testbot'
        },
        locale: 'ru'
    };

    try {
        const response = await fetch('http://localhost:3000/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });

        const result = await response.json();

        console.log('Status Code:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (response.ok && result.success) {
            console.log('✅ Order placed successfully! Order ID:', result.orderId);
            console.log('Check your Telegram for specific notification content.');
        } else {
            console.error('❌ Order failed.');
        }

    } catch (error) {
        console.error('❌ Network or Server Error:', error);
    }
}

testOrder();
