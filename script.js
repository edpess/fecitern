/* ============================================================
   FECITERN — interações e comportamentos
   (JavaScript puro, sem dependências)
   ============================================================ */
(function () {
  "use strict";

  /* ==========================================================
     1. NAVBAR — sombra ao rolar
     ========================================================== */
  const navbar = document.getElementById("navbar");
  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     2. MENU MOBILE (hambúrguer -> X)
     ========================================================== */
  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });

    // fecha o menu ao clicar num link
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );

    // dropdown "Oficinas" no mobile (accordion)
    const dropBtn = navLinks.querySelector(".nav__link--btn");
    if (dropBtn) {
      dropBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const item = dropBtn.closest(".nav__item");
        item.classList.toggle("open");
        dropBtn.setAttribute("aria-expanded", item.classList.contains("open"));
      });
    }
  }

  /* ==========================================================
     3. SCROLL REVEAL (fade-in + subida, com stagger via --delay)
     ========================================================== */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ==========================================================
     4. SCROLL SPY (link ativo conforme a seção visível)
     ========================================================== */
  const sections = document.querySelectorAll("main section[id]");
  const spyLinks = document.querySelectorAll('.nav__link[href^="#"]');
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            spyLinks.forEach((l) => {
              l.classList.toggle("active", l.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ==========================================================
     5. MÁSCARA DE TELEFONE BRASILEIRA — (11) 99999-9999
     ========================================================== */
  const telefone = document.getElementById("telefone");
  if (telefone) {
    telefone.addEventListener("input", () => {
      let v = telefone.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 10) {
        v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
      } else if (v.length > 6) {
        v = "(" + v.slice(0, 2) + ") " + v.slice(2, 6) + "-" + v.slice(6);
      } else if (v.length > 2) {
        v = "(" + v.slice(0, 2) + ") " + v.slice(2);
      } else if (v.length > 0) {
        v = "(" + v;
      }
      telefone.value = v;
    });
  }

  /* ==========================================================
     6. FORMULÁRIO — validação em tempo real (blur) + envio
     ========================================================== */
  const form = document.getElementById("contact-form");
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modal-text");

  const validators = {
    nome: (v) => (v.trim().length >= 2 ? "" : "Informe seu nome completo."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Informe um e-mail válido."),
    telefone: (v) => {
      if (!v.trim()) return "";
      const digits = v.replace(/\D/g, "");
      return digits.length >= 10 ? "" : "Telefone incompleto.";
    },
    interesse: (v) => (v ? "" : "Selecione uma opção."),
    mensagem: (v) => (v.trim().length >= 5 ? "" : "Escreva uma mensagem com pelo menos 5 caracteres.")
  };

  function validateField(field) {
    const input = field.querySelector("input, select, textarea");
    if (!input || !validators[input.id]) return true;
    const msg = validators[input.id](input.value);
    const errorEl = field.querySelector(".field__error");
    field.classList.toggle("invalid", Boolean(msg));
    if (errorEl) errorEl.textContent = msg;
    return !msg;
  }

  if (form) {
    // validação em tempo real no blur
    form.querySelectorAll(".field").forEach((field) => {
      const input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", () => validateField(field));
      input.addEventListener("input", () => {
        if (field.classList.contains("invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // valida todos os campos antes de enviar
      let valid = true;
      form.querySelectorAll(".field").forEach((field) => {
        if (!validateField(field)) valid = false;
      });
      if (!valid) {
        const firstInvalid = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const submitBtn = document.getElementById("submit-btn");
      const original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Enviando…';

      try {
        // Envio via Formspree (funciona em hospedagem estática, sem backend).
        // Substitua "SEU_ID" no atributo action do <form> pelo seu ID.
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          form.reset();
          modalText.textContent = "Recebemos o seu contato. Em breve a equipe da FECITERN responderá.";
        } else {
          throw new Error("Falha no envio");
        }
      } catch (err) {
        // Fallback: se o Formspree ainda não estiver configurado (ID "SEU_ID"),
        // informa o usuário sem perder a experiência de confirmação.
        modalText.textContent =
          "Não foi possível concluir o envio agora. Tente novamente ou fale conosco pelas redes sociais.";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
        showModal();
      }
    });
  }

  /* ==========================================================
     7. MODAL DE CONFIRMAÇÃO
     ========================================================== */
  function showModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function hideModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  if (modal) {
    modal.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", hideModal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) hideModal();
    });
  }

  /* ==========================================================
     8. SMOOTH SCROLL (respeita o offset do header fixo via CSS
     scroll-padding-top)
     ========================================================== */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return; // placeholder (ex.: edital ainda sem PDF)
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ==========================================================
     9. ANIMAÇÃO DOS NÚMEROS (CONTADOR)
     ========================================================== */
  const contadores = document.querySelectorAll('.stat__num');
  const velocidade = 100;

  const animarNumeros = (contador) => {
    const atualizarContagem = () => {
      const alvo = +contador.getAttribute('data-target');
      const contagemAtual = +contador.innerText;
      const incremento = alvo / velocidade;

      if (contagemAtual < alvo) {
        contador.innerText = Math.ceil(contagemAtual + incremento);
        setTimeout(atualizarContagem, 15);
      } else {
        contador.innerText = alvo;
      }
    };
    atualizarContagem();
  };

  // Usa o IntersectionObserver igual você já usou no Scroll Reveal
  if ("IntersectionObserver" in window) {
    const observerNumeros = new IntersectionObserver((entradas, observador) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          animarNumeros(entrada.target);
          observador.unobserve(entrada.target);
        }
      });
    }, {
      threshold: 0.5
    });

    contadores.forEach(contador => {
      observerNumeros.observe(contador);
    });
  }

})();
