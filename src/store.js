const categories = [
  { id: 'all', label: 'All products' },
  { id: 'vinyl', label: 'Vinyl records' },
  { id: 'cassettes', label: 'Cassettes' },
  { id: 'players', label: 'Music players' },
  { id: 'posters', label: 'Posters & art' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'phone-cases', label: 'Phone cases' }
];

// These are catalogue slots, not confirmed stock. Official names, prices, images,
// specifications, shipping rules, and inventory must be verified before activation.
const products = [
  { slug: 'vinyl-release-slot', category: 'vinyl', title: 'Ochayoli vinyl release', eyebrow: 'Vinyl records / 001', description: 'A future physical release slot for verified Ochayoli catalogue artwork and track details.', fields: [['Format', '12-inch / to be confirmed'], ['Edition', 'Standard or limited / TBC'], ['Availability', 'Pending label verification']], tone: 'rust' },
  { slug: 'collector-vinyl-slot', category: 'vinyl', title: 'Collector edition record', eyebrow: 'Vinyl records / 002', description: 'A collector format placeholder for an authorised release, alternate sleeve, or special artwork edition.', fields: [['Format', 'Collector format / TBC'], ['Artwork', 'Official artwork pending'], ['Availability', 'Pending label verification']], tone: 'lime' },
  { slug: 'mixtape-cassette-slot', category: 'cassettes', title: 'Mixtape cassette', eyebrow: 'Cassettes / 001', description: 'A physical mixtape slot for a verified O\'Flow or Ochayoli release.', fields: [['Format', 'Cassette / to be confirmed'], ['Edition', 'Release details pending'], ['Availability', 'Pending label verification']], tone: 'paper' },
  { slug: 'limited-cassette-slot', category: 'cassettes', title: 'Limited cassette edition', eyebrow: 'Cassettes / 002', description: 'A limited analog format placeholder with front and back artwork to be confirmed.', fields: [['Format', 'Cassette / TBC'], ['Artwork', 'Official artwork pending'], ['Availability', 'Pending label verification']], tone: 'rust' },
  { slug: 'portable-player-slot', category: 'players', title: 'Portable cassette player', eyebrow: 'Music players / 001', description: 'A selected physical playback device slot. Manufacturer, model, condition, warranty, and shipping restrictions must be confirmed.', fields: [['Manufacturer', 'To be confirmed'], ['Condition', 'To be confirmed'], ['Warranty', 'To be confirmed']], tone: 'lime' },
  { slug: 'turntable-slot', category: 'players', title: 'Turntable / record player', eyebrow: 'Music players / 002', description: 'A future turntable slot for a verified supplier and fully documented technical specification.', fields: [['Model', 'To be confirmed'], ['Power', 'To be confirmed'], ['Shipping', 'Restrictions to be confirmed']], tone: 'paper' },
  { slug: 'typography-print-slot', category: 'posters', title: 'Typography art print', eyebrow: 'Posters & art / 001', description: 'A wall-art slot for official Ochayoli typography, with paper, finish, size, and framing details pending.', fields: [['Sizes', 'A4 / A3 / A2 to be configured'], ['Paper', 'To be confirmed'], ['Frame', 'Unframed or framed / TBC']], tone: 'rust' },
  { slug: 'album-art-print-slot', category: 'posters', title: 'Album artwork print', eyebrow: 'Posters & art / 002', description: 'A future authorised artwork print slot. No album art is represented here as official.', fields: [['Artwork', 'Official source pending'], ['Finish', 'To be confirmed'], ['Availability', 'Pending label verification']], tone: 'lime' },
  { slug: 'graphic-tee-slot', category: 'streetwear', title: 'Ochayoli core tee', eyebrow: 'Streetwear / 001', description: 'A Qikink launch candidate for an authorised Ochayoli graphic, with material, fit, sizes, and care details pending.', fields: [['Supplier', 'Qikink mapping pending'], ['Sizes', 'To be configured'], ['SKU', 'Not assigned']], qikinkCategory: 't-shirts', tone: 'paper' },
  { slug: 'hoodie-slot', category: 'streetwear', title: "O'Flow heavyweight hoodie", eyebrow: 'Streetwear / 002', description: 'A Qikink launch candidate for a verified cut, colourway, manufacturer, and inventory plan.', fields: [['Supplier', 'Qikink mapping pending'], ['Sizes', 'To be configured'], ['SKU', 'Not assigned']], qikinkCategory: 'hoodies', tone: 'rust' },
  { slug: 'cap-tote-slot', category: 'accessories', title: 'Ochayoli tote bag', eyebrow: 'Accessories / 001', description: 'A Qikink launch candidate for an Ochayoli tote. Material, print method, dimensions, and fulfilment are pending verification.', fields: [['Supplier', 'Qikink mapping pending'], ['Material', 'To be confirmed'], ['SKU', 'Not assigned']], qikinkCategory: 'bags', tone: 'lime' },
  { slug: 'ochayoli-cap', category: 'accessories', title: 'Ochayoli six-panel cap', eyebrow: 'Accessories / 002', description: 'A Qikink launch candidate for headwear. Branding method, colours, sizing, and stock are not yet confirmed.', fields: [['Supplier', 'Qikink mapping pending'], ['Variants', 'To be configured'], ['SKU', 'Not assigned']], qikinkCategory: 'headwear', tone: 'rust' },
  { slug: 'sticker-pack', category: 'accessories', title: 'Ochayoli sticker pack', eyebrow: 'Accessories / 003', description: 'A Qikink launch candidate for a collectible sticker set. Artwork approval, pack size, and finish are pending.', fields: [['Supplier', 'Qikink mapping pending'], ['Finish', 'To be confirmed'], ['SKU', 'Not assigned']], qikinkCategory: 'stickers', tone: 'paper' },
  { slug: 'phone-case-slot', category: 'phone-cases', title: 'Ochayoli phone case', eyebrow: 'Phone cases / 001', description: 'A Qikink launch candidate for a device-specific case. Compatible models, material, artwork, and fulfilment must be confirmed before listing.', fields: [['Supplier', 'Qikink mapping pending'], ['Devices', 'Only verified models'], ['SKU', 'Not assigned']], qikinkCategory: 'phone-cases', tone: 'paper' }
];

const cartKey = 'ochayoli-store-shortlist';
const requestKey = 'ochayoli-store-last-request';
const root = document.querySelector('[data-store-root]');

function getCart() {
  try {
    const value = JSON.parse(localStorage.getItem(cartKey) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  syncCartCount();
}

function syncCartCount() {
  const count = getCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach((element) => {
    element.textContent = String(count);
  });
}

function addToShortlist(slug) {
  const cart = getCart();
  const existing = cart.find((item) => item.slug === slug);
  if (existing) existing.quantity += 1;
  else cart.push({ slug, quantity: 1 });
  saveCart(cart);
  announce('Added to your shortlist.');
}

function removeFromShortlist(slug) {
  saveCart(getCart().filter((item) => item.slug !== slug));
  renderCurrentView();
}

function announce(message) {
  const live = document.querySelector('[data-store-live]');
  if (live) live.textContent = message;
}

function productBySlug(slug) {
  return products.find((product) => product.slug === slug);
}

function categoryLabel(id) {
  return categories.find((category) => category.id === id)?.label || id;
}

function productArt(product) {
  return `<div class="store-product-art store-product-art--${product.tone}" aria-hidden="true"><span></span><i></i><b>${product.category === 'vinyl' ? '◎' : product.category === 'cassettes' ? '▣' : product.category === 'players' ? '◫' : product.category === 'posters' ? '✦' : product.category === 'streetwear' ? 'O' : product.category === 'phone-cases' ? '▱' : '＋'}</b></div>`;
}

function productCard(product) {
  return `<article class="store-product-card" data-category="${product.category}">
    <button class="store-product-card__visual" type="button" data-product="${product.slug}" aria-label="View details for ${product.title}">
      ${productArt(product)}
      <span class="store-product-card__stamp mono">${product.qikinkCategory ? 'Draft / Qikink map pending' : 'Preview / TBC'}</span>
    </button>
    <div class="store-product-card__body">
      <p class="store-product-card__eyebrow mono">${product.eyebrow}</p>
      <h3>${product.title}</h3>
      <p>${product.description}</p>
      <button class="store-text-button mono" type="button" data-product="${product.slug}">View catalogue details <span aria-hidden="true">↗</span></button>
    </div>
  </article>`;
}

function renderCatalogue() {
  const params = new URLSearchParams(location.search);
  const selectedCategory = categories.some((category) => category.id === params.get('category')) ? params.get('category') : 'all';
  root.innerHTML = `<section class="store-hero section section--doodle">
      <div class="shell store-hero__grid">
        <div>
          <p class="section-kicker mono section-kicker--lime">Store / 007</p>
          <h1>OCHAYOLI<br /><em>STORE.</em></h1>
          <p class="store-hero__lede serif">Physical culture for the sound that's next — records, tapes, streetwear, objects and selected gear.</p>
        </div>
        <div class="store-hero__note">
          <span class="store-doodle store-doodle--record" aria-hidden="true">◎</span>
          <p class="mono">A catalogue in the making</p>
          <p>Every item shown is a clearly marked preview slot. Official stock, product photography, prices, shipping, and payment will activate only after label verification.</p>
          <a class="button button--light mono" href="/#connect">Talk to Ochayoli <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
    <section class="store-catalogue section section--paper">
      <div class="shell">
        <div class="store-catalogue__top">
          <div>
            <p class="section-kicker mono">Browse the catalogue</p>
            <h2>Objects with<br /><em>a pulse.</em></h2>
          </div>
          <div class="store-catalogue__controls">
            <label class="store-search mono" for="store-search">Search <input id="store-search" type="search" placeholder="Search the catalogue" autocomplete="off" /></label>
            <a class="button button--dark mono" href="/cart/">Shortlist <span data-cart-count>0</span> <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div class="store-category-list" role="tablist" aria-label="Store categories">
          ${categories.map((category) => `<button class="store-category ${category.id === selectedCategory ? 'is-active' : ''}" type="button" role="tab" aria-selected="${category.id === selectedCategory}" data-category-filter="${category.id}">${category.label}</button>`).join('')}
        </div>
        <div class="store-product-grid" data-product-grid>${products.filter((product) => selectedCategory === 'all' || product.category === selectedCategory).map(productCard).join('')}</div>
        <p class="store-empty mono" data-store-empty hidden>No catalogue slots match that search.</p>
        <p class="store-disclaimer mono">Preview catalogue only. No product is represented as confirmed stock, an official release, or a payment-ready listing.</p>
      </div>
    </section>
    <div class="store-live mono" data-store-live aria-live="polite"></div>
    <dialog class="store-dialog" data-product-dialog aria-labelledby="product-dialog-title"></dialog>`;
  syncCartCount();
  wireCatalogue();
  if (params.get('product')) openProduct(params.get('product'));
}

function wireCatalogue() {
  document.querySelectorAll('[data-category-filter]').forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.categoryFilter;
    const url = new URL(location.href);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    history.replaceState({}, '', url);
    renderCatalogue();
  }));

  document.querySelectorAll('[data-product]').forEach((button) => button.addEventListener('click', () => openProduct(button.dataset.product)));
  const search = document.querySelector('#store-search');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('.store-product-card').forEach((card) => {
      const match = card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    });
    document.querySelector('[data-store-empty]').hidden = visible !== 0;
  });
}

function openProduct(slug) {
  const product = productBySlug(slug);
  const dialog = document.querySelector('[data-product-dialog]');
  if (!product || !dialog) return;
  dialog.innerHTML = `<button class="store-dialog__close" type="button" data-dialog-close aria-label="Close product details">×</button>
    <div class="store-dialog__grid">${productArt(product)}<div><p class="section-kicker mono">${product.eyebrow}</p><h2 id="product-dialog-title">${product.title}</h2><p class="serif store-dialog__description">${product.description}</p><dl class="store-fields">${product.fields.map(([label, value]) => `<div><dt class="mono">${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="store-dialog__actions"><button class="button button--dark mono" type="button" data-add-product="${product.slug}">Add to shortlist <span aria-hidden="true">＋</span></button><a class="store-text-button mono" href="/#connect">Ask about this item <span aria-hidden="true">↗</span></a></div></div></div>`;
  dialog.showModal();
  const url = new URL(location.href);
  url.searchParams.set('product', slug);
  history.replaceState({}, '', url);
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => closeProduct(dialog));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeProduct(dialog); }, { once: true });
  dialog.querySelector('[data-add-product]').addEventListener('click', () => { addToShortlist(slug); closeProduct(dialog); });
}

function closeProduct(dialog) {
  dialog.close();
  const url = new URL(location.href);
  url.searchParams.delete('product');
  history.replaceState({}, '', url);
}

function renderCart() {
  const cart = getCart();
  const items = cart.map((item) => ({ ...item, product: productBySlug(item.slug) })).filter((item) => item.product);
  root.innerHTML = `<section class="store-page-section section section--paper"><div class="shell store-flow"><p class="section-kicker mono">Store / Shortlist</p><div class="store-flow__heading"><h1>Your<br /><em>shortlist.</em></h1><span class="store-flow__mark" aria-hidden="true">◎</span></div>${items.length ? `<div class="store-cart-list">${items.map(({ product, quantity }) => `<article class="store-cart-row">${productArt(product)}<div><p class="mono">${product.eyebrow}</p><h2>${product.title}</h2><p>${product.description}</p></div><div class="store-cart-row__meta"><span class="mono">Qty ${quantity}</span><button class="store-text-button mono" type="button" data-remove-product="${product.slug}">Remove <span aria-hidden="true">×</span></button></div></article>`).join('')}</div><div class="store-flow__actions"><p class="mono">This shortlist does not reserve stock or create a payment obligation.</p><a class="button button--dark mono" href="/checkout/">Request availability <span aria-hidden="true">↗</span></a></div>` : `<div class="store-empty-panel"><p class="serif">Nothing here yet.</p><p>Browse the catalogue and save the items you want Ochayoli to verify first.</p><a class="button button--dark mono" href="/store/">Browse store <span aria-hidden="true">↗</span></a></div>`}</div></section><div class="store-live mono" data-store-live aria-live="polite"></div>`;
  syncCartCount();
  document.querySelectorAll('[data-remove-product]').forEach((button) => button.addEventListener('click', () => removeFromShortlist(button.dataset.removeProduct)));
}

function renderCheckout() {
  const cart = getCart();
  const items = cart.map((item) => ({ ...item, product: productBySlug(item.slug) })).filter((item) => item.product);
  root.innerHTML = `<section class="store-page-section section section--paper"><div class="shell store-flow"><p class="section-kicker mono">Store / Request availability</p><div class="store-flow__heading"><h1>Make it<br /><em>real.</em></h1><span class="store-flow__mark store-flow__mark--burst" aria-hidden="true">✦</span></div>${items.length ? `<div class="store-checkout-grid"><div><p class="serif store-checkout__intro">Tell us which catalogue slots you want updates on. This is an availability request, not a purchase: no payment is collected and no stock is reserved.</p><ul class="store-request-list">${items.map(({ product, quantity }) => `<li><span>${product.title}</span><span class="mono">${quantity} × preview</span></li>`).join('')}</ul></div><form class="store-request-form" action="/contact.php" method="post" data-store-request-form><label for="store-name">Your name</label><input id="store-name" name="name" autocomplete="name" required placeholder="Name" /><label for="store-email">Email address</label><input id="store-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com" /><label for="store-message">Anything we should know?</label><textarea id="store-message" name="message" required placeholder="Tell us your size, device model, format, or what you want to hear about..."></textarea><input class="field-honeypot" name="website" autocomplete="off" tabindex="-1" /><button class="button button--dark mono" type="submit">Send availability request <span aria-hidden="true">↗</span></button><p class="form-status mono" data-store-form-status aria-live="polite">Your request will be forwarded to hello@ochayoli.in.</p></form></div>` : `<div class="store-empty-panel"><p class="serif">Your shortlist is empty.</p><p>Add a catalogue slot before requesting availability.</p><a class="button button--dark mono" href="/store/">Browse store <span aria-hidden="true">↗</span></a></div>`}</div></section>`;
  if (items.length) wireRequestForm(items);
}

function wireRequestForm(items) {
  const form = document.querySelector('[data-store-request-form]');
  const status = document.querySelector('[data-store-form-status]');
  const button = form.querySelector('button[type="submit"]');
  const summary = items.map(({ product, quantity }) => `${quantity} x ${product.title} (${product.eyebrow})`).join('\n');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = 'Sending request…';
    const data = new FormData(form);
    data.set('message', `Ochayoli Store availability request\n\n${summary}\n\nVisitor note:\n${data.get('message')}`);
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'The request could not be sent.');
      localStorage.setItem(requestKey, JSON.stringify({ reference: `OC-${Date.now().toString(36).slice(-6).toUpperCase()}`, email: data.get('email'), items: items.map(({ product, quantity }) => ({ title: product.title, quantity })) }));
      localStorage.removeItem(cartKey);
      location.href = '/order-confirmation/';
    } catch (error) {
      status.textContent = error.message || 'The request could not be sent. Please try again.';
      button.disabled = false;
    }
  });
}

function renderConfirmation() {
  let request = null;
  try { request = JSON.parse(localStorage.getItem(requestKey) || 'null'); } catch { request = null; }
  const reference = request?.reference || 'OC-PENDING';
  root.innerHTML = `<section class="store-page-section section section--paper"><div class="shell store-confirmation"><span class="store-confirmation__mark" aria-hidden="true">✓</span><p class="section-kicker mono">Store / Request received</p><h1>Stay<br /><em>close.</em></h1><p class="serif">Your availability request is with the Ochayoli team. We’ll follow up from <strong>hello@ochayoli.in</strong> once the item, price, shipping, and fulfilment details are verified.</p><p class="mono store-confirmation__reference">Reference / ${reference}</p>${request?.items?.length ? `<ul class="store-request-list">${request.items.map((item) => `<li><span>${item.title}</span><span class="mono">${item.quantity} × preview</span></li>`).join('')}</ul>` : ''}<div class="store-flow__actions"><a class="button button--dark mono" href="/store/">Back to store <span aria-hidden="true">↗</span></a><a class="store-text-button mono" href="/">Return home <span aria-hidden="true">↗</span></a></div></div></section>`;
}

function setupMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.menu-toggle__label').textContent = open ? 'Close' : 'Menu';
  });
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.menu-toggle__label').textContent = 'Menu';
  }));
}

function renderCurrentView() {
  if (!root) return;
  setupMenu();
  const view = root.dataset.storeView;
  if (view === 'cart') renderCart();
  else if (view === 'checkout') renderCheckout();
  else if (view === 'confirmation') renderConfirmation();
  else renderCatalogue();
  syncCartCount();
}

window.addEventListener('storage', syncCartCount);
renderCurrentView();

