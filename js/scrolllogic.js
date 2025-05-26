// scrolllogic.js - Navegación entre secciones con aceleración/desaceleración
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar la barra de scroll
    const style = document.createElement('style');
    style.textContent = `
        html::-webkit-scrollbar, body::-webkit-scrollbar {
            width: 0;
            display: none;
        }
        html, body {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
    `;
    document.head.appendChild(style);
    
    // Obtener secciones de la página
    const sections = [
        document.querySelector('.landing-video-section'),
        document.querySelector('.hero'),
        document.getElementById('solutions'),
        document.querySelector('.latest-work'),
        document.getElementById('team'),
        document.getElementById('contact')
    ].filter(Boolean);
    
    if (sections.length === 0) {
        console.error("No se encontraron secciones");
        return;
    }
    
    // Variables de control
    let currentSectionIndex = 0;
    let isScrolling = false;
    let scrollTimeout;
    let lastScrollTime = 0;
    let animationFrame = null;
    const scrollCooldown = 100; // ms entre scrolls permitidos
    
    // Funciones de aceleración/desaceleración
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Función para cancelar cualquier animación actual
    function cancelCurrentAnimation() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }
    
    // Función para resetear el estado de scroll
    function resetScrollState() {
        isScrolling = false;
        cancelCurrentAnimation();
    }
    
    // Función de scroll con animación personalizada
    function scrollToSection(index) {
        // Validar el índice
        if (index < 0 || index >= sections.length) {
            return false;
        }
        
        // Cancelar cualquier animación en curso
        cancelCurrentAnimation();
        
        // Actualizar índice actual y marcar como scrolling
        currentSectionIndex = index;
        isScrolling = true;
        
        // Posiciones de inicio y destino
        const startPosition = window.pageYOffset;
        const targetPosition = sections[index].offsetTop;
        const distance = targetPosition - startPosition;
        
        // Si ya estamos en esa posición, no hacer nada
        if (Math.abs(distance) < 10) {
            resetScrollState();
            return true;
        }
        
        // Parámetros de la animación
        const duration = 800; // ms
        let startTime = null;
        
        // Función de animación frame por frame
        function animateScroll(currentTime) {
            if (!startTime) startTime = currentTime;
            
            // Calcular progreso de la animación
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);
            
            // Aplicar scroll
            window.scrollTo(0, startPosition + distance * easedProgress);
            
            // Continuar animación o terminar
            if (progress < 1) {
                animationFrame = requestAnimationFrame(animateScroll);
            } else {
                // Asegurar que se llegue exactamente al destino
                window.scrollTo(0, targetPosition);
                
                // Restablecer el estado para permitir nuevos scrolls
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(function() {
                    resetScrollState();
                }, 50);
            }
        }
        
        // Iniciar animación
        animationFrame = requestAnimationFrame(animateScroll);
        return true;
    }
    
    // Detectar eventos de rueda y prevenir scroll nativo
    function handleWheel(event) {
        // Verificar si estamos en período de enfriamiento
        const now = Date.now();
        if (now - lastScrollTime < scrollCooldown) {
            event.preventDefault();
            return;
        }
        
        // Prevenir scroll nativo
        event.preventDefault();
        
        // Si estamos en medio de una animación, ignorar
        if (isScrolling) return;
        
        // Actualizar tiempo del último scroll
        lastScrollTime = now;
        
        // Determinar dirección y sección objetivo
        const direction = event.deltaY > 0 ? 1 : -1;
        const targetIndex = currentSectionIndex + direction;
        
        // Verificar si el índice es válido
        if (targetIndex >= 0 && targetIndex < sections.length) {
            scrollToSection(targetIndex);
        }
    }
    
    // Manejar teclas de flecha
    function handleKeyDown(event) {
        if (isScrolling) return;
        
        if (event.key === 'ArrowDown' || event.key === 'PageDown') {
            if (currentSectionIndex < sections.length - 1) {
                event.preventDefault();
                scrollToSection(currentSectionIndex + 1);
            }
        } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
            if (currentSectionIndex > 0) {
                event.preventDefault();
                scrollToSection(currentSectionIndex - 1);
            }
        }
    }
    
    // Función para determinar la sección actual basada en la posición de scroll
    function updateCurrentSection() {
        if (isScrolling) return;
        
        const currentScroll = window.pageYOffset;
        
        // Encontrar la sección activa actual
        for (let i = sections.length - 1; i >= 0; i--) {
            if (currentScroll >= sections[i].offsetTop - 100) {
                currentSectionIndex = i;
                break;
            }
        }
    }
    
    // Función para emergencia: resetear todo si algo se traba
    function emergencyReset() {
        resetScrollState();
        
        // Mover a la sección actual sin animación
        const targetPosition = sections[currentSectionIndex].offsetTop;
        window.scrollTo(0, targetPosition);
        
        console.log("Scroll reseteado de emergencia");
    }
    
    // Inicializar en la primera sección
    function initialize() {
        // Posicionar al inicio
        window.scrollTo(0, 0);
        currentSectionIndex = 0;
        
        // Detectar cambios de scroll nativo
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateCurrentSection, 100);
        });
        
        // Registrar eventos para wheel
        window.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('wheel', handleWheel, { passive: false });
        
        // Teclas
        document.addEventListener('keydown', handleKeyDown);
        
        // Doble clic para reset de emergencia
        document.addEventListener('dblclick', emergencyReset);
        
        // Registrar eventos para enlaces de navegación
        document.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.target.hash) {
                const targetId = e.target.hash.substring(1);
                
                for (let i = 0; i < sections.length; i++) {
                    if (sections[i].id === targetId || 
                        sections[i].classList.contains(targetId)) {
                        e.preventDefault();
                        scrollToSection(i);
                        break;
                    }
                }
            }
        });
    }
    
    // Exponer API con funciones reseteo
    window.scrollLogic = {
        goToSection: scrollToSection,
        getCurrentSection: function() { return currentSectionIndex; },
        next: function() { return scrollToSection(currentSectionIndex + 1); },
        prev: function() { return scrollToSection(currentSectionIndex - 1); },
        reset: emergencyReset
    };
    
    // Iniciar
    initialize();
});