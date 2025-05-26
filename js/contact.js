// Contact form AJAX submit

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    const caption = document.getElementById('contact-caption');
    const loader = document.getElementById('contact-loader');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (caption) {
                caption.style.display = 'none';
                caption.textContent = '';
                caption.classList.remove('success', 'error');
            }
            if (loader) {
                loader.innerHTML = '<span class="spinner"></span>';
                loader.style.display = 'flex';
            }
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => { data[key] = value; });
            try {
                const response = await fetch('send_mail.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    if (caption) {
                        caption.textContent = 'Mail enviado exitosamente';
                        caption.style.display = 'block';
                        caption.classList.add('success');
                    }
                    contactForm.reset();
                } else {
                    if (caption) {
                        caption.textContent = 'Fallo de envio de mail';
                        caption.style.display = 'block';
                        caption.classList.add('error');
                    }
                }
            } catch (err) {
                if (caption) {
                    caption.textContent = 'Fallo de envio de mail';
                    caption.style.display = 'block';
                    caption.classList.add('error');
                }
            } finally {
                if (loader) {
                    loader.innerHTML = '';
                    loader.style.display = 'none';
                }
            }
        });
    }
});
