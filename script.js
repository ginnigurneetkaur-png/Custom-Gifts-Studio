
/* ========================================
   CUSTOM GIFTS STUDIO
======================================== */

// Apna WhatsApp number country code naal pao.
// Example: India layi 91 + 10-digit mobile number.
const WHATSAPP_NUMBER = "919530686885";

const products = [
  {
    id: 1,
    name: "Personalized Mug",
    category: "mugs",
    price: 249,
    image: "images/products/personalized-mug.jpg",
    description: "Add your favourite photo or name"
  },
  {
    id: 2,
    name: "Memory Photo Cushion",
    category: "home",
    price: 499,
    image: "images/products/memory-photo-cushion.jpg",
    description: "A memory to keep close"
  },
  {
    id: 3,
    name: "Custom T-shirt",
    category: "clothing",
    price: 599,
    image: "images/products/custom-t-shirt.jpg",
    description: "Your name, quote or artwork"
  },
  {
    id: 4,
    name: "Personalized Bottle",
    category: "mugs",
    price: 399,
    image: "images/products/personalized-bottle.jpg",
    description: "Make it yours"
  },
  {
    id: 6,
    name: "Personalized Greeting Card",
    category: "cards",
    price: 99,
    image: "images/products/personalized-greeting-card.jpg",
    description: "Your message, your way"
  },
  {
    id: 7,
    name: "Custom Travel Mug",
    category: "mugs",
    price: 449,
    image: "images/products/custom-travel-mug.jpg",
    description: "A personal touch on the go"
  },
  {
    id: 8,
    name: "Custom Tumbler",
    category: "mugs",
    price: 599,
    image: "images/products/custom-tumbler.jpg",
    description: "Your design, ready to go"
  },
  {
    id: 9,
    name: "Custom Handkerchief",
    category: "accessories",
    price: 199,
    image: "images/products/custom-handkerchief.jpg",
    description: "A personal touch in your pocket"
  },
  {
    id: 10,
    name: "Custom Stickers",
    category: "stickers",
    price: 149,
    image: "images/products/custom-stickers.jpg",
    description: "Your ideas, printed as stickers"
  },
  {
    id: 11,
    name: "Custom Shirts",
    category: "clothing",
    price: 699,
    image: "images/products/custom-shirts.jpg",
    description: "Create matching shirts with your own design"
  }
];

/* Find HTML elements */

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const priceSort = document.getElementById("priceSort");
const noProducts = document.getElementById("noProducts");
const wishlistFilter = document.getElementById("wishlistFilter");
const wishlistCount = document.getElementById("wishlistCount");
const quickViewDialog = document.getElementById("quickViewDialog");

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const toast = document.getElementById("toast");
const customizationDialog = document.getElementById("customizationDialog");
const productCustomizationForm = document.getElementById("productCustomizationForm");
const customizationProductName = document.getElementById("customizationProductName");
const customGiftImage = document.getElementById("customGiftImage");
const customGiftImageNote = document.getElementById("customGiftImageNote");
let selectedProductId = null;
const maxCustomGiftImageSize = 8 * 1024 * 1024;
const allowedCustomGiftImageTypes = ["image/jpeg", "image/png", "image/webp"];

const customOrderForm = document.getElementById("customOrderForm");
const giftPhoto = document.getElementById("giftPhoto");
const giftPhotoPreview = document.getElementById("giftPhotoPreview");
const giftPhotoPreviewImage = document.getElementById("giftPhotoPreviewImage");
const customOrderStatus = document.getElementById("customOrderStatus");
let giftPhotoPreviewUrl = null;
const accountForm = document.getElementById("accountForm");
const accountMessage = document.getElementById("accountMessage");
const accountTitle = document.getElementById("accountTitle");
const accountSubtitle = document.getElementById("accountSubtitle");
const accountSubmit = document.getElementById("accountSubmit");
const accountNameField = document.getElementById("accountNameField");
const accountName = document.getElementById("accountName");
const confirmPasswordField = document.getElementById("confirmPasswordField");
const confirmPassword = document.getElementById("confirmPassword");
const password = document.getElementById("accountPassword");
const accountSwitchLinks = document.querySelectorAll("[data-account-mode]");
let accountMode = "signup";

let cart = [];
let wishlist = [];
let showWishlistOnly = false;

try {
  cart = JSON.parse(
    localStorage.getItem("customGiftsCart") || "[]"
  );

  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

try {
  const savedWishlist = JSON.parse(
    localStorage.getItem("customGiftsWishlist") || "[]"
  );
  if (Array.isArray(savedWishlist)) {
    wishlist = [...new Set(savedWishlist.filter(id =>
      Number.isSafeInteger(id) && products.some(product => product.id === id)
    ))];
  }
} catch (error) {
  console.error("Could not load the saved wishlist.", error);
}

/* Helper functions */

function money(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function saveCart() {
  try {
    localStorage.setItem("customGiftsCart", JSON.stringify(cart));
  } catch {
    // Cart will still work for this visit.
  }
}

const availableProductIds = new Set(products.map(product => product.id));
const availableCart = cart.filter(item => availableProductIds.has(item.id));

if (availableCart.length !== cart.length) {
  cart = availableCart;
  saveCart();
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function openWhatsApp(message) {
  const number = WHATSAPP_NUMBER.replace(/\D/g, "");

  if (
    !/^\d{10,15}$/.test(number) ||
    number === "919530686885"
  ) {
    showToast("Please add your real WhatsApp number in script.js.");
    return false;
  }

  window.open(
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
  return true;
}

/* Display products */

function renderProductCards(list) {
  if (!list.length) {
    return '<p class="product-empty">No gifts match your selection. Try another filter.</p>';
  }

  return list.map(product => {
    const saved = wishlist.includes(product.id);
    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
          >
          <button
            type="button"
            class="wishlist-button${saved ? " is-saved" : ""}"
            data-wishlist="${product.id}"
            aria-pressed="${saved}"
            aria-label="${saved ? "Remove" : "Add"} ${product.name} ${saved ? "from" : "to"} wishlist"
          >${saved ? "♥" : "♡"}</button>
        </div>
        <div class="product-info">
          <p>${product.description}</p>
          <h3>${product.name}</h3>
          <div class="product-bottom">
            <strong class="product-price">${money(product.price)}</strong>
            <div class="product-actions">
              <button type="button" class="button button-primary" data-add="${product.id}">Add to Cart</button>
              <button type="button" class="button button-secondary" data-buy-now="${product.id}">Buy Now</button>
              <button type="button" class="button button-secondary" data-quick-view="${product.id}">Quick view</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderProducts() {
  if (!productGrid) return;

  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "all";
  const sort = priceSort ? priceSort.value : "featured";

  const filtered = products.filter(product => {
    const matchesCategory = category === "all" || product.category === category;
    const matchesSearch =
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(search);
    const matchesWishlist = !showWishlistOnly || wishlist.includes(product.id);
    return matchesCategory && matchesSearch && matchesWishlist;
  });

  if (sort === "low-to-high") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "high-to-low") {
    filtered.sort((a, b) => b.price - a.price);
  }

  productGrid.innerHTML = renderProductCards(filtered);
  if (noProducts) noProducts.hidden = true;
}

function renderWishlistCount() {
  if (wishlistCount) wishlistCount.textContent = wishlist.length;
  if (wishlistFilter) wishlistFilter.setAttribute("aria-pressed", String(showWishlistOnly));
}

function saveWishlist() {
  try {
    localStorage.setItem("customGiftsWishlist", JSON.stringify(wishlist));
  } catch (error) {
    console.error("Could not save the wishlist.", error);
    showToast("Wishlist changes could not be saved on this device.");
  }
}

function toggleWishlist(id) {
  if (!products.some(product => product.id === id)) return;
  wishlist = wishlist.includes(id)
    ? wishlist.filter(savedId => savedId !== id)
    : [...wishlist, id];
  saveWishlist();
  renderWishlistCount();
  renderProducts();

  const quickViewWishlist = document.getElementById("quickViewWishlist");
  if (quickViewWishlist && Number(quickViewWishlist.dataset.productId) === id) {
    const saved = wishlist.includes(id);
    quickViewWishlist.textContent = saved ? "♥ Saved to wishlist" : "♡ Save to wishlist";
    quickViewWishlist.setAttribute("aria-pressed", String(saved));
  }
}

if (searchInput) {
  searchInput.addEventListener("input", renderProducts);
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", renderProducts);
}

if (priceSort) {
  priceSort.addEventListener("change", renderProducts);
}

wishlistFilter?.addEventListener("click", () => {
  showWishlistOnly = !showWishlistOnly;
  renderWishlistCount();
  renderProducts();
  if (showWishlistOnly && wishlist.length === 0) {
    showToast("Save a gift with the heart button to build your wishlist.");
  }
});

/* Shopping cart */

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} added to your cart 💜`);
}

function changeQuantity(id, change) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(item => item.id !== id);
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cartCount) cartCount.textContent = count;

  const total = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  if (cartTotal) cartTotal.textContent = money(total);

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty. Add a gift you love! 💜</p>";
  } else {
    cartItems.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return "";

      return `
        <article class="cart-item">
          <img src="${product.image}" alt="${product.name}">

          <div>
            <h3>${product.name}</h3>
            <p>${money(product.price * item.quantity)}</p>

            <div class="quantity-control">
              <button type="button" data-qty="${product.id}" data-change="-1">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-qty="${product.id}" data-change="1">+</button>
            </div>
          </div>

          <button type="button" data-remove="${product.id}" aria-label="Remove item">×</button>
        </article>
      `;
    }).join("");
  }
}

function openCart() {
  if (!cartDrawer || !cartOverlay) return;

  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  if (!cartDrawer || !cartOverlay) return;

  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openProductCustomization(id) {
  const product = products.find(item => item.id === id);
  if (!product || !customizationDialog || !productCustomizationForm) return;

  selectedProductId = product.id;
  customizationProductName.textContent = product.name;
  productCustomizationForm.reset();
  customGiftImageNote.textContent = "JPG, PNG or WEBP; maximum 8 MB.";
  customizationDialog.showModal();
}

function openProductQuickView(id) {
  const product = products.find(item => item.id === id);
  if (!product || !quickViewDialog) return;

  document.getElementById("quickViewImage").src = product.image;
  document.getElementById("quickViewImage").alt = product.name;
  document.getElementById("quickViewTitle").textContent = product.name;
  document.getElementById("quickViewDescription").textContent = product.description;
  document.getElementById("quickViewPrice").textContent = money(product.price);

  const wishlistButton = document.getElementById("quickViewWishlist");
  wishlistButton.dataset.productId = product.id;
  const saved = wishlist.includes(product.id);
  wishlistButton.textContent = saved ? "♥ Saved to wishlist" : "♡ Save to wishlist";
  wishlistButton.setAttribute("aria-pressed", String(saved));
  document.getElementById("quickViewAdd").dataset.productId = product.id;
  document.getElementById("quickViewBuy").dataset.productId = product.id;
  quickViewDialog.showModal();
}

function handleProductGridClick(event) {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToCart(Number(addButton.dataset.add));
    return;
  }

  const buyButton = event.target.closest("[data-buy-now]");
  if (buyButton) {
    openProductCustomization(Number(buyButton.dataset.buyNow));
    return;
  }

  const quickViewButton = event.target.closest("[data-quick-view]");
  if (quickViewButton) {
    openProductQuickView(Number(quickViewButton.dataset.quickView));
    return;
  }

  const wishlistButton = event.target.closest("[data-wishlist]");
  if (wishlistButton) toggleWishlist(Number(wishlistButton.dataset.wishlist));
}

productGrid?.addEventListener("click", handleProductGridClick);

document.getElementById("closeQuickView")?.addEventListener("click", () => {
  quickViewDialog?.close();
});

document.getElementById("quickViewAdd")?.addEventListener("click", event => {
  addToCart(Number(event.currentTarget.dataset.productId));
  quickViewDialog?.close();
});

document.getElementById("quickViewBuy")?.addEventListener("click", event => {
  const productId = Number(event.currentTarget.dataset.productId);
  quickViewDialog?.close();
  openProductCustomization(productId);
});

document.getElementById("quickViewWishlist")?.addEventListener("click", event => {
  toggleWishlist(Number(event.currentTarget.dataset.productId));
});

document.getElementById("cancelCustomization")?.addEventListener("click", () => {
  customizationDialog?.close();
});

document.getElementById("skipCustomization")?.addEventListener("click", () => {
  productCustomizationForm?.requestSubmit();
});

productCustomizationForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (selectedProductId === null) return;

  const file = customGiftImage.files[0];
  if (file && (
    !allowedCustomGiftImageTypes.includes(file.type) ||
    file.size > maxCustomGiftImageSize
  )) {
    showToast("Choose a JPG, PNG or WEBP image under 8 MB.");
    return;
  }

  const submitButton = event.submitter ||
    productCustomizationForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const customisation = {
      text: document.getElementById("customGiftText").value.trim(),
      instructions: document.getElementById("customGiftInstructions").value.trim(),
      image: file ? await readCustomisationImage(file) : null
    };
    const productId = selectedProductId;
    selectedProductId = null;
    customizationDialog.close();
    await beginRazorpayCheckout(
      [{ id: productId, quantity: 1 }],
      false,
      submitButton,
      customisation
    );
  } catch (error) {
    showToast(error.message || "Could not read the selected image.");
  } finally {
    submitButton.disabled = false;
  }
});

function readCustomisationImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read the selected image."));
        return;
      }

      resolve({
        mimeType: file.type,
        data: reader.result.slice(reader.result.indexOf(",") + 1)
      });
    }, { once: true });
    reader.addEventListener("error", () => {
      reject(new Error("Could not read the selected image."));
    }, { once: true });
    reader.readAsDataURL(file);
  });
}

customGiftImage?.addEventListener("change", () => {
  const file = customGiftImage.files[0];
  if (!file) {
    customGiftImageNote.textContent = "JPG, PNG or WEBP; maximum 8 MB.";
    return;
  }

  if (!allowedCustomGiftImageTypes.includes(file.type) || file.size > maxCustomGiftImageSize) {
    customGiftImage.value = "";
    customGiftImageNote.textContent = "JPG, PNG or WEBP; maximum 8 MB.";
    showToast("Choose a JPG, PNG or WEBP image under 8 MB.");
    return;
  }

  customGiftImageNote.textContent = `${file.name} selected`;
});

if (cartItems) {
  cartItems.addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");

    if (quantityButton) {
      changeQuantity(
        Number(quantityButton.dataset.qty),
        Number(quantityButton.dataset.change)
      );
    }

    if (removeButton) {
      cart = cart.filter(
        item => item.id !== Number(removeButton.dataset.remove)
      );

      saveCart();
      renderCart();
    }
  });
}

document.getElementById("openCart")?.addEventListener("click", openCart);
document.getElementById("closeCart")?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeCart();
});

/* Custom photo selection */

function clearGiftPhotoPreview() {
  if (giftPhotoPreviewUrl) {
    URL.revokeObjectURL(giftPhotoPreviewUrl);
    giftPhotoPreviewUrl = null;
  }
  if (giftPhoto) giftPhoto.value = "";
  if (giftPhotoPreview) giftPhotoPreview.hidden = true;
  if (giftPhotoPreviewImage) giftPhotoPreviewImage.removeAttribute("src");
}

if (giftPhoto) {
  giftPhoto.addEventListener("change", () => {
    const file = giftPhoto.files[0];
    if (!file) {
      clearGiftPhotoPreview();
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      clearGiftPhotoPreview();
      showToast("Please choose a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      clearGiftPhotoPreview();
      showToast("Image must be smaller than 8 MB.");
      return;
    }

    if (giftPhotoPreviewUrl) URL.revokeObjectURL(giftPhotoPreviewUrl);
    giftPhotoPreviewUrl = URL.createObjectURL(file);
    giftPhotoPreviewImage.src = giftPhotoPreviewUrl;
    giftPhotoPreview.hidden = false;
    showToast("Photo selected: " + file.name);
  });
}

document.getElementById("removeGiftPhoto")?.addEventListener("click", clearGiftPhotoPreview);

/* Custom order form */

function getCustomOrderMessage() {
  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const gift = document.getElementById("giftType").value;
  const quantity = document.getElementById("orderQuantity").value;
  const details = document.getElementById("giftDetails").value.trim();
  const file = giftPhoto?.files[0];

  return [
    "💜 Custom Gifts Studio | Custom Order",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Gift: ${gift}`,
    `Quantity: ${quantity}`,
    `Requirements: ${details}`,
    file
      ? `Photo selected: ${file.name}. I will attach it separately.`
      : "Photo: Not selected",
    "",
    "Please confirm the price and delivery details. Thank you!"
  ].join("\n");
}

if (customOrderForm) {
  customOrderForm.addEventListener("submit", event => {
    event.preventDefault();

    const file = giftPhoto?.files[0];
    const opened = openWhatsApp(getCustomOrderMessage());
    if (customOrderStatus) {
      customOrderStatus.textContent = opened
        ? file
          ? "Your request is ready in WhatsApp. Attach your selected photo there before sending."
          : "Your request is ready in WhatsApp. Review it and press Send to complete your order."
        : "WhatsApp is not configured yet. Please contact the studio to complete your request.";
    }
  });
}

/* Account page */

function setAccountMode(mode) {
  if (!accountForm || !accountTitle || !accountSubtitle || !accountSubmit) return;

  accountMode = mode;
  const isSignup = mode === "signup";
  accountTitle.textContent = isSignup ? "Create your account" : "Welcome back";
  accountSubtitle.textContent = isSignup
    ? "Sign up to make every gift a little more personal."
    : "Sign in to continue creating thoughtful gifts.";
  accountSubmit.textContent = isSignup ? "Create account" : "Sign in";

  if (accountNameField) accountNameField.hidden = !isSignup;
  if (accountName) accountName.required = isSignup;
  if (confirmPasswordField) confirmPasswordField.hidden = !isSignup;
  if (password) password.autocomplete = isSignup ? "new-password" : "current-password";
  if (confirmPassword) confirmPassword.required = isSignup;
  if (accountMessage) accountMessage.textContent = "";

  accountSwitchLinks.forEach(link => {
    const active = link.dataset.accountMode === mode;
    link.setAttribute("aria-current", active ? "page" : "false");
  });
}

accountSwitchLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    setAccountMode(link.dataset.accountMode);
  });
});

document.querySelectorAll("[data-password-toggle]").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) return;

    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? "Hide" : "Show";
    button.setAttribute("aria-label", `${reveal ? "Hide" : "Show"} password`);
  });
});

if (accountForm) {
  accountForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (accountMode === "signup" && password.value !== confirmPassword.value) {
      accountMessage.textContent = "Your passwords do not match.";
      confirmPassword.focus();
      return;
    }

    accountSubmit.disabled = true;
    accountMessage.textContent = "Please wait...";

    try {
      const response = await fetch(
        accountMode === "signup" ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: accountName?.value.trim(),
            email: document.getElementById("accountEmail").value.trim(),
            password: password.value
          })
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Your request could not be completed.");
      }

      accountMessage.textContent = accountMode === "signup"
        ? `Account created. Welcome, ${result.name}!`
        : `You are signed in. Welcome back, ${result.name}!`;
      accountForm.reset();
    } catch (error) {
      accountMessage.textContent =
        error.message || "Could not connect to the server. Please try again.";
    } finally {
      accountSubmit.disabled = false;
    }
  });
}

/* Razorpay checkout */

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      "Payment backend is unavailable. Start the server with `npm start` and open http://localhost:3000."
    );
  }

  return response.json();
}

async function beginRazorpayCheckout(items, clearCartOnSuccess, button, customisation = null) {
  if (!items.length) {
    showToast("Your cart is empty!");
    return;
  }

  if (!window.Razorpay) {
    showToast("Payment checkout could not load. Please try again.");
    return;
  }

  button.disabled = true;

  try {
    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        customisation
      })
    });
    const order = await readApiResponse(orderResponse);

    if (!orderResponse.ok) {
      throw new Error(order.error || "Could not start your payment.");
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Custom Gifts Studio",
      description: "Personalized gifts order",
      order_id: order.id,
      theme: { color: "#7547b8" },
      handler: async payment => {
        try {
          const verificationResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment)
          });
          const result = await readApiResponse(verificationResponse);

          if (!verificationResponse.ok) {
            throw new Error(result.error || "Payment verification failed.");
          }

          if (clearCartOnSuccess) {
            cart = [];
            saveCart();
            renderCart();
            closeCart();
          }
          showToast("Payment successful. Thank you for your order!");
        } catch (error) {
          showToast(error.message || "Payment verification failed. Contact us for help.");
        }
      },
      modal: {
        ondismiss: () => showToast("Payment was not completed.")
      }
    });

    checkout.on("payment.failed", () => {
      showToast("Payment failed. Please try again.");
    });
    checkout.open();
  } catch (error) {
    showToast(error.message || "Could not start your payment. Please try again.");
  } finally {
    button.disabled = false;
  }
}

document.getElementById("checkoutButton")?.addEventListener("click", event => {
  beginRazorpayCheckout(cart, true, event.currentTarget);
});

/* Floating WhatsApp button */

document.getElementById("whatsappFloat")?.addEventListener("click", event => {
  event.preventDefault();

  openWhatsApp("Hi! I'd like to know more about your personalized gifts. 💜");
});

document.getElementById("contactWhatsApp")?.addEventListener("click", event => {
  event.preventDefault();
  openWhatsApp("Hi! I have a question about a personalized gift. 💜");
});

document.getElementById("footerWhatsApp")?.addEventListener("click", event => {
  event.preventDefault();
  openWhatsApp("Hi! I have a question about a personalized gift. 💜");
});

/* Footer year */

const year = document.getElementById("currentYear");
if (year) year.textContent = new Date().getFullYear();

/* Start website */

renderWishlistCount();
renderProducts();
renderCart();
