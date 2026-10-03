(() => {
  const icon = (paths, label) => `<svg class="doodle" viewBox="0 0 120 120" role="img" aria-label="${label}"><g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
  window.CampusDoodle = {
    people: () => icon('<circle cx="60" cy="30" r="14"/><path d="M32 92c2-20 13-33 28-33s26 13 28 33M20 46l-12 8M100 46l12 8M31 70l-16 13M89 70l16 13"/>', 'Campus community'),
    campus: () => icon('<path d="M12 50 60 20l48 30M20 53v45h80V53M38 98V68h16v30M66 98V68h16v30M10 105h100"/><path d="M60 20v-10"/>', 'Campus building'),
    shield: () => icon('<path d="M60 12 100 28v30c0 25-17 41-40 50-23-9-40-25-40-50V28z"/><path d="m40 60 13 13 28-30"/>', 'Authorization'),
    document: () => icon('<path d="M34 12h36l16 16v80H34zM70 12v18h16M46 54h28M46 70h28M46 86h18"/>', 'Document'),
    search: () => icon('<circle cx="52" cy="52" r="27"/><path d="m73 73 28 28M43 52l7 7 13-16"/>', 'Matching'),
    complaint: () => icon('<path d="M25 24h70v51H53l-20 19V75H25zM43 44h34M43 58h22"/>', 'Complaint'),
  };
})();
