document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("copy", (event) => event.preventDefault());
document.addEventListener("cut", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => {
  if (!event.target.closest("input, textarea")) event.preventDefault();
});
