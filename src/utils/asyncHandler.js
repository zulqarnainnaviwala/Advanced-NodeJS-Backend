// Wrapper function to handle our all Api db calls
// by returning Promise (higher order function)
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};
export { asyncHandler };

// const asyncHandler = () => {};
// const asyncHandler = (func) => () => {};
// const asyncHandler = (func) => async () => {};
// const asyncHandler = (func) => { return async () => {}};

// by async-await (higher order function)
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
