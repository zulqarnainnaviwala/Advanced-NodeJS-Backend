//Extending Nodejs Error class to customise our "Api Error Only", which will remain same for our app to maintain consistancy
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong", //default if no message was passed
    errors = [],
    statck = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    //if error is exists in Error, assign that as well
    if (statck) {
      this.stack = statck;
    } else {
      // https://nodejs.org/api/errors.html#errorcapturestacktracetargetobject-constructoropt
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export { ApiError };
