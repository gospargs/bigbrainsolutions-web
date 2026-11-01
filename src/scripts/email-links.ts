// Assembles the public address at runtime so it never sits in the static HTML for scrapers.
// Joined from an array so the bundler can't fold it back into one string.
const address = ['info', 'bigbrain-solutions.com'].join('@');

document.querySelectorAll<HTMLAnchorElement>('[data-email-link]').forEach((link) => {
  link.href = `mailto:${address}`;
  link.textContent = address;
});
