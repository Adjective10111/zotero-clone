# Zotero clone

It's a clone of zotero implemented by typescript and mongodb.
This is the backend part of it for synchronization using accounts.
It also provides an API for information fetching, citation, bibliography, advanced search and more.

## Session todo

- tags performance
- api calls for metadata fetching

## Routes

To access POSTMAN collection click on [link](https://college-312-dorm.postman.co/workspace/Zotero-clone~5f1d8efa-63a2-4c8c-9562-97de4253d81e/collection/22982170-812e4bea-eaeb-4375-b42d-844b4ed77645)

### public files

#### `GET /profiles/{email}.jpg`

fetches the profile pic of users

#### `GET /logos/{name}.jpg`

fetches the logo of group

#### `GET /icons/{name}.png`

fetches the attachment-type's icon

##### the APIs below are under /api route

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

#### `DELETE /terminateSessions`

terminates all sessions and logs all of them out

### /groups

#### `GET /`

fetch all the users' groups

#### `POST /`

creates a group

- mandatory:
  - 'name': string
  - 'owner': user - will be filled automatically
- allowed:
  - 'logo': image file
  - 'editors': user[] - they will have access to the group's libraries

#### `GET /{id}`

fetches the group with specified id

#### `PATCH /{id}`

patches the group with specified id

- allowed:
  - 'logo': image file
  - 'name': string
  - 'editors': user[] - they will have access to the group's libraries
  - 'newEditors': user[] - they will be added to the group's editors

##### either use 'editors' or 'newEditors' - DO NOT USE THEM BOTH

#### `DELETE /{id}`

deletes the specified group

### /libraries

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
