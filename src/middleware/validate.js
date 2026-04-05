const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    Object.defineProperty(req, source, {
      value: parsed,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
