(function () {
  const CFG = Object.assign({
    scriptUrl: "",
    token: "",
    accent: "#00e0b8",
    brand: "VOL-TEC Arquitectos",
  }, window.VTC_QUOTE_CONFIG || {});

  if (!CFG.scriptUrl || !CFG.token) {
    console.error("[VTC-Quote] Falta scriptUrl o token en VTC_QUOTE_CONFIG");
  }

  // ====== Estilos ======
  const css = `:root{--vtcq-accent:${CFG.accent}} .vtcq-fab{position:fixed;right:20px;bottom:20px;z-index:9999;border:none;border-radius:999px;padding:14px 18px;background:var(--vtcq-accent);color:#061115;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;gap:10px}
  .vtcq-fab svg{width:18px;height:18px}
  .vtcq-panel{position:fixed;right:20px;bottom:84px;width:360px;max-width:92vw;background:#161a22;border:1px solid #232a35;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.35);overflow:hidden;display:none;z-index:9998;color:#e8edf2;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
  .vtcq-panel.open{display:block}
  .vtcq-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #232a35}
  .vtcq-title{font-size:15px;font-weight:700;letter-spacing:.2px}
  .vtcq-sub{font-size:12px;color:#9aa4b2}
  .vtcq-close{background:transparent;border:none;color:#9aa4b2;cursor:pointer}
  .vtcq-form{padding:14px 16px;display:grid;gap:10px}
  .vtcq-form label{font-size:12px;color:#9aa4b2}
  .vtcq-form input,.vtcq-form select,.vtcq-form textarea{width:100%;padding:10px 11px;border-radius:12px;border:1px solid #2a3240;background:#0f141b;color:#e8edf2}
  .vtcq-form textarea{min-height:84px;resize:vertical}
  .vtcq-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .vtcq-actions{display:flex;gap:8px;margin-top:2px}
  .vtcq-btn{flex:1;border:none;border-radius:12px;padding:12px 14px;font-weight:700;cursor:pointer}
  .vtcq-btn.primary{background:var(--vtcq-accent);color:#041416}
  .vtcq-btn.ghost{background:#0f141b;border:1px solid #233042;color:#e8edf2}
  .vtcq-note{font-size:11px;color:#9aa4b2;margin:-2px 0 4px}
  .vtcq-msg{margin:8px 16px 14px;font-size:12px;display:none}
  .vtcq-msg.show{display:block}
  .vtcq-msg.ok{color:#a7ffd6}
  .vtcq-msg.err{color:#ff5c5c}
  .vtcq-badge{display:inline-flex;gap:6px;align-items:center;font-size:11px;color:#7cebd9;background:#072a26;border:1px solid #0a3b35;padding:4px 8px;border-radius:999px}`;
  const styleTag = document.createElement('style');
  styleTag.textContent = css; document.head.appendChild(styleTag);

  // ====== HTML ======
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button class="vtcq-fab" id="vtcqFab" aria-controls="vtcqPanel" aria-expanded="false" title="Cotizar con ${CFG.brand}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Cotizar proyecto
    </button>
    <section class="vtcq-panel" id="vtcqPanel" role="dialog" aria-labelledby="vtcqTitle" aria-modal="true">
      <div class="vtcq-header">
        <div>
          <div class="vtcq-title" id="vtcqTitle">Generar Cotización</div>
          <div class="vtcq-sub">${CFG.brand}</div>
        </div>
        <button class="vtcq-close" id="vtcqClose" aria-label="Cerrar">✕</button>
      </div>
      <form class="vtcq-form" id="vtcqForm" novalidate>
        <div class="vtcq-row">
          <div>
            <label>Nombre y apellido *</label>
            <input name="client_name" autocomplete="name" required placeholder="Tu nombre" />
          </div>
          <div>
            <label>Correo *</label>
            <input name="client_email" type="email" autocomplete="email" required placeholder="tucorreo@dominio.com" />
          </div>
        </div>
        <div class="vtcq-row">
          <div>
            <label>Teléfono</label>
            <input name="client_phone" inputmode="tel" placeholder="Opcional" />
          </div>
          <div>
            <label>Tipo de proyecto *</label>
            <select name="project_type" required>
              <option value="" disabled selected>Selecciona…</option>
              <option>Arquitectura Residencial</option>
              <option>Arquitectura Comercial</option>
              <option>Renderizado / Visualización</option>
              <option>Levantamiento 3D / Escáner</option>
              <option>Consultoría / Expedientes</option>
            </select>
          </div>
        </div>
        <div>
          <label>Alcance y detalles *</label>
          <textarea name="project_scope" placeholder="Área (m²), ubicación, plazos, etc." required></textarea>
        </div>
        <div class="vtcq-row">
          <div>
            <label>Monto estimado (S/)</label>
            <input name="budget_peru_pen" type="number" min="0" step="0.01" placeholder="Opcional" />
          </div>
          <div>
            <label>Urgencia</label>
            <select name="urgency">
              <option>Normal (7–10 días)</option>
              <option>Rápido (3–5 días)</option>
              <option>Express (48–72 h)</option>
            </select>
          </div>
        </div>
        <!-- Honeypot anti-spam -->
        <input type="text" name="empresa" id="vtcqHp" style="display:none" tabindex="-1" autocomplete="off" />
        <div class="vtcq-note">Los datos se registrarán en nuestro sistema.</div>
        <div class="vtcq-actions">
          <button type="button" class="vtcq-btn ghost" id="vtcqClear">Limpiar</button>
          <button type="submit" class="vtcq-btn primary" id="vtcqSubmit">Enviar</button>
        </div>
      </form>
      <div class="vtcq-msg" id="vtcqMsg"></div>
    </section>`;
  document.body.appendChild(wrapper);

  // ====== Lógica ======
  const $ = (sel, root=document) => root.querySelector(sel);
  const panel = $('#vtcqPanel'), fab = $('#vtcqFab'), closeBtn = $('#vtcqClose');
  const form = $('#vtcqForm'), msg = $('#vtcqMsg');

  function showMsg(text, ok=false){ msg.textContent = text; msg.className = 'vtcq-msg show ' + (ok?'ok':'err'); }
  function toggle(){ const open = !panel.classList.contains('open'); panel.classList.toggle('open', open); fab.setAttribute('aria-expanded', String(open)); if(open) msg.className='vtcq-msg'; }

  fab.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);
  $('#vtcqClear').addEventListener('click', ()=>{ form.reset(); msg.className='vtcq-msg'; });

  function validate(){
    const req = ['client_name','client_email','project_type','project_scope'];
    for(const name of req){
      const el = form.elements[name];
      if(!el || !el.value || (el.tagName==='SELECT' && !el.value)){ el && el.focus(); showMsg('Completa los campos obligatorios (*)'); return false; }
    }
    const email = form.elements['client_email'].value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showMsg('Ingresa un correo válido'); return false; }
    if(document.getElementById('vtcqHp').value.trim()!==''){ showMsg('Validación fallida.'); return false; } // honeypot
    return true;
  }

  function buildPayload(){
    const d = Object.fromEntries(new FormData(form).entries());
    // Mapeo al backend (Apps Script) que espera estos nombres:
    return {
      token: CFG.token,
      nombre: d.client_name?.trim(),
      email: d.client_email?.trim(),
      telefono: d.client_phone?.trim() || '',
      servicio: [d.project_type, d.urgency ? `(${d.urgency})` : ''].filter(Boolean).join(' '),
      area_m2: '',                  // no se pide aquí
      distrito: '',                 // no se pide aquí
      presupuesto: d.budget_peru_pen?.trim() || '',
      mensaje: d.project_scope?.trim(),
      url_referencias: ''           // no se pide aquí
    };
  }

  async function postToSheet(payload){
    const res = await fetch(CFG.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    let data = {};
    try { data = await res.json(); } catch { /* ignore */ }
    if (!res.ok || !data.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  }

  function downloadBackup(obj){
    const ts = new Date().toISOString().replaceAll(':','-');
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cotizacion_volestudio_${ts}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault(); if(!validate()) return;
    const btn = $('#vtcqSubmit'); btn.disabled = true; btn.textContent = 'Enviando…'; msg.className='vtcq-msg';
    try{
      const payload = buildPayload();
      await postToSheet(payload);
      showMsg('¡Listo! Tus datos fueron registrados.', true);
      form.reset();
    }catch(err){
      console.error(err);
      showMsg('No pudimos registrar ahora. Se descargará un respaldo local.');
      downloadBackup(buildPayload());
    }finally{
      btn.disabled = false; btn.textContent = 'Enviar';
    }
  });

  // API pública para abrir/cerrar desde el menú
  window.VTCQuote = {
    open(){ if(!panel.classList.contains('open')) toggle(); },
    close(){ if(panel.classList.contains('open')) toggle(); },
    toggle,
  };
})();
