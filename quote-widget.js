(function () {
  const phone = "51982344940";
  const text = encodeURIComponent("Hola VOL-TEC, quisiera cotizar un proyecto.");
  const href = `https://wa.me/${phone}?text=${text}`;

  const css = `
    .vtcw-link{
      position:fixed;
      right:20px;
      bottom:20px;
      z-index:9999;
      display:inline-flex;
      align-items:center;
      gap:10px;
      min-height:48px;
      padding:12px 18px;
      border-radius:999px;
      background:#25d366;
      color:#061115;
      font:700 14px/1.1 Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;
      text-decoration:none;
      box-shadow:0 12px 30px rgba(0,0,0,.35);
      -webkit-tap-highlight-color:transparent;
    }
    .vtcw-link:hover{ filter:brightness(1.04); }
    .vtcw-link:focus-visible{ outline:3px solid rgba(37,211,102,.35); outline-offset:3px; }
    .vtcw-link svg{ width:20px; height:20px; flex:0 0 auto; }
    @media (max-width:768px){
      .vtcw-link{
        right:14px;
        bottom:calc(14px + env(safe-area-inset-bottom));
        padding:12px 14px;
      }
      .vtcw-link span{ display:none; }
    }
  `;

  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  const link = document.createElement("a");
  link.className = "vtcw-link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Cotizar por WhatsApp");
  link.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.49 0 .14 5.35.14 11.94c0 2.1.55 4.16 1.6 5.97L.04 24l6.24-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.58 0 11.94-5.35 11.94-11.94 0-3.19-1.25-6.19-3.51-8.42ZM12.09 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.7.97.99-3.61-.23-.37a9.84 9.84 0 0 1-1.51-5.26c0-5.44 4.43-9.87 9.88-9.87a9.8 9.8 0 0 1 6.98 2.9 9.81 9.81 0 0 1 2.89 6.97c0 5.44-4.43 9.86-9.9 9.86Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47a8.92 8.92 0 0 1-1.65-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/>
    </svg>
    <span>Cotizar por WhatsApp</span>
  `;
  document.body.appendChild(link);
})();
