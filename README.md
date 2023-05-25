# Zotero clone

It's a clone of zotero implemented by typescript and mongodb.
This is the backend part of it for synchronization using accounts.
It also provides an API for information fetching, citation, bibliography, advanced search and more.

## Routes

### public files

#### GET /profiles/{email}.jpg

fetches the profile pic of users
<!-- todo -->
#### GET /icons/

fetches the attachment-type's icon
<!-- todo -->
#### GET /logos/

fetches the logo of group

##### the APIs below are under /api route

### /users

#### POST /signUp

creates a new user

- mandatory:
  - 'name': string
  - 'email': email
  - 'password': string above 8 chars long
- allowed:
  - 'profile': image file
  - 'role': don't need to set, they're all users for now

#### POST /login

logs you in and returns a cookie and a bearer token

- mandatory:
  - 'email': email
  - 'password': string above 8 chars long

#### DELETE /logout

deletes the cookie, adds the token to the blacklist, and logs you out

#### GET /me

fetch the user itself

#### PATCH /me

patch the user

- allowed:
  - 'name': string
  - 'profile': image file
  - 'role': don't need to set, they're all users for now

#### PATCH /changePassword

changes the password

- mandatory:
  - 'currentPassword': string above 8 chars long
  - 'newPassword': string above 8 chars long

### groups

### libraries

### collections

### items

### attachments

### notes

### attachment

## Session todo

- tag performance
- api calls for metadata fetching
