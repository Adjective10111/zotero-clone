# Route Helper

in this file, I've provided the routes to be used as URLs for the API.

## Routes

### public files

#### `GET /profiles/{email}.jpg`

fetches the profile pic of users

#### `GET /logos/{name}.jpg`

fetches the logo of group

#### `GET /icons/{name}.png`

fetches the attachment-type's icon

##### the APIs below are under /api route

### /settings

#### `GET /`

fetches the below data:

- siteURL
- appVer
- privacyPolicy

### /users

#### `POST /signUp`

creates a new user and returns a cookie and a bearer token

- mandatory:
  - 'name': string
  - 'email': email
  - 'password': string above 8 chars long
- allowed:
  - 'profile': image file
  - 'role': don't need to set, they're all users for now

#### `POST /login`

logs you in and returns a cookie and a bearer token

- mandatory:
  - 'email': email
  - 'password': string above 8 chars long

#### `DELETE /logout`

deletes the cookie, adds the token to the blacklist, and logs you out

#### `GET /me`

fetch the user itself

#### `PATCH /me`

patch the user

- allowed:
  - 'name': string
  - 'profile': image file
  - 'role': don't need to set, they're all users for now

#### `PATCH /changePassword`

changes the password

- mandatory:
  - 'currentPassword': string above 8 chars long
  - 'newPassword': string above 8 chars long

#### `DELETE /me`

deletes the account

- mandatory:
  - 'currentPassword': string above 8 chars long

#### `DELETE /terminateSessions`

terminates all sessions and logs all of them out

### /groups

#### `GET /public`

fetches all the groups that are in our app

###### for now... may be modified later

#### `GET /`

fetch all the users' groups

#### `POST /`

creates a group

- mandatory:
  - 'name': string
  - 'owner': user - will be filled automatically
- allowed:
  - 'logo': image file
  - 'members' - a JSON string representing an array of:
    - user: userId | email
    - canAdd: boolean
    - canEdit: boolean
    - canDelete: boolean

    if you do not provide a 'can{access}' key, the default value will be set:
    - canAdd: true
    - canEdit & canDelete: false

#### `GET /{id}`

fetches the group with specified id

#### `PATCH /{id}`

patches the group with specified id

- allowed:
  - 'logo': image file
  - 'name': string
  - 'members' - a JSON string representing an array of:
    - user: userId | email
    - canAdd: boolean
    - canEdit: boolean
    - canDelete: boolean
  - 'newMembers' - a JSON string representing an array of objects with properties below, that will be added to members:
    - user: userId | email
    - canAdd: boolean
    - canEdit: boolean
    - canDelete: boolean

if you do not provide a 'can{access}' key, the default value will be set:

- canAdd: true
- canEdit & canDelete: false

##### either use 'members' or 'newMembers' - DO NOT USE THEM BOTH

#### `DELETE /{id}`

deletes the specified group

### /libraries

#### `GET /public`

fetches all the public libraries that are in our app

#### `GET /`

retrieves the user's libraries

#### `POST /`

create a library

- mandatory:
  - 'name': string
  - 'owner': user - will be filled automatically
- allowed:
  - 'group': group - if its set, the owner will be set to the owner of group
  - 'private': boolean - default value is false

#### `GET /{id}`

get specific library

#### `PATCH /{id}`

patches the specified library

- allowed:
  - 'name': string
  - 'group': group - if its set, the owner will be set to the owner of group
  - 'private': boolean - default value is false

#### `DELETE /{id}`

deletes the library

### /collections

#### `GET /{id}`

fetch collection

#### `GET ../libraries/{id}/collections`

fetch a library's collections

#### `POST ../libraries/{id}/collections`

add a collection to the library

- mandatory:
  - 'name': string
  - 'parent': library
- allowed:
  - 'type': will be set automatically
  - 'searchQuery': mongoose.FilterQuery as string - it will be used for as a saved search

#### `PATCH /{id}`

patches the collection

- allowed:
  - 'name': string
  - 'searchQuery': mongoose.FilterQuery as string - it will be used for as a saved search

#### `DELETE /{id}`

delete the collection

### /items

#### `POST ../collections/{id}/items`

adds an item to the collection

- mandatory:
  - 'name': string
  - 'library': library - will be set automatically
  - 'parentCollection': collection - will be set automatically
- allowed:
  - 'primaryAttachment': attachment - the attachment which's metadata will be used
  - 'itemType': itemType - default: undefined type's id
  - 'metadata': object
  - 'tags': TagObject[] - { name: string, color: string }
  - 'related': Item[]

#### `GET ../collections/{id}/items`

fetch collection's items

#### `GET /{id}`

fetch item

#### `PATCH /{id}`

patch item

- allowed:
  - 'name': string
  - 'parentCollection': collection
  - 'primaryAttachment': attachment - the attachment which's metadata will be used
  - 'itemType': itemType - default: undefined type's id
  - 'metadata': object
  - 'tags': TagObject[] - { name: string, color: string }
  - 'related': Item[]

#### `DELETE /{id}`

delete item

### /tags

#### `GET /`

fetches all of user's tags

#### `GET /library/{id}`

fetches all the tags of items of the library

#### `GET /collection/{id}`

fetches all the tags of items of the collection

#### `GET /item/{id}`

fetches all the tags of the item

<!-- #### `GET /libraries`

fetches all the libraries that contain at least an item with the given tag

#### `GET /collections`

fetches all the collections that contain at least an item with the given tag

#### `GET /items`

fetches all the items with the tag -->

### /attachments

#### `GET /{id}/file`

download attached file

#### `POST ../items/{id}/attachments`

attaches an attachment to the item

- mandatory:
  - 'name': string
  - 'parent': Item - will be set automatically
  - 'type': attachmentType id
  - 'file': Any File
- allowed:
  - 'setAsPrimaryAttachment': boolean

#### `GET ../items/{id}/attachments`

fetch item's attachments

#### `GET /{id}`

fetch attachment

#### `PATCH /{id}`

patches attachment

- allowed:
  - 'name': string
  - 'parent': Item - will be set automatically
  - 'type': attachmentType

#### `DELETE /{id}`

delete attachment

### /notes

#### `POST ../items/{id}/notes`

add note to the item

- mandatory:
  - 'parent': sets automatically
  - 'parentModel': sets automatically
  - 'text': string

#### `POST ../collections/{id}/notes`

add note to the collection

- mandatory:
  - 'parent': sets automatically
  - 'parentModel': sets automatically
  - 'text': string

#### `GET ../items/{id}/notes`

fetch item's notes

#### `GET ../collections/{id}/notes`

fetch collection's notes

#### `GET /{id}`

fetch note

#### `PATCH /{id}`

patch note

- allowed:
  - 'parent': collection | item
  - 'parentModel': 'parentCollection' | 'parentItem'
  - 'text': string

#### `DELETE /{id}`

delete note

### /attachmentTypes

#### `GET /`

fetch attachment types

#### `POST /`

create new attachment type

- mandatory:
  - 'name': string
  - 'api': string - link
  - 'metadataKeys': string[] | csv-style string
- allowed:
  - 'icon': image file

## Query Params - GET ALL

### Page: number

paginates the bulk get requests.

`default: 1`

### limit: number

limits the number of data that gets sent

`default: 25`

### sort: string - comma separated

sorts the data gotten from database

use `-` for descending order

### fields: string - comma separated

selects what properties to get

you can use `-` to exclude a property

### ANY: any

You can also filter by any parameter available in the structure of the data you're trying to fetch.

To do so, you just need to provide the key, by which you want to filter data, and use literals or mongodb queries in *[brackets]*.

for example:

```GET api/aGetAllLink?aKey[gte]=5``` - it gets all the data provided by *`api/aGetAllLink`* and filtered by the ones having *aKey* value greater than or equal to 5.

```GET api/aGetAllLink?aKey[ne]=science&anotherKey=bachelor``` - it filters by the ones having *aKey* value not equal to **'science'** and *anotherKey* equal to **'bachelor'**.
