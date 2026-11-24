
"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // Ano automático
  const ano = document.getElementById("ano");

  if (ano) {
    ano.textContent = new Date().getFullYear();
  }

  // Menu mobile
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {

    function fecharMenu() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    }

    toggle.addEventListener("click", () => {
      const aberto = nav.classList.toggle("is-open");

      toggle.setAttribute("aria-expanded", String(aberto));
      toggle.setAttribute(
        "aria-label",
        aberto ? "Fechar menu" : "Abrir menu"
      );
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", fecharMenu);
    });

    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape") {
        const estavaAberto = nav.classList.contains("is-open");
        fecharMenu();

        if (estavaAberto) toggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) fecharMenu();
    });
  }

  // Sombra do cabeçalho
  const header = document.querySelector(".site-header");

  if (header) {
    window.addEventListener("scroll", () => {
      header.style.boxShadow = window.scrollY > 12
        ? "0 4px 18px rgba(10,37,64,.25)"
        : "none";
    }, { passive: true });
  }

  // Animações de entrada
  const elementos = document.querySelectorAll(".fade-in");

  const movimentoReduzido = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (
    "IntersectionObserver" in window &&
    elementos.length &&
    !movimentoReduzido
  ) {
    const observer = new IntersectionObserver(entradas => {

      entradas.forEach(entrada => {

        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visible");
          observer.unobserve(entrada.target);
        }

      });

    }, { threshold: 0.1 });

    document.documentElement.classList.add("js-reveal");

    elementos.forEach(elemento => {
      observer.observe(elemento);
    });
  }

});

