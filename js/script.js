(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const year = document.querySelector("#year");
  const sections = [...document.querySelectorAll("section[id]")];
  const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  const reveals = document.querySelectorAll(".reveal");

  document.querySelectorAll(".hero .reveal").forEach((el) => {
    el.classList.add("is-visible");
  });

  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  const setActiveNav = () => {
    const y = window.scrollY + 100;
    let current = "";
    sections.forEach((section) => {
      if (section.offsetTop <= y) {
        current = section.id;
      }
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.slice(1);
      if (id === current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  setActiveNav();
  window.addEventListener("scroll", setActiveNav, { passive: true });

  const smoothScrollTo = (top) => {
    window.scrollTo({
      top,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  document.querySelectorAll("[data-scroll-top]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      history.pushState(null, "", "#top");
      smoothScrollTo(0);
      const topEl = document.getElementById("top");
      if (topEl) topEl.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.hasAttribute("data-scroll-top")) return;
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      const headerOffset = header ? header.offsetHeight + 12 : 84;
      const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerOffset);
      history.pushState(null, "", href);
      smoothScrollTo(top);
    });
  });

  const cases = [...document.querySelectorAll(".case")];

  const getPanel = (item) => item.querySelector(".case-panel");

  const setOpenState = (item, open) => {
    item.classList.toggle("is-open", open);
    item.open = open;
  };

  const animateOpen = (item) => {
    const panel = getPanel(item);
    if (!panel) {
      setOpenState(item, true);
      return;
    }

    setOpenState(item, true);
    if (reduceMotion) {
      panel.style.height = "auto";
      return;
    }

    panel.style.height = "0px";
    panel.style.opacity = "1";
    const target = panel.scrollHeight;
    requestAnimationFrame(() => {
      panel.style.height = `${target}px`;
    });

    const onEnd = (event) => {
      if (event.propertyName !== "height") return;
      panel.style.height = "auto";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  };

  const animateClose = (item) => {
    const panel = getPanel(item);
    if (!panel) {
      setOpenState(item, false);
      return Promise.resolve();
    }

    if (reduceMotion) {
      setOpenState(item, false);
      panel.style.height = "0px";
      return Promise.resolve();
    }

    const current = panel.scrollHeight;
    panel.style.height = `${current}px`;
    // Force reflow before collapsing
    panel.getBoundingClientRect();
    item.classList.remove("is-open");

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        panel.style.height = "0px";
      });

      const onEnd = (event) => {
        if (event.propertyName !== "height") return;
        setOpenState(item, false);
        panel.removeEventListener("transitionend", onEnd);
        resolve();
      };
      panel.addEventListener("transitionend", onEnd);
    });
  };

  cases.forEach((item) => {
    const panel = getPanel(item);
    const summary = item.querySelector("summary");
    if (!panel || !summary) return;

    if (item.open) {
      item.classList.add("is-open");
      panel.style.height = "auto";
    } else {
      item.classList.remove("is-open");
      panel.style.height = "0px";
    }

    summary.addEventListener("click", (event) => {
      event.preventDefault();

      if (item.open || item.classList.contains("is-open")) {
        animateClose(item);
        return;
      }

      const closers = cases
        .filter((other) => other !== item && (other.open || other.classList.contains("is-open")))
        .map((other) => animateClose(other));

      Promise.all(closers).then(() => animateOpen(item));
    });
  });
})();
