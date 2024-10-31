/** Trim input value */
export function trimInput(node:HTMLInputElement) {
  const updateVal = () => {
    if (/\s/g.test(node.value)) {
      node.value = node.value.trim();
    }
  };

  try {
    node.addEventListener("input", updateVal);
  } catch (error) {
    console.log('Action trimInput error', error);
  }
}

/** Lowercase value */
export function toLowerCase(node:HTMLInputElement) {
  const updateVal = () => {
    node.value = node.value.toLowerCase();
  };

  try {
    node.addEventListener("input", updateVal);
  } catch (error) {
    console.log('Action toLowerCase error', error);
  }
}

/** Replace special characters */
export function replaceSpecialChars(node:HTMLInputElement) {
  const updateVal = () => {
    const inputValue = node.value;
    node.value = node.value?.replace(/[&\/\#\=, +()$~%.'":@^*?<>{}]/g, "");
  };

  try {
    node.addEventListener("input", updateVal);
  } catch (error) {
    console.log('Action replaceSpecialChars error', error);
  }
}
