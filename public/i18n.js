/* ============================================================================
   LOIALT · i18n  (ES ⇄ EN)
   ----------------------------------------------------------------------------
   SOLO existe diccionario INGLÉS, a propósito: el HTML ya está escrito en
   español, así que "volver a español" es simplemente no aplicar nada. Con eso
   el español no puede desincronizarse nunca del diccionario, y editar una frase
   en el markup no obliga a tocar dos sitios.

   Las claves las genera `herramientas/instrumentar-i18n.py`, que marca cada
   unidad traducible en index.html:
     data-i18n="clave"            → se reemplaza textContent
     data-i18n-html="clave"       → se reemplaza innerHTML (frases con <b>, <em>…)
     data-i18n-attr-<attr>="clave"→ se reemplaza ese atributo (alt, placeholder…)

   POR QUÉ RECARGA AL CAMBIAR DE IDIOMA, y no cambia en caliente: la página monta
   SplitText de GSAP sobre los títulos, mide anchos para el pager y el carrusel,
   y arma el rayo guía con posiciones en %. Sustituir el texto después de que
   todo eso se inicializó dejaría los splits apuntando a nodos viejos y las
   medidas desfasadas. Este script corre ANTES de DOMContentLoaded, así que las
   animaciones se inicializan ya sobre el texto definitivo.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var EN = {
    /* ── documento, nav, footer y modal ────────────────────────────────── */
    'doc.title1': 'Loialt Energy — BESS Energy Storage for Industry in Mexico',
    // Descripción de las meta de SEO (name=description, og:description,
    // twitter:description). Los tres nodos apuntan a esta misma clave.
    'doc.description1': 'Battery energy storage systems (BESS) for industry in Mexico. Shave peak demand, back up critical loads and take control of your energy costs.',
    'doc.div1': 'LOADING · <span class="pv">0</span>%',
    'doc.a1': 'About us',
    'doc.a2': 'Challenges',
    'doc.a3': 'Solution',
    'doc.a4': 'Service',
    'doc.a5': 'Technology',
    'doc.a6': 'Products',
    'doc.button1': 'See if you qualify<span class="fill"></span>',
    // El nav móvil lleva su propia cadena, más corta: con la del hero el botón
    // se salía de pantalla a 360 px (ya pasó una vez).
    'doc.button2': 'Do you qualify?<span class="fill"></span>',

    /* ── hero ──────────────────────────────────────────────────────────── */
    'hero.aria-label1': 'Home',
    'hero.aria-label2': 'Loialt Energy',
    'hero.span1': 'We store energy,',
    'hero.span2': 'we power your <span class="amber">growth</span>.',
    'hero.b1': 'Storage solutions built around your operation.',
    'hero.button1': 'See if you qualify<span class="fill"></span>',
    'hero.a1': 'See how it works<span class="fill"></span>',

    /* ── nosotros ──────────────────────────────────────────────────────── */
    'nosotros.aria-label1': 'About us',
    'nosotros.span1': 'About us',
    'nosotros.h21': 'Your partner in the <em>energy transition</em>.',
    'nosotros.span2': 'Our mission',
    'nosotros.b1': 'Tailor-made solutions',
    'nosotros.span3': 'Storage engineered around what each industry actually needs, cutting costs and electrical risk.',
    'nosotros.b2': 'Renewables and regulation',
    'nosotros.span4': 'We help you integrate renewable energy and comply with Mexican energy regulations.',
    'nosotros.b3': 'Safety and local support',
    'nosotros.span5': 'We guarantee safety, durability and local support over the full project lifecycle.',

    /* ── puntos críticos ───────────────────────────────────────────────── */
    'problems.aria-label1': 'Challenges',
    'problems.h21': 'Challenges <br>in your operation.',
    'problems.span1': 'Three ways energy is costing you money, stability and growth.',
    'problems.span2': '01 · COSTS',
    'problems.h31': 'Rising electricity costs',
    'problems.li1': 'Tariffs from CFE, Mexico’s national utility, keep climbing, with gaps of up to <b>3×</b> between peak and off-peak hours.',
    'problems.li2': 'Electricity accounts for <b>15% to 30%</b> of operating costs in high-consumption facilities.',
    'problems.li3': 'Retail, hotels and hospitals: high volatility in the monthly bill.',
    'problems.li4': 'Accurate budgeting turns into guesswork.',
    'problems.span3': '02 · SUPPLY',
    'problems.h32': 'A grid you can’t rely on',
    'problems.li5': 'Industrial zones in central and northern Mexico: <b>3 to 8 outages</b> a year.',
    'problems.li6': 'Losses per event: from tens to <b>hundreds of thousands of pesos</b> (MXN).',
    'problems.li7': 'Frequent voltage sags, swells and harmonic distortion.',
    'problems.li8': 'Equipment damage, production stoppages and loss of critical data.',
    'problems.span4': '03 · RENEWABLES',
    'problems.h33': 'Renewables that are hard to interconnect',
    'problems.li9': 'Unstable solar/wind generation, with up to <b>25%</b> curtailed.',
    'problems.li10': 'It can’t cover production demand around the clock.',
    'problems.li11': 'Interconnection permitting is complex and drawn out.',
    'problems.li12': 'Storage helps meet CFE/CRE technical interconnection requirements.',

    /* ── solución ──────────────────────────────────────────────────────── */
    'what.aria-label1': 'Solution',
    'what.h21': 'The solution <br><em>built for you</em>.',
    'what.p1': 'Tap a solution for details',
    'what.span1': 'Cut what you spend on energy',
    'what.span2': 'Power that never drops',
    'what.span3': 'Make the most of your generation',
    'what.div1': '01 · ENERGY ARBITRAGE (PEAK / OFF-PEAK)',
    'what.h31': 'Cut what you spend on energy',
    'what.p2': 'We charge at off-peak rates and discharge at peak: your cost per kWh drops and the payback period shortens. Compatible with CFE time-of-use tariffs and solar integration.',
    'what.b1': '100 kWh–2 MWh',
    'what.span4': 'expandable beyond 20 MWh',
    'what.b2': '3.5–5 years',
    'what.span5': 'payback period',
    'what.b3': '≥ 15 years',
    'what.span6': 'service life',
    'what.span7': 'round-trip efficiency',
    'what.h32': 'Cut what you spend on energy',
    'what.p3': 'Peak shaving: we shift consumption out of peak hours.',
    'what.p4': 'Compatible with CFE tariffs and solar integration.',
    'what.b4': '100 kWh–2 MWh',
    'what.i1': '(Expandable beyond 20 MWh)',
    'what.b5': '3.5–5 years',
    'what.i2': '(Payback period)',
    'what.b6': '≥ 15 years',
    'what.i3': '(Service life)',
    'what.i4': '(Round-trip efficiency)',
    'what.div2': '02 · BACKUP AND POWER QUALITY',
    'what.h33': 'Power that never drops',
    'what.p5': 'Millisecond transfer to backup that stabilizes voltage and frequency and filters out harmonics and flicker. For precision manufacturing, food processing, medical equipment and data centers.',
    'what.b7': '< 200 ms',
    'what.span8': 'transfer time',
    'what.span9': 'voltage regulation',
    'what.b8': '± 0.1 Hz',
    'what.span10': 'frequency',
    'what.span11': 'active monitoring',
    'what.h34': 'Uninterrupted power',
    'what.p6': 'Instant backup, stabilization and power quality.',
    'what.p7': 'Ideal for manufacturing, food processing, healthcare and data centers.',
    'what.b9': '< 200 ms',
    'what.i5': '(Transfer time)',
    'what.i6': '(Voltage regulation)',
    'what.b10': '± 0.1 Hz',
    'what.i7': '(Frequency)',
    'what.i8': '(Monitoring)',
    'what.div3': '03 · RENEWABLE INTEGRATION',
    'what.h35': 'Make the most of your generation',
    'what.p8': 'Stabilize your solar/wind generation and meet interconnection requirements, off-grid or grid-tied. Technical documentation aligned with CFE/CRE interconnection requirements, with ancillary-services potential.',
    'what.b11': '< 100 ms',
    'what.span12': 'frequency regulation response',
    'what.span13': 'regulation accuracy',
    'what.b12': 'Off-grid / grid-tied',
    'what.span14': 'operation',
    'what.b13': 'CRE',
    'what.span15': 'permit-ready',
    'what.p9': 'When combined with your own renewable generation, the system may qualify for accelerated tax depreciation (Art. 34, Sec. XIII of the Mexican Income Tax Law) — check with your tax advisor.',
    'what.h36': 'Maximize your generation',
    'what.p10': 'Solar/wind stabilization and CFE/CRE interconnection.',
    'what.p11': 'Permitting handled; ready for ancillary services.',
    'what.b14': '< 100 ms',
    'what.i9': '(Response)',
    'what.i10': '(Regulation)',
    'what.b15': 'Off-grid / grid-tied',
    'what.i11': '(Operation)',
    'what.b16': 'CRE',
    'what.i12': '(Filing-ready)',
    'what.p12': 'Tap a solution for details',
    'what.p13': 'One BESS covers all three at once — with the engineering and the numbers to back it up.',

    /* ── gráfica del pico ──────────────────────────────────────────────── */
    'peak.aria-label1': 'Peak shaving',
    'peak.h21': 'Watch your peak <em>disappear</em>.',
    'peak.div1': 'lower demand charges',
    'peak.span1': '<span class="sw sw-peak"></span>Before LOIALT',
    'peak.span2': '<span class="sw sw-base"></span>After LOIALT',
    'peak.span3': 'The battery covers the difference. You pay the green line.',

    /* ── servicio ──────────────────────────────────────────────────────── */
    'servicio.aria-label1': 'Service',
    'servicio.h21': 'How we <em>work</em>.',
    'servicio.aria-label2': 'Service phases',
    'servicio.button1': '<span class="svc-tab-n">Phase 1</span> · Consulting and design',
    'servicio.button2': '<span class="svc-tab-n">Phase 2</span> · Deployment and handover',
    'servicio.button3': '<span class="svc-tab-n">Phase 3</span> · Maintenance and 24/7 support',
    'servicio.div1': 'Consulting and design',
    'servicio.h31': '01 Consulting and design',
    'servicio.p1': 'We assess your operation and design a system tailored to it.',
    'servicio.li1': 'Free on-site assessment: 3–12 months of consumption data plus your load profile, with a report of estimated savings and payback.',
    'servicio.li2': 'Business models: purchase, lease, <b>BESS as a Service</b> or shared savings.',
    'servicio.li3': 'Code-compliant design to Mexican standards (NOM) and CFE utility requirements, with permitting handled end to end before CRE, the national energy regulator.',
    'servicio.div2': 'Deployment and handover',
    'servicio.h32': '02 Deployment and handover',
    'servicio.p2': 'We install certified equipment on a guaranteed schedule.',
    'servicio.li4': 'Equipment certified to <b>IEC 62619</b> and <b>UN 38.3</b>; spare parts stocked in Mexico City, Monterrey and Guadalajara.',
    'servicio.li5': 'Lead times: <b>4–8 weeks</b> (small/medium) · <b>12–16</b> (large), with progress reports (excludes CFE/CRE permitting time, which varies by region).',
    'servicio.li6': 'Testing: 3 rounds of factory acceptance testing + <b>72 h</b> of live operation before grid connection.',
    'servicio.li7': 'Free training: operations, inspection and emergency response.',
    'servicio.div3': 'Maintenance and 24/7 support',
    'servicio.h33': '03 Maintenance and 24/7 support',
    'servicio.p3': 'We maintain your system across its entire life cycle.',
    'servicio.li8': '24/7 response SLA: remote diagnostics in <b>&lt;15 min</b>; on-site response in <b>&lt;4 h</b> in Mexico City, &lt;24 h nationwide.',
    'servicio.li9': 'Remote real-time monitoring + quarterly inspections + an annual major overhaul.',
    'servicio.li10': 'Software updates and an annual optimization report, at no cost.',
    'servicio.li11': 'Capacity warranty: replacement before capacity falls below <b>80%</b>.',
    'servicio.aria-label3': '3D render of the BESS system architecture: solar plant, grid and loads connected to the power converter, with the battery container, the monitoring platform and the rack–module–cell hierarchy. It turns a third of a revolution on each phase change.',

    /* ── tecnología ────────────────────────────────────────────────────── */
    'tecnologia.aria-label1': 'Technology',
    'tecnologia.h21': 'The technology<br><em>that runs it all</em>.',
    'tecnologia.h31': 'The brain behind the system',
    'tecnologia.p1': 'AI-driven energy management software (EMS) on a cloud-edge architecture: it senses, decides and acts in a closed loop. RelyEZ technology, proven worldwide on projects of up to <b>300 MW / 600 MWh</b>, with a portfolio under management at GW scale.',
    'tecnologia.b1': 'GW scale',
    'tecnologia.span1': 'Proven scale',
    'tecnologia.b2': '≤ 30 ms',
    'tecnologia.span2': 'EMS control response time',
    'tecnologia.span3': 'Control error',
    'tecnologia.alt1': 'EnergyHub EMS monitoring panel: current demand, state of charge, solar generation and the last 24 hours of consumption',
    'tecnologia.div1': 'SENSE',
    'tecnologia.p2': 'Real-time site data (local EMS).',
    'tecnologia.alt2': 'EnergyHub EMS strategy panel: charge and discharge plan for the next 24 hours with peak tariff windows',
    'tecnologia.div2': 'DECIDE',
    'tecnologia.p3': 'AI forecasting and strategy (EnergyCloud).',
    'tecnologia.alt3': 'EnergyHub EMS control panel: power setpoint tracking and event log',
    'tecnologia.div3': 'ACT',
    'tecnologia.p4': 'Local control with millisecond precision.',

    /* ── productos ─────────────────────────────────────────────────────── */
    'productos.aria-label1': 'Products',
    // Carrusel de productos (2026-09-14)
    'productos.aria-label2': 'Products',
    'productos.aria-label3': 'Previous product',
    'productos.aria-label4': 'Go to a product',
    'productos.aria-label5': 'Next product',
    // Los 5 productos nuevos — activos cuando se descomenten sus <li>
    /* MEDIDO: la versión anterior ("Beyond the project, equipment you can buy.")
       se iba a TRES líneas a 1440×900 y empujaba los controles del carrusel
       56 px por debajo de la losa. Era un fallo previo, solo del inglés — el
       español cabe en dos. Cualquier titular nuevo aquí hay que medirlo. */
    'productos.h21': 'Beyond projects: <em>equipment on its own</em>.',
    'productos.p1': 'We usually start by assessing your operation, and the right system comes out of that. But if you already know what you need, we also sell the equipment on its own — from industrial cabinets to portable units.',
    // Vueltos al catálogo el 2026-09-24, a petición del cliente (Turbocharger + EPLVS).
    'productos.alt7': 'EPLVS Series C storage and charging container with Loialt Energy branding',
    'productos.h37': 'Series C container',
    'productos.p8': 'High capacity with built-in fire suppression.',
    'productos.div7': '2 × 180 kW · 844 kWh',
    'productos.alt8': 'Microgrid Turbocharger 320 charger with Loialt Energy branding',
    'productos.h38': 'Turbocharger 320',
    'productos.p9': 'Fast charging without a grid upgrade: 320 kW while drawing only 80 from the grid.',
    'productos.div8': '320 kW · 189 kWh',
    'productos.alt9': 'EPLVS Series A autonomous mobile charger with Loialt Energy branding',
    'productos.h39': 'Autonomous charger',
    'productos.p10': 'It drives itself to the vehicle and charges with no operator.',
    'productos.div9': '150 kW · 209 kWh',
    'productos.alt10': 'EPLVS Series G2 compact station with Loialt Energy branding',
    'productos.h310': 'G2 compact station',
    'productos.p11': 'Storage and charging in the smallest possible footprint.',
    'productos.div10': '60 kW · 184 kWh',
    'productos.alt1': 'STAR H-PLUS storage cabinet with Loialt Energy branding',
    'productos.h31': 'STAR H-PLUS',
    'productos.p2': 'Outdoor storage, liquid-cooled.',
    'productos.div1': '125 kW · 254 kWh',
    'productos.alt2': 'STAR Q-PLUS storage cabinet with Loialt Energy branding',
    'productos.h32': 'STAR Q-PLUS',
    'productos.p3': 'All-in-one: hybrid inverter for solar PV, backup power and a genset.',
    'productos.div2': '125 kW · 250 kWh',
    'productos.alt3': 'Nimbus charging station with Loialt Energy branding: equipment cabinet, battery cabinet, DC/DC cabinet and 180 kW fast charger',
    'productos.h33': 'Nimbus',
    'productos.p4': 'DC fast charging for EVs, with built-in storage.',
    'productos.div3': '400 kW · 558 kWh',
    /* Los tres portátiles. "Power station" y no "generator": un generador quema
       combustible, y el argumento de venta aquí es justamente que no. */
    'productos.alt4': 'T14K portable power station with Loialt Energy branding',
    'productos.h34': 'T14K',
    'productos.p5': 'High-capacity backup, on wheels.',
    'productos.div4': '6000 W · 14.3 kWh',
    'productos.alt5': 'T4600 portable power station with Loialt Energy branding',
    'productos.h35': 'T4600',
    'productos.p6': 'Power for a job site or an event, ready to move.',
    'productos.div5': '3600 W · 4.6 kWh',
    'productos.alt6': 'Y1600 portable power station with Loialt Energy branding',
    'productos.h36': 'Y1600',
    'productos.p7': 'Power at hand for light critical equipment.',
    'productos.div6': '1600 W · 1.1 kWh',

    /* ── financiamiento ── */
    'financiamiento.aria-label1': 'Financing plans',
    'financiamiento.h21': 'The system is yours. <em>Choose how to pay for it</em>.',
    'financiamiento.p1': 'Three routes so the upfront cost isn’t what stops you: buy the system, lease it, or put nothing down and pay for it out of what it saves.',
    /* El eje: «cuánto pones al inicio», de todo a nada. */
    'financiamiento.eje1': 'Upfront cost: all of it',
    'financiamiento.eje3': 'None',
    'financiamiento.alt1': 'BESS container on a single solid plinth: the system is yours from day one.',
    'financiamiento.div1': 'Outright purchase',
    'financiamiento.h31': 'You own it outright',
    'financiamiento.p2': 'You invest once and the system is yours from day one. Every peso it saves stays with you for its whole service life.',
    'financiamiento.dato1': '',
    'financiamiento.alt2': 'BESS container on a plinth half solid, half green light: the investment spread over instalments.',
    'financiamiento.div2': 'Lease',
    'financiamiento.h32': 'Minimal upfront cost',
    'financiamiento.p3': 'You start with a small outlay and pay monthly instalments that the system’s own savings cover.',
    'financiamiento.dato2': '',
    'financiamiento.alt3': 'BESS container with no plinth, resting on green light alone: nothing down, Loialt operates it.',
    /* Nombre de marca: NO se traduce (decisión del 2026-09-08). */
    'financiamiento.div3': 'BESS as a Service',
    'financiamiento.h33': 'Nothing down',
    'financiamiento.p4': 'Loialt designs, installs, runs the system and gets paid out of the savings. You put in no capital and you don’t operate it.',
    'financiamiento.dato3': '',
    'doc.navFin': 'Financing',

    /* ── métricas ──────────────────────────────────────────────────────── */
    'metrics.aria-label1': 'Results',
    'metrics.h21': 'Results from systems in the field.',
    'metrics.span1': 'MWh installed',
    'metrics.p1': 'Capacity deployed across industrial and commercial sites.',
    'metrics.span2': 'Average savings',
    'metrics.p2': 'Lower demand charges on tariffs from CFE, Mexico’s national utility.',
    'metrics.span3': 'Availability',
    'metrics.p3': 'Automatic backup during grid faults and outages.',
    'metrics.span4': 'Tonnes of CO₂ avoided',
    'metrics.p4': 'Cleaner energy — measurable and ready for your ESG reporting, year after year.',
    'metrics.p5': 'Our partners.',
    'metrics.alt1': 'CATL',
    'metrics.alt2': 'RelyEZ',

    /* ── preguntas frecuentes ──────────────────────────────────────────── */
    'faq.aria-label1': 'Frequently asked questions',
    'faq.h21': 'Frequently asked questions.',
    'faq.h31': 'How exactly does it save me money?',
    'faq.div1': 'The software charges the batteries automatically when power is cheapest — overnight, or at midday when solar output peaks — and discharges that energy during peak hours, when rates are highest. That’s peak shaving: it sharply reduces your cost per kWh and shortens the payback period. It also avoids export penalties, because energy that used to be curtailed by grid congestion is now stored and monetized.',
    'faq.h32': 'How much does a BESS cost?',
    'faq.div2': 'The investment depends on the size of your operation, your load profile and the business model you choose (purchase, lease or BESS as a Service). That’s why we don’t quote a single price: book your free assessment and we’ll send you a tailored quote — no cost, no commitment.',
    'faq.h33': 'What happens during a blackout?',
    'faq.div3': 'In a total grid failure, the batteries act as an uninterruptible power supply (UPS), switching over instantly and preventing costly downtime in production lines, data centers and hospitals. On top of that, with <em>black start</em> technology, the system can bring a local microgrid back on its own, with no external power.',
    'faq.h34': 'How does it compare with a diesel generator or a traditional UPS?',
    'faq.div4': 'Unlike a diesel generator, a BESS burns no fuel, needs no engine maintenance or emissions permits, and responds in milliseconds instead of seconds. Compared with a traditional UPS — designed for only minutes of backup — a BESS stores hours of energy and also lowers your bill every single day, not just during an outage.',
    'faq.h35': 'How safe are the batteries?',
    'faq.div5': 'Safety is engineered into every layer: from LFP (lithium iron phosphate) cell chemistry — far more resistant to thermal runaway than other lithium chemistries — to reinforced outdoor enclosures. Advanced sensors monitor the temperature and state of health of every battery 24 hours a day, mitigating operational risk and delivering a long, efficient service life.',
    'faq.h36': 'What warranty does the equipment carry?',
    'faq.div6': 'The equipment carries the manufacturer’s standard warranty plus the backing of Loialt’s support team throughout the system’s life cycle. The exact terms — years of coverage, components included — are set out in your proposal, according to the business model and equipment chosen.',
    'faq.h37': 'Does it scale to the size of my operation?',
    'faq.div7': 'Yes. The equipment is modular — building blocks you stack: from compact cabinets for a retail site to utility-scale, liquid-cooled installations on multi-acre sites. You install what you need today and expand as your operation grows.',
    'faq.h38': 'What if I don’t want to put up the capital?',
    'faq.div8': 'That’s what our <b style="color:var(--ink)">BESS as a Service</b> model is for: we supply the equipment, fund it and run it (O&amp;M included); you pay a fraction of the savings it generates. No upfront capex.',

    /* ── pie de página ─────────────────────────────────────────────────── */
    'doc.aria-label1': 'Footer',
    'doc.p1': 'We store energy, we power your growth.',
    'doc.h41': 'Solutions',
    'doc.a7': 'Peak shaving',
    'doc.a8': 'Critical load backup',
    'doc.a9': 'Energy arbitrage',
    'doc.a10': 'BESS as a Service',
    'doc.h42': 'Company',
    'doc.a11': 'Technology',
    'doc.a12': 'Products',
    'doc.a13': 'Customers',
    'doc.aviso': 'Privacy notice (Spanish)',
    'doc.p4': 'By submitting you accept our <a href="./aviso-privacidad.html" target="_blank" rel="noopener">Privacy Notice</a>.',
    'doc.a14': 'About us',
    'doc.a15': 'Contact',
    'doc.h43': 'Contact',
    'doc.span1': '© <span id="footYear">2026</span> Loialt Energy. All rights reserved.',
    'doc.span2': 'BESS · Energy storage · <span style="color:var(--energy)">Mexico</span>',
    'doc.aria-label2': 'Go to section',
    'doc.aria-label3': 'Previous sections',
    'doc.a17': 'About us',
    'doc.a18': 'Challenges',
    'doc.a19': 'Solution',
    'doc.a20': 'Service',
    'doc.a21': 'Technology',
    'doc.a22': 'Products',
    'doc.aria-label4': 'Next sections',
    'doc.aria-label5': 'Social media',
    'doc.span3': 'Social media',
    'doc.aria-label6': 'Close',
    'doc.h31': 'Does your operation qualify?',
    'doc.p3': 'Our systems are sized for energy-intensive operations. Answer 2 questions and we’ll confirm it with you.',
    'doc.label1': 'Work email <span class="req">*</span>',
    'doc.placeholder1': 'name@company.com',
    'doc.label2': 'Name <span class="req">*</span>',
    'doc.placeholder2': 'First name',
    'doc.small1': 'First name',
    'doc.placeholder3': 'Last name',
    'doc.small2': 'Last name',
    'doc.label3': 'Company',
    'doc.placeholder4': 'Company',
    'doc.label4': 'Industry',
    'doc.option1': 'Select your industry',
    'doc.option2': 'Manufacturing',
    'doc.option3': 'Data center',
    'doc.option4': 'Hospital / healthcare',
    'doc.option5': 'Hospitality',
    'doc.option6': 'Retail',
    'doc.option7': 'Other',
    'doc.label5': 'Phone',
    'doc.placeholder5': 'Phone',
    /* ZONA DEL PAÍS. Era `quiz.q1` (1ª pregunta del cuestionario) y bajó al
       formulario el 2026-09-22: es un dato de contacto, no de calificación.
       Los nombres de las zonas son topónimos mexicanos — se conservan. */
    'doc.label-region': 'Region of Mexico',
    'doc.region0': 'Select your region',
    'doc.region1': 'North / Northeast',
    'doc.region2': 'Bajío / West-Central',
    'doc.region3': 'Mexico City / South-Central',
    'doc.region4': 'Southeast / Yucatán Peninsula',
    'doc.region5': 'Baja California',
    'doc.region6': 'Somewhere else',
    'doc.button3': 'Send request<span class="fill"></span>',
    /* Campo del recibo. "Electricity bill" y no "receipt": en inglés de negocio
       un receipt es el comprobante de un pago hecho, y lo que se pide aquí es la
       factura mensual, que es de donde salen la demanda y los cargos. */
    'doc.label6': 'Electricity bill <span class="mf-opt">(optional)</span>',
    'doc.span-recibo': 'Attach your bill (PDF or image)',
    'doc.p-recibo': 'Up to 5 MB. With your bill we run the numbers on real data.',

    /* ---- CUESTIONARIO DE CALIFICACIÓN (2026-09-14) ----
       Claves ESCRITAS A MANO, no generadas. Si alguna vez se vuelve a correr
       `herramientas/instrumentar-i18n.py`, re-numeraría estas como `doc.*`:
       el espacio de nombres `quiz.*` es deliberado. */
    /* 2026-09-22 · El cuestionario pasó de 5 preguntas a 2 (pedido del cliente):
       se fueron Prioridad y Cargos por demanda, y Región bajó al formulario
       como `doc.region*`. Quedan las DOS que alimentan `clasificar()`. */
    'quiz.q1': 'Which CFE tariff is your operation on?',
    // GDMTH / DIST / DIT son nombres propios de tarifas de CFE: NO se traducen.
    'quiz.q1.o1': 'A time-of-use tariff (GDMTH, DIST or DIT)',
    'quiz.q1.o2': 'Another tariff (basic commercial, residential…)',
    'quiz.q1.o3': 'I’m not sure which one we’re on',
    'quiz.q2': 'How much do you pay for electricity each month?',
    // Las cifras se quedan en MXN también en inglés: son pesos mexicanos y
    // convertirlas o quitar la divisa haría que un lector extranjero leyera
    // dólares.
    'quiz.q2.o1': 'More than $1,000,000 MXN a month',
    'quiz.q2.o2': 'Between $600,000 and $1,000,000 MXN',
    'quiz.q2.o3': 'Less than $600,000 MXN',
    'quiz.q2.o4': 'I don’t have the figure to hand',
    'quiz.atras': '← Back',
    'quiz.siguiente': 'Next →',
    // NO agradece: el cierre PIDE los datos. El gracias va tras enviar
    // (`modal.gracias.*`), no antes.
    'quiz.finTitulo': 'How can we reach you?',
    'quiz.fin': 'That’s enough for us to work out your savings. Leave your details just below and we’ll come back to you with the figure.',
    'quiz.cambiar': 'Change my answers'
  };

  /* Textos que genera el JS (no viven en el markup, así que no los alcanza el
     instrumentador). Se exponen para que index.html los consulte. */
  var EN_JS = {
    'modal.titulo.calc': 'Your exact savings',
    'modal.sub.calc': 'Our systems are sized for energy-intensive operations. Answer 2 questions and we’ll confirm it with you.',
    'modal.titulo.contacto': 'Let’s talk about your project',
    // La versión anterior ("Tell us what you need and we will get back to you")
    // perdía contenido del español: el especialista, Loialt y la promesa de una
    // solución para SU operación. Quedaba como acuse de formulario genérico
    // justo en el punto de conversión.
    'modal.sub.contacto': 'Tell us about your operation and a Loialt specialist will get back to you with the right solution.',
    // Redactadas para el envío por mailto: no se ha recibido nada todavía.
    // MISMO mensaje para todo el mundo: el panel no revela si la operación
    // califica o no. Esa respuesta la da Loialt por correo, con el cálculo
    // hecho — por eso aquí se promete una revisión, no un número automático.
    'modal.gracias.calc': 'Thanks! We’ve got your details. A Loialt specialist will look at your case and come back to you with the numbers and a straight recommendation.',
    'modal.gracias.contacto': 'Thanks! We’ve got your enquiry and a Loialt specialist will reach out to you personally.',
    // Camino bueno (Netlify recibió los datos) y camino de respaldo (falló el
    // envío y se cae al mailto). Son mensajes distintos a propósito: el primero
    // sí puede decir "recibimos", el segundo no.
    'modal.gracias.fallo': 'We couldn’t submit the form. We’ve opened your email client with your details — just hit send.',
    'modal.gracias.respaldo': 'Email didn’t open? Write to us at',
    'form.enviando': 'Sending…',
    'form.emailVacio': 'Enter your work email.',
    'form.email': 'Enter a valid email address.',
    'form.nombre': 'Enter your name.',
    'form.archivoGrande': 'That file is over 5 MB. Compress it or send it to us by email.',
    // El mailto: no puede llevar adjuntos. Si no se dice, la persona cree que ya
    // mandó su recibo y Loialt nunca lo recibe.
    'modal.gracias.sinAdjunto': 'Your file can’t travel in that email — attach it by hand before you send it.',
    // %1 y %2 los sustituye el JS por el número de pregunta y el total.
    'quiz.progreso': 'Question %1 of %2'
  };

  var CLAVE = 'loialtLang';

  function idiomaElegido() {
    var q = (w.location.search.match(/[?&]lang=(en|es)\b/i) || [])[1];
    if (q) { try { localStorage.setItem(CLAVE, q.toLowerCase()); } catch (e) {} return q.toLowerCase(); }
    try { return localStorage.getItem(CLAVE) || 'es'; } catch (e) { return 'es'; }
  }

  function aplicar(dic) {
    d.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dic[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });
    d.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var v = dic[el.getAttribute('data-i18n-html')];
      if (v != null) el.innerHTML = v;
    });
    // 'content' se añadió para las meta de SEO (description, og:*, twitter:*):
    // sin él, al cambiar a inglés el título sí cambiaba pero la descripción y la
    // tarjeta al compartir seguían en español.
    ['alt', 'placeholder', 'aria-label', 'title', 'data-ph', 'content'].forEach(function (a) {
      d.querySelectorAll('[data-i18n-attr-' + a + ']').forEach(function (el) {
        var v = dic[el.getAttribute('data-i18n-attr-' + a)];
        if (v != null) el.setAttribute(a, v);
      });
    });
    var t = dic['doc.title1'];
    if (t) d.title = t;
  }

  var lang = idiomaElegido();
  d.documentElement.setAttribute('lang', lang);

  /* CANONICAL POR IDIOMA — cada versión debe apuntarse a SÍ MISMA.
     El HTML trae fijo `canonical → /` (la URL en español) porque es un solo
     archivo servido para las dos. Dejarlo así rompía el hreflang: al rastrear
     `?lang=en`, Google leía "esto es un duplicado de /" y consolidaba las dos
     en la española, con lo que la versión en inglés no llegaba a indexarse.
     Un canonical que se apunta a sí mismo es justo lo que hreflang necesita
     para tratarlas como alternativas y no como copias. */
  (function () {
    var url = 'https://loialtenergy.com/' + (lang === 'en' ? '?lang=en' : '');
    var can = d.querySelector('link[rel="canonical"]');
    if (can) can.setAttribute('href', url);
    var og = d.querySelector('meta[property="og:url"]');
    if (og) og.setAttribute('content', url);
  })();

  if (lang === 'en') {
    aplicar(EN);
    /* SEGUNDA PASADA al terminar de parsear: este script se carga antes de GSAP
       —para que SplitText y el pager midan ya sobre el texto final— pero el
       modal de contacto vive MÁS ABAJO en el markup, así que en la primera
       pasada todavía no existe. Sin esto, su título, su subtítulo y dos campos
       del formulario se quedaban en español. `aplicar` es idempotente. */
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function(){ aplicar(EN); });
  }

  /* Cablea los botones de idioma. Va AQUÍ y no en un <script> del markup:
     aquel corría durante el parseo, cuando este archivo todavía no se había
     cargado, así que salía por el `return` y el botón quedaba muerto —mostrando
     siempre "EN" y sin escuchar el click. */
  function cablearBotones() {
    var destino = lang === 'es' ? 'en' : 'es';
    ['langSw'].forEach(function (id) {
      var b = d.getElementById(id);
      if (!b) return;
      var s = b.querySelector('span') || b;
      s.textContent = destino.toUpperCase();   /* muestra el idioma AL QUE SE VA */
      b.addEventListener('click', function () {
        /* Se registra ANTES de cambiar, porque `cambiar` recarga la página y se
           perdería el evento. Sirve para saber si la versión en inglés se usa
           —traducirla costó una sesión entera— o si nadie la pide. */
        try { if (w.umami && w.umami.track) w.umami.track('cambio-idioma', { a: destino }); } catch (e) {}
        w.LOIALT_I18N.cambiar(destino);
      });
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', cablearBotones);
  else cablearBotones();

  /* API para el resto de la página: el idioma actual y los textos del JS. */
  w.LOIALT_I18N = {
    lang: lang,
    es: lang === 'es',
    /* t(clave, textoEnEspañol) → devuelve la versión del idioma activo */
    t: function (clave, esp) { return lang === 'en' && EN_JS[clave] != null ? EN_JS[clave] : esp; },
    cambiar: function (nuevo) {
      try { localStorage.setItem(CLAVE, nuevo); } catch (e) {}
      /* RECARGA a propósito — ver la nota de arriba: GSAP SplitText y las
         medidas del pager ya se calcularon sobre el texto actual. */
      var u = new URL(w.location.href);
      u.searchParams.set('lang', nuevo);
      w.location.href = u.toString();
    }
  };
})(window, document);
