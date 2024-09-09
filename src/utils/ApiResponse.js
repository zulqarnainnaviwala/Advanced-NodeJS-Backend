// class to customise our "Api Response"
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    //https://developer.mozilla.org/en-US/docs/Web/HTTP/Status (reason for < 400 )
    this.success = statusCode < 400;
  }
}
