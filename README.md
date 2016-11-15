# graphql-server-express-upload

Graphql Server Express file upload middleware. Used together with [UploadNetworkInterface](https://github.com/HriBB/apollo-upload-network-interface/releases).

## Usage

#### 1. Add `graphqlExpressUpload` middleware to your Express GraphQL endpoint

```
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express'
import graphqlExpressUpload from 'graphql-server-express-upload'
import multer from 'multer'

import schema from './schema'

const upload = multer({
  dest: config.tmp.path,
})

app.use('/graphql',
  upload.array('files'),
  // after multer and before graphqlExpress
  graphqlExpressUpload({ endpointURL: '/graphql' }),
  graphqlExpress((req) => {
    return {
      schema,
      context: {}
    }
  })
)

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}))
```

#### 2. Add `UploadedFile` scalar to your schema

```
scalar UploadedFile
```

#### 3. Add `UploadedFile` resolver

For now we simply use JSON. In the future we should improve this.

```
const resolvers = {
  UploadedFile: {
    __parseLiteral: parseJSONLiteral,
    __serialize: value => value,
    __parseValue: value => value,
  }
  ...
}

function parseJSONLiteral(ast) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = Object.create(null);
      ast.fields.forEach(field => {
        value[field.name.value] = parseJSONLiteral(field.value);
      });

      return value;
    }
    case Kind.LIST:
      return ast.values.map(parseJSONLiteral);
    default:
      return null;
  }
}
```

#### 4. Add mutation on the server

Schema definition

```
uploadProfilePicture(id: Int!, files: [UploadedFile!]!): ProfilePicture
```

And the mutation function

```
async uploadProfilePicture(root, { id, files }, context) {
  // you can now access files parameter from variables
  console.log('uploadProfilePicture', { id, files })
  //...
}
```

#### 5. Add mutation on the client

Example using `react-apollo`. Don't forget that you need to be using [UploadNetworkInterface](https://github.com/HriBB/apollo-upload-network-interface/releases), because `apollo-client` does not support `multipart/form-data` out of the box.

```
import React, { Component, PropTypes } from 'react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class UploadProfilePicture extends Component {

  onSubmit = (fields) => {
    const { user, uploadProfilePicture } = this.props
    // fields.files is an instance of FileList
    uploadProfilePicture(user.id, fields.files)
      .then(({ data }) => {
        console.log('data', data);
      })
      .catch(error => {
        console.log('error', error.message);
      })
  }

  render() {
    return (
      //...
    )
  }

}

const ADD_SALON_RESOURCE_PICTURE = gql`
  mutation uploadProfilePicture($id: Int!, $files: [UploadedFile!]!) {
    uploadProfilePicture(id: $id, files: $files) {
      id url thumb square small medium large full
    }
  }`

const withFileUpload = graphql(ADD_SALON_RESOURCE_PICTURE, {
  props: ({ ownProps, mutate }) => ({
    uploadProfilePicture: (id, files) => mutate({
      variables: { id, files },
    }),
  }),
})

export default withFileUpload(UploadProfilePicture)
```
