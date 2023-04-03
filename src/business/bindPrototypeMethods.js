const bindPrototypeMethods = (obj) => {
  const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(obj));
  propertyNames
    .filter((p) => p !== "constructor" && typeof obj[p] === "function")
    .forEach((p) => (obj[p] = obj[p].bind(obj)));
};

export default bindPrototypeMethods;
