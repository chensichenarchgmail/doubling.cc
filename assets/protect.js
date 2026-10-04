document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("copy", (event) => event.preventDefault());
document.addEventListener("cut", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => {
  const target = event.target instanceof Element ? event.target : event.target.parentElement;
  if (!target?.closest("input, textarea")) event.preventDefault();
});
