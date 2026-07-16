function getSectionId(link) {
  const hash = link.hash || link.getAttribute("href") || "";
  if (!hash.startsWith("#")) return "";

  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

export function initScrollSpy({ navigation, sections, region = null }) {
  if (!navigation) return () => {};

  const links = [...navigation.querySelectorAll('a[href^="#"]')];
  const sectionList = [...sections];
  const linksBySectionId = new Map(links.map((link) => [getSectionId(link), link]));
  const trackedSections = sectionList.filter((section) => linksBySectionId.has(section.id));

  if (!trackedSections.length) return () => {};

  let activeSectionId = "";
  let animationFrame = 0;

  const setActiveSection = (sectionId = "") => {
    if (sectionId === activeSectionId) return;
    activeSectionId = sectionId;

    links.forEach((link) => {
      const isActive = getSectionId(link) === sectionId;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const update = () => {
    animationFrame = 0;
    const activationLine = Math.min(Math.max(window.innerHeight * 0.3, 112), 240);
    const trackedRegion = region || trackedSections[0].parentElement;
    const regionBounds = trackedRegion?.getBoundingClientRect();
    const firstSectionBounds = trackedSections[0].getBoundingClientRect();
    const lastSectionBounds = trackedSections.at(-1).getBoundingClientRect();

    if (
      !regionBounds ||
      regionBounds.top > activationLine ||
      regionBounds.bottom <= activationLine ||
      firstSectionBounds.top > activationLine ||
      lastSectionBounds.bottom <= activationLine
    ) {
      setActiveSection();
      return;
    }

    let currentSection = trackedSections[0];

    trackedSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) currentSection = section;
    });

    setActiveSection(currentSection.id);
  };

  const scheduleUpdate = () => {
    if (animationFrame) return;
    animationFrame = window.requestAnimationFrame(update);
  };

  const handleNavigationClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || !navigation.contains(link)) return;
    setActiveSection(getSectionId(link));
  };

  navigation.addEventListener("click", handleNavigationClick);
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("hashchange", scheduleUpdate);
  scheduleUpdate();

  return () => {
    navigation.removeEventListener("click", handleNavigationClick);
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("hashchange", scheduleUpdate);
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  };
}
