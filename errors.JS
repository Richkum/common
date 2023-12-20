// PURPOSE OF ERRORS 

The main purpose of errors in Node.js is to provide a clear and concise way to handle errors,
 prevent crashes, and ensure the application remains functional.

- Event Emitter:  Node.js uses an event-driven,
 non-blocking I/O model, which is based on the Event Emitter API. 
 When an error occurs, it is propagated as an 'error' event,
 allowing the developer to handle the error gracefully.

-Asynchronous Callbacks:In Node.js, asynchronous operations often use callback functions,
 which are passed an Error object as their first argument.
 If the operation is successful, the Error object is null,
 and any operation-specific results are passed as additional arguments.

-Promise Rejection:In modern Node.js applications, 
the use of Promises is increasingly common. When a Promise is rejected, it results in an 'unhandledRejection' event,
 allowing the developer to handle the error in a centralized manner.

-Uncaught Exceptions: If an error is thrown and not caught by the Node.js runtime,
 it results in an 'uncaughtException' event.
 This provides an opportunity to handle the error before the application crashes.

//  * TYPES OF ERRORS

 Standard Errors: These are instances of the JavaScript Error object and can be thrown or passed to callbacks using the standard Error() constructor.

 const err = new Error('Something bad happened');

 System Errors: These are low-level errors triggered by the underlying operating system,
  such as running out of file descriptors or trying to access a non-existent file.
   System errors are instances of the Node.js built-in SystemError object and inherit from Error.

 const fs = require('fs');

fs.readFile('/nonexistent', (err, data) => {
 if (err) {
    console.error(err);
 }
});

User-Defined Errors: These are custom error types created by developers to provide more information about the specific context in which an error occurred.
 User-defined errors should inherit from Error to ensure consistency with built-in errors.
class ValidationError extends Error {
  constructor(message) {
     super(message);
     this.name = 'ValidationError';
  }
 }
 
 throw new ValidationError('Invalid email address');

//  * ERROR PROPAGATION AND INTERCEPTION