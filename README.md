# Hybrid Practice

#Troubleshooting
1. Error message:

  ```
  An error occurred while installing eventmachine (1.0.5), and Bundler cannot continue.
  Make sure that `gem install eventmachine -v '1.0.5'` succeeds before bundling.
  ```

  Open the Gemfile.lock file:
  ```
  vim Gemfile.lock
  ```
  And change 
  ```
  eventmachine (1.0.5)
  ```
  to
  ```
  eventmachine (1.0.9)
  ```
  Now run 
  ```
  bundle install
  ```
  again.

2. Error message:
  ```
  ./project.h:116:10: fatal error: 'openssl/ssl.h' file not found
  #include <openssl/ssl.h>
  ```
  The [suggested fix](https://github.com/eventmachine/eventmachine/issues/643) is to use the openssl headers (they are no longer included by default on El Capitan):
  ```
  brew link openssl --force
  ```
  But linking keg-only openssl means you may end up linking against the insecure, deprecated system OpenSSL while using the headers from Homebrew's openssl. Instead, install eventmachine 1.0.9 instead (see error #1 for instructions).
  
