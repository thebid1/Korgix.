document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  // Nav background on scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // Hero entrance
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero-title', { y: 40, opacity: 0, duration: 0.9 }, 0.2)
    .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8 }, 0.4)
    .from('.hero-buttons', { y: 20, opacity: 0, duration: 0.6 }, 0.6)
    .from('.hero-stats', { y: 20, opacity: 0, duration: 0.6 }, 0.75)
    .from('.badge', { scale: 0.9, opacity: 0, duration: 0.5 }, 0.1)
    .from('.hero-phone', { y: 60, opacity: 0, rotateX: 10, duration: 1.2 }, 0.3);

  // Floating hero phone
  gsap.to('.hero-phone', {
    y: -16,
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });

  // Animated counters
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.count, 10);
    gsap.to(counter, {
      innerText: target,
      duration: 2,
      ease: 'power2.out',
      snap: { innerText: 1 },
      scrollTrigger: {
        trigger: counter,
        start: 'top 85%',
        once: true
      },
      onUpdate: function () {
        counter.innerText = Math.round(this.targets()[0].innerText);
      }
    });
  });

  // Feature cards stagger reveal
  gsap.from('.feature-card', {
    y: 40,
    opacity: 0,
    duration: 0.7,
    stagger: 0.12,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.feature-grid',
      start: 'top 80%',
      once: true
    }
  });

  // Section headers reveal
  document.querySelectorAll('.section-header').forEach(header => {
    gsap.from(header.children, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: header,
        start: 'top 80%',
        once: true
      }
    });
  });

  // Walkthrough phone screen transitions
  const screens = document.querySelectorAll('.walkthrough-screen');
  const steps = document.querySelectorAll('.walkthrough-step');

  steps.forEach((step, index) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => switchScreen(index),
      onEnterBack: () => switchScreen(index)
    });

    gsap.from(step, {
      x: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: step,
        start: 'top 80%',
        once: true
      }
    });
  });

  function switchScreen(index) {
    screens.forEach((screen, i) => {
      if (i === index) {
        gsap.fromTo(screen,
          { opacity: 0, scale: 0.96, display: 'flex' },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
        );
      } else {
        gsap.to(screen, {
          opacity: 0,
          scale: 1.02,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => { screen.style.display = 'none'; }
        });
      }
    });
  }

  // How it works steps
  gsap.from('.step-card', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'back.out(1.2)',
    scrollTrigger: {
      trigger: '.steps-grid',
      start: 'top 80%',
      once: true
    }
  });

  // CTA reveal
  gsap.from('.cta-content', {
    y: 50,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.cta-section',
      start: 'top 70%',
      once: true
    }
  });

  // Parallax orbs in hero
  gsap.to('.orb-1', {
    y: 80,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });

  gsap.to('.orb-2', {
    y: -60,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1
    }
  });
});
