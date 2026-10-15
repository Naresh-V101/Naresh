/* Work showcase: search + tag filters + case-study modal. Progressive enhancement. */
(() => {
  const list = document.querySelector(".project-list");
  if (!list) return;
  const search = document.getElementById("work-search");
  const chipsBox = document.getElementById("work-chips");
  const count = document.getElementById("work-count");
  const cards = [...list.querySelectorAll("article.project")];
  const FILTERS = ["All", "Python", "C/C++", "IoT", "NLP", "Health"];

  let active = "All";

  // Build chips
  FILTERS.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "work-chip";
    btn.textContent = name;
    btn.setAttribute("aria-pressed", String(name === "All"));
    btn.addEventListener("click", () => {
      active = name;
      chipsBox.querySelectorAll(".work-chip").forEach((c) =>
        c.setAttribute("aria-pressed", String(c === btn))
      );
      apply();
    });
    chipsBox.appendChild(btn);
  });

  // Modal shell
  const modal = document.createElement("div");
  modal.className = "work-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML =
    '<div class="work-modal-card"><button class="work-modal-close" type="button" aria-label="Close details">✕</button>' +
    '<p class="eyebrow warm">Case study</p><h3></h3><h4></h4><p class="work-modal-desc"></p>' +
    '<div class="tags work-modal-tags"></div></div>';
  document.body.appendChild(modal);
  const mTitle = modal.querySelector("h3");
  const mSub = modal.querySelector("h4");
  const mDesc = modal.querySelector(".work-modal-desc");
  const mTags = modal.querySelector(".work-modal-tags");
  const closeModal = () => modal.classList.remove("is-open");
  modal.querySelector(".work-modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // Per-card Details button
  cards.forEach((card) => {
    const copy = card.querySelector(".project-copy");
    if (!copy || copy.querySelector(".work-details")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-link work-details";
    btn.textContent = "View case study →";
    btn.addEventListener("click", () => {
      mTitle.textContent = card.querySelector("h3")?.textContent || "Project";
      mSub.textContent = card.querySelector("h4")?.textContent || "";
      mDesc.textContent = card.querySelector(".project-copy > p")?.textContent || "";
      mTags.innerHTML = "";
      card.querySelectorAll(".tags span").forEach((t) => {
        const s = document.createElement("span");
        s.textContent = t.textContent;
        mTags.appendChild(s);
      });
      modal.classList.add("is-open");
    });
    copy.appendChild(btn);
  });

  function matches(card, q) {
    const text = card.textContent.toLowerCase();
    const tagOk = active === "All" || text.includes(active.toLowerCase());
    return tagOk && (!q || text.includes(q));
  }

  function apply() {
    const q = (search?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const show = matches(card, q);
      card.classList.toggle("is-hidden", !show);
      if (show) visible++;
    });
    // Hide empty pair wrappers gracefully (pair grid with both hidden)
    document.querySelectorAll(".project-pair").forEach((pair) => {
      const anyVisible = [...pair.querySelectorAll("article")].some((a) => !a.classList.contains("is-hidden"));
      pair.style.display = anyVisible ? "" : "none";
    });
    if (count) count.textContent = visible + " / " + cards.length + " projects shown";
  }

  search?.addEventListener("input", apply);
  apply();
})();
