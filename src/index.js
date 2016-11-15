module.exports = function graphqlServerExpressUpload(options) {
  function isUpload(req) {
    return Boolean(
      req.baseUrl === options.endpointURL &&
      req.method === 'POST' &&
      req.is('multipart/form-data')
    );
  }
  return function(req, res, next) {
    if (!isUpload(req)) {
      return next();
    }
    var files = req.files;
    var body = req.body;
    var variables = JSON.parse(body.variables);
    // append files to variables
    files.forEach(file => {
      if (!variables[file.fieldname]) {
        variables[file.fieldname] = [];
      }
      variables[file.fieldname].push(file);
    })
    req.body =  {
      operationName: body.operationName,
      query: body.query,
      variables: variables
    };
    return next();
  }
}
