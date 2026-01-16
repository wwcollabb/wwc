        // ===== QR CODE GENERATION =====
        function generateQRCode(amount) {
            const upiId = 'nextune@upi';
            const payeeName = 'Worldwide Collab';
            const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
            document.getElementById('qr-code').src = qrUrl;
            document.getElementById('qr-code').style.display = 'block';
        }

        // ===== UPDATE PROCEED TO PAYMENT FUNCTION =====
        function proceedToPayment() {
            document.getElementById('services').classList.add('hidden');
            document.getElementById('payment-section').classList.remove('hidden');
            const totalAmount = document.getElementById('total-price').textContent;
            generateQRCode(totalAmount); // Yahan QR code generate hota hai
            startCountdown();
        }

