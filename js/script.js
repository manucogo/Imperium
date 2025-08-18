// Esperar a que se cargue todo el documento
document.addEventListener("DOMContentLoaded", function() {
    // Inicializar AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Menu mobile toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Cambiar ícono del hamburger
            const icon = hamburger.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Theme switch (Dark/Light mode)
    const themeSwitch = document.querySelector('.theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            
            // Cambiar ícono del theme switch
            const icon = themeSwitch.querySelector('i');
            if (icon.classList.contains('fa-moon')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
            
            // Guardar preferencia en localStorage
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
        
        // Verificar preferencia guardada
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            const icon = themeSwitch.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // Scroll smooth para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Cerrar menú móvil si está abierto
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
            
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Activar navegación según sección visible
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', function() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    // Schedule tabs
    const scheduleTabs = document.querySelectorAll('.schedule-tab');
    const scheduleContents = document.querySelectorAll('.schedule-content');
    
    if (scheduleTabs.length && scheduleContents.length) {
        scheduleTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                
                // Quitar active de todas las tabs
                scheduleTabs.forEach(t => t.classList.remove('active'));
                // Añadir active a la tab actual
                tab.classList.add('active');
                
                // Ocultar todos los contenidos
                scheduleContents.forEach(content => content.classList.remove('active'));
                // Mostrar el contenido seleccionado
                document.getElementById(target).classList.add('active');
            });
        });
    }

    // Pricing toggle (mensual/anual)
    const pricingToggle = document.getElementById('pricing-toggle');
    const pricingPrices = document.querySelectorAll('.pricing-price');
    
    if (pricingToggle && pricingPrices.length) {
        pricingToggle.addEventListener('change', function() {
            pricingPrices.forEach(price => {
                const monthly = price.getAttribute('data-monthly');
                const yearly = price.getAttribute('data-yearly');
                
                if (this.checked) {
                    // Anual
                    price.innerHTML = `${yearly}€ <span>/mes</span>`;
                } else {
                    // Mensual
                    price.innerHTML = `${monthly}€ <span>/mes</span>`;
                }
            });
        });
    }

    // Galería filtros
    const galleryFilters = document.querySelectorAll('.gallery-filter button');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (galleryFilters.length && galleryItems.length) {
        galleryFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                // Quitar active de todos los filtros
                galleryFilters.forEach(f => f.classList.remove('active'));
                // Añadir active al filtro actual
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                
                // Filtrar los items
                galleryItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Testimonial slider moderno
    const initTestimonialCarousel = function() {
        // Elementos del carrusel
        const track = document.getElementById('testimonialsTrack');
        const cards = Array.from(document.querySelectorAll('.testimonial-card'));
        const dots = Array.from(document.querySelectorAll('.testimonial-dot'));
        const prevButton = document.querySelector('.prev-testimonial');
        const nextButton = document.querySelector('.next-testimonial');
        
        if (track && cards.length && dots.length && prevButton && nextButton) {
            let currentIndex = 0;
            const cardWidth = 100; // Ancho en porcentaje
            let autoplayInterval;
            
            // Función para mostrar un testimonio específico
            function showTestimonial(index) {
                // Validar el índice
                if (index < 0) index = cards.length - 1;
                if (index >= cards.length) index = 0;
                
                // Guardar el nuevo índice
                currentIndex = index;
                
                // Mover el track
                track.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
                
                // Actualizar clases active
                cards.forEach((card, i) => {
                    card.classList.remove('active');
                    if (i === currentIndex) {
                        card.classList.add('active');
                    }
                });
                
                // Actualizar dots
                dots.forEach((dot, i) => {
                    dot.classList.remove('active');
                    if (i === currentIndex) {
                        dot.classList.add('active');
                    }
                });
                
                // Reiniciar el autoplay
                resetAutoplay();
            }
            
            // Función para ir al siguiente testimonio
            function nextTestimonial() {
                showTestimonial(currentIndex + 1);
            }
            
            // Función para ir al testimonio anterior
            function prevTestimonial() {
                showTestimonial(currentIndex - 1);
            }
            
            // Configurar autoplay
            function startAutoplay() {
                autoplayInterval = setInterval(nextTestimonial, 5000);
            }
            
            // Reiniciar autoplay
            function resetAutoplay() {
                clearInterval(autoplayInterval);
                startAutoplay();
            }
            
            // Event listeners
            prevButton.addEventListener('click', function(e) {
                e.preventDefault();
                prevTestimonial();
            });
            
            nextButton.addEventListener('click', function(e) {
                e.preventDefault();
                nextTestimonial();
            });
            
            // Event listeners para los dots
            dots.forEach((dot, index) => {
                dot.addEventListener('click', function(e) {
                    e.preventDefault();
                    showTestimonial(index);
                });
            });
            
            // Touch swipe para móviles
            let touchStartX = 0;
            let touchEndX = 0;
            
            track.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            track.addEventListener('touchend', e => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const swipeThreshold = 50;
                if (touchEndX < touchStartX - swipeThreshold) {
                    // Swipe izquierda -> siguiente
                    nextTestimonial();
                }
                if (touchEndX > touchStartX + swipeThreshold) {
                    // Swipe derecha -> anterior
                    prevTestimonial();
                }
            }
            
            // Pausar autoplay cuando el usuario interactúa
            const container = document.querySelector('.testimonials-container');
            
            if (container) {
                container.addEventListener('mouseenter', () => {
                    clearInterval(autoplayInterval);
                });
                
                container.addEventListener('mouseleave', () => {
                    startAutoplay();
                });
            }
            
            // Inicializar el carrusel
            showTestimonial(0);
        }
    };

    initTestimonialCarousel();

    // Animación de counter para stats
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length) {
        const statsSection = document.querySelector('.about');
        if (statsSection) {
            const counterObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    statNumbers.forEach(stat => {
                        const target = parseInt(stat.textContent.replace(/\+/g, ''));
                        let count = 0;
                        const duration = 2000; // 2 segundos
                        const steps = 60;
                        const increment = Math.ceil(target / steps);
                        const interval = duration / steps;
                        
                        const counter = setInterval(() => {
                            count += increment;
                            if (count >= target) {
                                stat.textContent = target + '+';
                                clearInterval(counter);
                            } else {
                                stat.textContent = count + '+';
                            }
                        }, interval);
                    });
                    counterObserver.disconnect();
                }
            }, { threshold: 0.5 });
            
            counterObserver.observe(statsSection);
        }
    }

    // Validación del formulario de contacto
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        const formStatus = document.getElementById('formStatus');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');

        // Función para mostrar mensajes de estado
        function showStatus(type, message) {
            formStatus.className = `form-status ${type}`;
            formStatus.textContent = message;
            formStatus.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            }
        }
        
        // Función para validar email
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }
        
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name');
            const email = document.getElementById('email');
            const subject = document.getElementById('subject');
            const message = document.getElementById('message');
            
            let valid = true;
            
            // Validación simple
            [name, email, subject, message].forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = 'red';
                    valid = false;
                } else {
                    field.style.borderColor = 'transparent';
                }
            });
            
            if (!validateEmail(email.value)) {
                email.style.borderColor = 'red';
                valid = false;
            }
            
            if (!valid) {
                showStatus('error', '❌ Por favor, completa todos los campos correctamente');
                return;
            }
            
            // Mostrar estado de carga
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="spinner"></span>ENVIANDO...';
            showStatus('loading', '📤 Enviando tu mensaje...');
            
            try {
                const formData = new FormData(this);
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    showStatus('success', '✅ ¡Mensaje enviado correctamente! Nos pondremos en contacto contigo pronto.');
                    this.reset();
                } else {
                    throw new Error('Error en el servidor');
                }
                
            } catch (error) {
                showStatus('error', '❌ Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
            }
            
            // Restaurar botón
            submitBtn.disabled = false;
            btnText.textContent = 'ENVIAR MENSAJE';
        });
    }  

    // Script para la sección Sexypace - Integrado con el sistema existente
    // Animación de contadores para las estadísticas de Sexypace
    const sexypaceStats = document.querySelectorAll('.sexypace .stat-number');
    const sexypaceSection = document.querySelector('.sexypace');
    
    if (sexypaceStats.length && sexypaceSection) {
        // Crear observer para detectar cuando la sección es visible
        const sexypaceObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                sexypaceStats.forEach(stat => {
                    const target = parseInt(stat.textContent.replace(/\+|K/g, ''));
                    const isK = stat.textContent.includes('K');
                    let count = 0;
                    const duration = 2000; // 2 segundos
                    const steps = 60;
                    const increment = Math.ceil(target / steps);
                    const interval = duration / steps;
                    
                    const counter = setInterval(() => {
                        count += increment;
                        if (count >= target) {
                            stat.textContent = target + (isK ? 'K' : '+');
                            clearInterval(counter);
                        } else {
                            stat.textContent = count + (isK ? 'K' : '');
                        }
                    }, interval);
                });
                // Desconectar el observer después de animar
                sexypaceObserver.disconnect();
            }
        }, { threshold: 0.5 });
        
        sexypaceObserver.observe(sexypaceSection);
    }
    
    // Control del video de fondo del Hero
    const video = document.getElementById('heroVideo');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const muteBtn = document.getElementById('muteBtn');
    
    // Verificar que los elementos existen
    if (video && playPauseBtn && muteBtn) {
        
        // Control de reproducción/pausa
        playPauseBtn.addEventListener('click', function() {
            if (video.paused) {
                video.play();
                this.innerHTML = '<i class="fas fa-pause"></i>';
                this.title = 'Pausar';
            } else {
                video.pause();
                this.innerHTML = '<i class="fas fa-play"></i>';
                this.title = 'Reproducir';
            }
        });

        // Control de sonido
        muteBtn.addEventListener('click', function() {
            if (video.muted) {
                video.muted = false;
                this.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.title = 'Silenciar';
            } else {
                video.muted = true;
                this.innerHTML = '<i class="fas fa-volume-mute"></i>';
                this.title = 'Activar sonido';
            }
        });

        // Optimización: pausar cuando no está visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log('Error al reproducir video:', e));
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.25 });

        observer.observe(video);
    }

    // Inicializar el carrusel de Sexy Pace cuando la página esté completamente cargada
    window.addEventListener('load', initSexyPaceCarousel);

    // Inicializar el lightbox de la galería
    initializeLightbox();

    // Inicializar el gestor de cookies
    window.cookieManager = new CookieManager();
});

// Función para inicializar el carrusel Sexy Pace
function initSexyPaceCarousel() {
    console.log('🎠 Iniciando carrusel Sexy Pace...');
    
    const carousel = document.getElementById('sexyPaceCarousel');
    const slides = carousel ? carousel.querySelectorAll('.photo-slide') : [];
    const indicators = document.querySelectorAll('#sexyPaceIndicators .photo-dot');
    const prevBtn = document.getElementById('sexyPacePrev');
    const nextBtn = document.getElementById('sexyPaceNext');
    const container = document.querySelector('.photo-carousel-container');
    
    console.log('🔍 Elementos encontrados:');
    console.log('- Carousel:', !!carousel);
    console.log('- Slides:', slides.length);
    console.log('- Indicators:', indicators.length);
    console.log('- Prev button:', !!prevBtn);
    console.log('- Next button:', !!nextBtn);
    
    if (!carousel || slides.length === 0) {
        console.error('❌ Carrusel no encontrado o sin slides');
        return;
    }
    
    let currentIndex = 0;
    let autoplayInterval;
    let isTransitioning = false;
    
    // Asegurar que el primer slide esté activo
    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === 0);
    });
    
    indicators.forEach((dot, index) => {
        dot.classList.toggle('active', index === 0);
    });
    
    // Función para mostrar slide específico
    function showSlide(index, source = 'manual') {
        if (isTransitioning) {
            console.log('⏳ Transición en progreso, esperando...');
            return;
        }
        
        console.log(`📸 Mostrando slide ${index} (${source})`);
        
        // Validar índice
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        if (index === currentIndex) {
            console.log('📸 Ya está en el slide', index);
            return;
        }
        
        isTransitioning = true;
        const previousIndex = currentIndex;
        currentIndex = index;
        
        // Mover carrusel con transform
        const translateX = -currentIndex * 100;
        carousel.style.transform = `translateX(${translateX}%)`;
        carousel.style.transition = 'transform 0.5s ease-in-out';
        
        console.log(`🎬 Transform aplicado: translateX(${translateX}%)`);
        
        // Actualizar clases de slides
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentIndex);
        });
        
        // Actualizar indicadores
        indicators.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        
        console.log(`✅ Slide cambiado de ${previousIndex} a ${currentIndex}`);
        
        // Permitir siguiente transición
        setTimeout(() => {
            isTransitioning = false;
        }, 600);
        
        // Reiniciar autoplay solo si no es automático
        if (source !== 'auto') {
            resetAutoplay();
        }
    }
    
    // Funciones de navegación
    function nextSlide(source = 'manual') {
        console.log('➡️ Siguiente slide');
        showSlide(currentIndex + 1, source);
    }
    
    function prevSlide() {
        console.log('⬅️ Slide anterior');
        showSlide(currentIndex - 1);
    }
    
    // Autoplay
    function startAutoplay() {
        console.log('▶️ Iniciando autoplay (4 segundos)');
        autoplayInterval = setInterval(() => {
            nextSlide('auto');
        }, 4000);
    }
    
    function stopAutoplay() {
        if (autoplayInterval) {
            console.log('⏸️ Deteniendo autoplay');
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }
    
    function resetAutoplay() {
        stopAutoplay();
        setTimeout(startAutoplay, 1000); // Esperar 1 segundo antes de reiniciar
    }
    
    // Event listeners para botones usando delegación de eventos
    document.addEventListener('click', function(e) {
        if (e.target.matches('#sexyPacePrev')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Click en botón anterior');
            prevSlide();
        }
        
        if (e.target.matches('#sexyPaceNext')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Click en botón siguiente');
            nextSlide();
        }
        
        // Event listeners para indicadores
        if (e.target.matches('#sexyPaceIndicators .photo-dot')) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(e.target.getAttribute('data-index'));
            console.log(`🖱️ Click en indicador ${index}`);
            showSlide(index);
        }
    });
    
    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    let isSwiping = false;
    
    if (container) {
        container.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = true;
            console.log('👆 Touch start:', touchStartX);
        }, { passive: true });
        
        container.addEventListener('touchmove', function(e) {
            if (!isSwiping) return;
            
            // Opcional: Prevenir scroll mientras se hace swipe
            const touchCurrentX = e.changedTouches[0].screenX;
            const diffX = Math.abs(touchCurrentX - touchStartX);
            
            if (diffX > 30) {
                e.preventDefault();
            }
        }, { passive: false });
        
        container.addEventListener('touchend', function(e) {
            if (!isSwiping) return;
            
            touchEndX = e.changedTouches[0].screenX;
            isSwiping = false;
            
            console.log('👆 Touch end:', touchEndX);
            handleSwipe();
        }, { passive: true });
    }
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        console.log(`📱 Swipe distance: ${swipeDistance}`);
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                console.log('👉 Swipe derecha - anterior');
                prevSlide();
            } else {
                console.log('👈 Swipe izquierda - siguiente');
                nextSlide();
            }
        }
    }
    
    // Pausar autoplay en interacciones
    if (container) {
        container.addEventListener('mouseenter', function() {
            console.log('🖱️ Mouse enter - pausando autoplay');
            stopAutoplay();
        });
        
        container.addEventListener('mouseleave', function() {
            console.log('🖱️ Mouse leave - reanudando autoplay');
            startAutoplay();
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!container || !isElementInViewport(container)) return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextSlide();
        }
    });
    
    // Pausar cuando la pestaña no está activa
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopAutoplay();
        } else {
            startAutoplay();
        }
    });
    
    // Intersection Observer para autoplay
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('👁️ Carrusel visible - iniciando autoplay');
                setTimeout(startAutoplay, 1000);
            } else {
                console.log('👁️ Carrusel no visible - pausando autoplay');
                stopAutoplay();
            }
        });
    }, { threshold: 0.3 });
    
    if (container) {
        observer.observe(container);
    }
    
    // Precargar imágenes
    preloadSexyPaceImages();
    
    // Inicializar con el primer slide
    console.log('🚀 Inicializando carrusel en slide 0');
    showSlide(0, 'init');
    
    console.log('✅ Carrusel Sexy Pace inicializado correctamente');
}

// Función auxiliar para detectar si elemento está en viewport
function isElementInViewport(el) {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Precargar imágenes para mejor rendimiento
function preloadSexyPaceImages() {
    console.log('📥 Precargando imágenes del carrusel...');
    
    const imageUrls = [
        'img/sexy/1.jpeg',
        'img/sexy/2.jpeg',
        'img/sexy/3.jpeg'
    ];
    
    const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Imagen cargada: ${url}`);
                resolve(url);
            };
            img.onerror = () => {
                console.error(`❌ Error cargando imagen: ${url}`);
                reject(url);
            };
            img.src = url;
        });
    });
    
    Promise.allSettled(promises).then(results => {
        const loaded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`📊 Imágenes precargadas: ${loaded} éxito, ${failed} errores`);
    });
}

// Gestión de errores de imágenes
document.addEventListener('DOMContentLoaded', function() {
    const carouselImages = document.querySelectorAll('.photo-slide img');
    
    carouselImages.forEach((img, index) => {
        img.addEventListener('error', function() {
            console.error(`❌ Error cargando imagen ${index}:`, this.src);
            // Reemplazar con imagen placeholder
            this.src = `https://via.placeholder.com/400x250/ff6600/ffffff?text=Imagen+${index + 1}`;
            this.alt = 'Imagen no disponible';
        });
        
        img.addEventListener('load', function() {
            console.log(`✅ Imagen ${index} cargada correctamente`);
        });
    });
});

// Optimización de rendimiento para resize
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log('📐 Ventana redimensionada, ajustando carrusel...');
        const carousel = document.getElementById('sexyPaceCarousel');
        if (carousel) {
            const activeDot = document.querySelector('#sexyPaceIndicators .photo-dot.active');
            const currentIndex = activeDot ? parseInt(activeDot.getAttribute('data-index')) || 0 : 0;
            carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }, 250);
});

// FUNCIÓN MEJORADA PARA INICIALIZAR EL LIGHTBOX
class GalleryLightbox {
    constructor() {
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightboxImage');
        this.lightboxClose = document.getElementById('lightboxClose');
        this.lightboxPrev = document.getElementById('lightboxPrev');
        this.lightboxNext = document.getElementById('lightboxNext');
        this.lightboxCaption = document.getElementById('lightboxCaption');
        this.lightboxCounter = document.getElementById('lightboxCounter');
        this.lightboxLoading = document.getElementById('lightboxLoading');
        
        this.galleryItems = [];
        this.currentIndex = 0;
        this.isOpen = false;
        
        // Verificar que todos los elementos existen antes de inicializar
        if (this.lightbox && this.lightboxImage && this.lightboxClose) {
            this.init();
        } else {
            console.error('Elementos del lightbox no encontrados');
        }
    }
    
    init() {
        console.log('Inicializando lightbox...');
        
        // Recopilar todas las imágenes de la galería
        this.updateGalleryItems();
        
        // Event listeners
        this.setupEventListeners();
        
        console.log('Lightbox inicializado con', this.galleryItems.length, 'imágenes');
    }
    
    updateGalleryItems() {
        // Obtener todos los items de galería visibles
        const allItems = document.querySelectorAll('.gallery-item');
        console.log('Total gallery items encontrados:', allItems.length);
        
        const visibleItems = Array.from(allItems).filter(item => {
            const style = window.getComputedStyle(item);
            return style.display !== 'none';
        });
        
        console.log('Items visibles:', visibleItems.length);
        
        this.galleryItems = visibleItems.map((item, index) => {
            const img = item.querySelector('.gallery-img');
            const category = item.getAttribute('data-category');
            
            return {
                src: img.src,
                alt: img.alt || 'Imagen de galería',
                caption: this.generateCaption(img.alt, category),
                element: item,
                originalIndex: index
            };
        });
    }
    
    generateCaption(alt, category) {
        const categoryNames = {
            'training': 'Entrenamiento',
            'events': 'Eventos',
            'facility': 'Instalaciones',
            'sexy': 'Sexy Pace'
        };
        
        return `${alt || 'Imagen'} - ${categoryNames[category] || 'Galería'}`;
    }
    
    setupEventListeners() {
        // Click en imágenes de galería usando delegación de eventos
        document.addEventListener('click', (e) => {
            // Verificar si el click fue en una imagen de galería o su overlay
            const galleryItem = e.target.closest('.gallery-item');
            
            if (galleryItem) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Click en gallery item detectado');
                this.openLightbox(galleryItem);
            }
        });
        
        // Cerrar lightbox
        if (this.lightboxClose) {
            this.lightboxClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeLightbox();
            });
        }
        
        // Navegación
        if (this.lightboxPrev) {
            this.lightboxPrev.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevImage();
            });
        }
        
        if (this.lightboxNext) {
            this.lightboxNext.addEventListener('click', (e) => {
                e.preventDefault();
                this.nextImage();
            });
        }
        
        // Cerrar con click fuera de la imagen
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.prevImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
            }
        });
        
        // Touch/Swipe para móviles
        this.setupTouchEvents();
        
        // Actualizar items cuando cambie el filtro
        document.addEventListener('click', (e) => {
            if (e.target.matches('.gallery-filter button')) {
                // Esperar a que se aplique el filtro
                setTimeout(() => {
                    this.updateGalleryItems();
                    console.log('Items actualizados después del filtro');
                }, 300);
            }
        });
    }
    
    setupTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        this.lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, { passive: true });
    }
    
    handleSwipe(startX, endX) {
        const swipeThreshold = 50;
        const swipeDistance = endX - startX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                this.prevImage();
            } else {
                this.nextImage();
            }
        }
    }
    
    openLightbox(galleryItem) {
        console.log('Abriendo lightbox...');
        
        // Actualizar lista de items por si han cambiado los filtros
        this.updateGalleryItems();
        
        // Encontrar el índice del item clickeado
        this.currentIndex = this.galleryItems.findIndex(item => item.element === galleryItem);
        
        if (this.currentIndex === -1) {
            console.error('Item no encontrado en la galería');
            return;
        }
        
        console.log('Mostrando imagen índice:', this.currentIndex);
        
        this.isOpen = true;
        this.showLoading(true);
        
        // Mostrar lightbox
        this.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Cargar imagen
        this.loadImage(this.currentIndex);
    }
    
    loadImage(index) {
        if (index < 0 || index >= this.galleryItems.length) return;
        
        console.log('Cargando imagen:', index);
        this.showLoading(true);
        
        const item = this.galleryItems[index];
        const img = new Image();
        
        img.onload = () => {
            console.log('Imagen cargada correctamente');
            this.lightboxImage.src = item.src;
            this.lightboxImage.alt = item.alt;
            this.lightboxCaption.textContent = item.caption;
            this.updateCounter();
            this.showLoading(false);
        };
        
        img.onerror = () => {
            console.error('Error cargando imagen:', item.src);
            this.lightboxCaption.textContent = 'Error cargando imagen';
            this.showLoading(false);
        };
        
        img.src = item.src;
    }
    
    showLoading(show) {
        if (this.lightboxLoading) {
            this.lightboxLoading.style.display = show ? 'block' : 'none';
        }
        this.lightboxImage.style.opacity = show ? '0' : '1';
        if (this.lightboxCaption) {
            this.lightboxCaption.style.opacity = show ? '0' : '1';
        }
        if (this.lightboxCounter) {
            this.lightboxCounter.style.opacity = show ? '0' : '1';
        }
    }
    
    updateCounter() {
        if (!this.lightboxCounter) return;
        
        const current = this.currentIndex + 1;
        const total = this.galleryItems.length;
        this.lightboxCounter.textContent = `${current} / ${total}`;
        
        // Mostrar/ocultar navegación
        if (this.lightboxPrev) {
            this.lightboxPrev.style.opacity = this.currentIndex > 0 ? '1' : '0.3';
        }
        if (this.lightboxNext) {
            this.lightboxNext.style.opacity = this.currentIndex < total - 1 ? '1' : '0.3';
        }
    }
    
    nextImage() {
        if (this.currentIndex < this.galleryItems.length - 1) {
            this.currentIndex++;
            this.loadImage(this.currentIndex);
        }
    }
    
    prevImage() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.loadImage(this.currentIndex);
        }
    }
    
    closeLightbox() {
        console.log('Cerrando lightbox...');
        this.isOpen = false;
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
        
        // Limpiar imagen después de la transición
        setTimeout(() => {
            this.lightboxImage.src = '';
            if (this.lightboxCaption) this.lightboxCaption.textContent = '';
            if (this.lightboxCounter) this.lightboxCounter.textContent = '';
        }, 300);
    }
}

// Función para inicializar el lightbox
function initializeLightbox() {
    // Verificar que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => new GalleryLightbox(), 1000);
        });
    } else {
        // DOM ya está cargado
        setTimeout(() => new GalleryLightbox(), 1000);
    }
}

// Gestor de Cookies
class CookieManager {
    constructor() {
        this.cookieSettings = {
            technical: true, // Siempre true, no se puede desactivar
            analytics: false,
            marketing: false,
            social: false
        };
        
        this.init();
    }
    
    init() {
        // Verificar si ya hay consentimiento guardado
        const savedSettings = this.getCookieSettings();
        
        if (!savedSettings) {
            // Mostrar banner si no hay configuración guardada
            setTimeout(() => {
                this.showBanner();
            }, 1000);
        } else {
            // Aplicar configuración guardada
            this.cookieSettings = savedSettings;
            this.applyCookieSettings();
            this.showFloatingButton();
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Botones del banner
        document.getElementById('acceptAllCookies')?.addEventListener('click', () => {
            this.acceptAllCookies();
        });
        
        document.getElementById('configureCookies')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        
        document.getElementById('rejectCookies')?.addEventListener('click', () => {
            this.rejectCookies();
        });
        
        // Modal de configuración
        document.getElementById('closeCookieModal')?.addEventListener('click', () => {
            this.hideConfigModal();
        });
        
        document.getElementById('savePreferences')?.addEventListener('click', () => {
            this.savePreferences();
        });
        
        document.getElementById('acceptAllModal')?.addEventListener('click', () => {
            this.acceptAllFromModal();
        });
        
        // Botón flotante
        document.getElementById('openCookieSettings')?.addEventListener('click', () => {
            this.showConfigModal();
        });
        
        // Cerrar modal al hacer click fuera
        document.getElementById('cookieModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'cookieModal') {
                this.hideConfigModal();
            }
        });
    }
    
    showBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.add('show');
        }
    }
    
    hideBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }
    
    showConfigModal() {
        const modal = document.getElementById('cookieModal');
        if (modal) {
            // Actualizar checkboxes con configuración actual
            document.getElementById('analyticsCookies').checked = this.cookieSettings.analytics;
            document.getElementById('marketingCookies').checked = this.cookieSettings.marketing;
            document.getElementById('socialCookies').checked = this.cookieSettings.social;
            
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideConfigModal() {
        const modal = document.getElementById('cookieModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
    
    acceptAllCookies() {
        this.cookieSettings = {
            technical: true,
            analytics: true,
            marketing: true,
            social: true
        };
        
        this.saveCookieSettings();
        this.applyCookieSettings();
        this.hideBanner();
        this.showFloatingButton();
        
        console.log('✅ Todas las cookies aceptadas');
    }
    
    rejectCookies() {
        this.cookieSettings = {
            technical: true, // Las técnicas siempre están activas
            analytics: false,
            marketing: false,
            social: false
        };
        
        this.saveCookieSettings();
        this.applyCookieSettings();
        this.hideBanner();
        this.showFloatingButton();
        
        console.log('❌ Cookies no esenciales rechazadas');
    }
    
    savePreferences() {
        this.cookieSettings = {
            technical: true,
            analytics: document.getElementById('analyticsCookies').checked,
            marketing: document.getElementById('marketingCookies').checked,
            social: document.getElementById('socialCookies').checked
        };
        
        this.saveCookieSettings();
        this.applyCookieSettings();
        this.hideConfigModal();
        this.hideBanner();
        this.showFloatingButton();
        
        console.log('💾 Preferencias guardadas:', this.cookieSettings);
    }
    
    acceptAllFromModal() {
        // Marcar todos los checkboxes
        document.getElementById('analyticsCookies').checked = true;
        document.getElementById('marketingCookies').checked = true;
        document.getElementById('socialCookies').checked = true;
        
        this.acceptAllCookies();
        this.hideConfigModal();
    }
    
    applyCookieSettings() {
        // Aplicar configuración de Google Analytics
        if (this.cookieSettings.analytics) {
            this.enableGoogleAnalytics();
        } else {
            this.disableGoogleAnalytics();
        }
        
        // Aplicar configuración de marketing
        if (this.cookieSettings.marketing) {
            this.enableMarketingCookies();
        } else {
            this.disableMarketingCookies();
        }
        
        // Aplicar configuración de redes sociales
        if (this.cookieSettings.social) {
            this.enableSocialCookies();
        } else {
            this.disableSocialCookies();
        }
        
        console.log('🔧 Configuración de cookies aplicada:', this.cookieSettings);
    }
    
    enableGoogleAnalytics() {
        // Implementar Google Analytics si es necesario
        console.log('📊 Google Analytics habilitado');
        
        // Ejemplo de implementación:
        /*
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        
        ga('create', 'TU_ID_DE_GOOGLE_ANALYTICS', 'auto');
        ga('send', 'pageview');
        */
    }
    
    disableGoogleAnalytics() {
        console.log('🚫 Google Analytics deshabilitado');
        // Implementar deshabilitación de GA
    }
    
    enableMarketingCookies() {
        console.log('📢 Cookies de marketing habilitadas');
        // Implementar cookies de marketing/remarketing
    }
    
    disableMarketingCookies() {
        console.log('🚫 Cookies de marketing deshabilitadas');
        // Limpiar cookies de marketing
    }
    
    enableSocialCookies() {
        console.log('👥 Cookies de redes sociales habilitadas');
        // Implementar widgets sociales
    }
    
    disableSocialCookies() {
        console.log('🚫 Cookies de redes sociales deshabilitadas');
        // Deshabilitar widgets sociales
    }
    
    saveCookieSettings() {
        const settings = {
            ...this.cookieSettings,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        localStorage.setItem('imperiumCookieSettings', JSON.stringify(settings));
    }
    
    getCookieSettings() {
        try {
            const settings = localStorage.getItem('imperiumCookieSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                
                // Verificar si la configuración no es muy antigua (30 días)
                const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días en millisegundos
                if (Date.now() - parsed.timestamp < maxAge) {
                    return {
                        technical: parsed.technical,
                        analytics: parsed.analytics,
                        marketing: parsed.marketing,
                        social: parsed.social
                    };
                }
            }
        } catch (error) {
            console.error('Error al obtener configuración de cookies:', error);
        }
        
        return null;
    }
    
    showFloatingButton() {
        const floatingBtn = document.getElementById('cookieFloatingBtn');
        if (floatingBtn) {
            setTimeout(() => {
                floatingBtn.style.display = 'block';
            }, 1000);
        }
    }
    
    // Método público para resetear configuración (útil para desarrollo)
    resetCookieSettings() {
        localStorage.removeItem('imperiumCookieSettings');
        location.reload();
    }
}